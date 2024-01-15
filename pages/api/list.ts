import { NextApiRequest, NextApiResponse } from 'next'

// Custom
import knex from '../../lib/knex'
import { verifyUser } from '../../lib/atproto'
import { RegistrationRow } from '../../lib/misc'

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
	/**
	 * Check if it's a GET
	 */
	if(request.method !== 'GET') {
		response.status(405).json({ error: 'Method is not GET' })
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
	 * Find all usernames
	 */
	const rows = await knex('registrations').where({ actor: user.did, server }).whereNull('invalidated_at')

	/**
	 * Transform
	 */
	const registeredUsernames = rows.map((row: RegistrationRow) => ({
		id: row.id,
		createdAt: row.created_at,
		subdomain: row.subdomain,
		domain: row.domain,
		previousUsername: row.previous_username
	}))

	response.status(200).json(registeredUsernames)
}
