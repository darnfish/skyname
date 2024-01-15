import { NextApiRequest, NextApiResponse } from 'next'

import { v4 as uuid } from 'uuid'

import knex from '../../lib/knex'
import { doesDomainExist, useProvider } from '../../lib/dns'
import { RegistrationRow } from '../../lib/misc'
import sendTelegramMessage from '../../lib/telegram'
import isSubdomainExplicit from '../../lib/swearWords'
import { fetchUser, updateUsername, verifyUser, waitForUsernameToResolve } from '../../lib/atproto'

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
	/**
	 * Check if it's not a POST
	 */
	if(request.method !== 'POST') {
		response.status(405).json({ error: 'Method is not POST' })
		return
	}

	/**
	 * Check if Authorization header is valid
	 */
	const { authorization } = request.headers
	const [tokenType, token] = authorization.split(' ')
	if(tokenType !== 'Bearer' || token.length === 0) {
		response.status(401).json({ error: 'Authorization header missing or malformed' })
		return
	}

	/**
	 * Get server from request body
	 */
	const { server = 'bsky.social' } = request.body
	if(!server) {
		response.status(400).json({ error: 'No server found in request body' })
		return
	}

	/**
	 * Get user from ATProto
	 */
	const user = await verifyUser(token, server)

	/**
	 * Check request body
	 */
	let { subdomain, domain, setAsPrimaryUsername } = request.body
	if(!subdomain || !domain) {
		response.status(400).json({ error: 'Subdomain or domain invalid' })
		return
	}

	subdomain = subdomain.toLowerCase()
	domain = domain.toLowerCase()

	if(subdomain.trim().length === 0 || !doesDomainExist(domain)) {
		response.status(400).json({ error: 'Subdomain or domain invalid' })
		return
	}

	/**
	 * Check for naughty words
	 */
	const explicit = isSubdomainExplicit(subdomain)
	if(explicit) {
		response.status(400).json({ error: 'Subdomain not allowed' })
		return
	}
	
	// Get provider
	const { provider, zoneId, disallowedSubdomains } = useProvider(domain)

	/**
	 * Don't allow if subdomain is not allowed
	 */
	if(disallowedSubdomains?.includes(subdomain)) {
		response.status(500).json({ error: 'Subdomain not allowed' })
		return
	}

	/**
	 * Check if username already exists
	 */
	const existingRows = await knex('registrations').where({ subdomain, domain }).whereNull('invalidated_at')
	if(existingRows.length > 0) {
		// TODO: check if username is not being used, if not, allow

		response.status(409).json({ error: 'Username already taken' })
		return
	}

	/**
	 * Get the users previous username to revert to upon deletion
	 */
	let previousUsername: string = user.handle

	const previousUsernameRows = await knex('registrations').first().where({ actor: user.did, server }).whereNull('invalidated_at')
	if(previousUsernameRows?.length > 0)
		previousUsername = (previousUsernameRows[0] as RegistrationRow).previous_username

	/**
	 * Add to Cloudflare
	 */
	const { result: record }: any = await provider.dnsRecords.add(zoneId, {
		type: 'TXT',
		name: ['_atproto', subdomain].join('.'),
		content: `did=${user.did}`,
		ttl: 1 // auto
	})

	/**
	 * Register username in database
	 */
	await knex('registrations').insert({ id: uuid(), actor: user.did, server, subdomain, domain, previous_username: previousUsername, record_id: record.id })

	const username = [subdomain, domain].join('.')

	if(setAsPrimaryUsername) {
		const resolved = await waitForUsernameToResolve(username, user.did, server)
		if(!resolved) {
			response.status(500).json({ error: 'Timed out waiting for username to resolve' })
			return
		}
	
		/**
		 * Update Bluesky username
		 */
		await updateUsername(username, token, server)

		sendTelegramMessage(`<code>@${username}</code> registered and updated a new username! They were previously <code>@${user.handle}</code>`)
	} else
		sendTelegramMessage(`<code>@${username}</code> registered a new username!`)

	response.status(200).send('')
}
