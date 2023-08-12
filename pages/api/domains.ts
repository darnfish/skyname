import { NextApiRequest, NextApiResponse } from 'next'

import { useConfig, useDomains } from '../../lib/dns'

type Domain = {
	verified: boolean
	username?: string
	usernameUrl?: string
	attestationUrl?: string
}

type DomainResponse = {
	[key in string]: Domain
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
	if(request.method !== 'GET')
		return response.status(405).json({ error: 'Method is not GET' })

	const config = useConfig()
	const domains = useDomains()

	const body: DomainResponse = {}

	for(const domain of domains) {
		const details = config.domains[domain]
		const provider = config.providers[details.provider]

		body[domain] = provider.attestation
	}

  response.status(200).json(body)
}
