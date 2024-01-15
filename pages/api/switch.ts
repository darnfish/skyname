import { NextApiRequest, NextApiResponse } from 'next'

import knex from '../../lib/knex'
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
		response.status(405).send('')
		return
	}

	/**
	 * Check if Authorization header is valid
	 */
	const { authorization } = request.headers
	const [tokenType, token] = authorization.split(' ')
	if(tokenType !== 'Bearer' || token.length === 0) {
		response.status(401).send('')
		return
	}

	/**
	 * Get server from request body
	 */
	const { server = 'bsky.social' } = request.body
	if(!server) {
		response.status(400).send('')
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
		response.status(400).send('')
		return
	}

	let username: string

	switch(id) {
	case 'default': {
		const rows = await knex('registrations').where({ actor: user.did, server }).whereNull('invalidated_at')
		if(rows.length === 0) {
			response.status(401).send('')
			return
		}

		const [row] = rows as RegistrationRow[]

		username = row.previous_username

		break
	}
	default: {
		const rows = await knex('registrations').where({ id, actor: user.did, server }).whereNull('invalidated_at')
		if(rows.length === 0) {
			response.status(401).send('')
			return
		}
	
		const [row] = rows as RegistrationRow[]
	
		username = [row.subdomain, row.domain].join('.')

		break
	}
	}

	/**
	 * Update Bluesky username
	 */
	await updateUsername(username, token, server)

	sendTelegramMessage(`<code>@${user.handle}</code> updated their username to <code>@${username}</code>`)

	response.status(200).send('')
}
