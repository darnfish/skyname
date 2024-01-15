import { NextApiRequest, NextApiResponse } from 'next'


// Custom
import knex from '../../lib/knex'
import { useProvider } from '../../lib/dns'
import { RegistrationRow } from '../../lib/misc'
import sendTelegramMessage from '../../lib/telegram'
import { updateUsername, verifyUser } from '../../lib/atproto'

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
	const { id } = request.body
	if(!id) {
		response.status(400).json({ error: 'Identifier missing or invalid' })
		return
	}

	/**
	 * Check if user owns username
	 */
	const rows = await knex('registrations').where({ id, actor: user.did, server }).whereNull('invalidated_at')
	if(rows.length === 0) {
		response.status(401).json({ error: 'Username not found' })
		return
	}

	const [row] = rows as RegistrationRow[]

	/**
	 * Delete from Cloudflare
	 */
	const { provider, zoneId } = useProvider(row.domain)
	await provider.dnsRecords.del(zoneId, row.record_id)

	/**
	 * Release username in database
	 */
	await knex('registrations').update({ invalidated_at: new Date() }).where('id', row.id)

	/**
	 * Get the users previous username to revert to upon deletion
	 */
	const releasedUsername = [row.subdomain, row.domain].join('.')
	const isUsingReleasedUsername = releasedUsername === user.handle

	let previousUsername: string = row.previous_username

	if(isUsingReleasedUsername) {
		const previousUsernameRows = await knex('registrations').first().where({ actor: user.did, server }).whereNull('invalidated_at')
		if(previousUsernameRows?.length > 0)
			previousUsername = `${(previousUsernameRows[0] as RegistrationRow).subdomain}.${(previousUsernameRows[0] as RegistrationRow).domain}`
	
		/**
		 * Update Bluesky username to previous
		 */
		await updateUsername(previousUsername, token, server)
	}

	sendTelegramMessage(`<code>@${previousUsername}</code> released their username <code>@${[row.subdomain, row.domain].join('.')}</code>`)

	response.status(200).send('')
}
