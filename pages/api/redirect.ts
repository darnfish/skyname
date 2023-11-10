import { NextApiRequest, NextApiResponse } from 'next'

import knex from '../../lib/knex'

export default async function handler(
	request: NextApiRequest,
	response: NextApiResponse,
) {
	/**
	 * Check if it's not a GET
	 */
	if(request.method !== 'GET') {
		response.status(405).json({ error: 'Method is not GET' })
		return
	}

	const host = request.headers.host
	const hostParts = host.split('.')
 
	const domain = [hostParts.at(-2), hostParts.at(-1)].join('.')
	const subdomain = hostParts.slice(0, -2).join('.')
	
	const rows = await knex('registrations').where({ subdomain, domain }).whereNull('invalidated_at')
	if(rows.length === 0)
		return response.redirect('https://skyna.me')

	response.redirect(`https://bsky.app/profile/${rows[0].actor}`)
}
