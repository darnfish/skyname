import { NextApiRequest, NextApiResponse } from 'next'

import knex from '../../lib/knex'
import isSubdomainExplicit from '../../lib/swearWords'

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
	if(request.method !== 'POST')
		return response.status(405).json({ error: 'Method is not POST' })

	let { subdomain, domain } = request.body
	if(!subdomain || !domain)
		return response.status(400).json({ error: 'Subdomain or domain invalid' })

	subdomain = subdomain.toLowerCase()
	domain = domain.toLowerCase()

	/**
	 * Check for naughty words
	 */
	const explicit = isSubdomainExplicit(subdomain)
	if(explicit) {
		response.status(200).json({ available: false })
		return
	}
	
	const rows = await knex('registrations').where({ subdomain, domain }).whereNull('invalidated_at')
		
  response.status(200).json({ available: rows.length === 0 })
}
