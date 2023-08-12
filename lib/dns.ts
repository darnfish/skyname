import Cloudflare from 'cloudflare'

export function useConfig() {
	const encodedConfig = process.env.SKYNAME_CONFIG
	const decodedConfig = Buffer.from(encodedConfig, 'base64').toString('utf8')
	const config = JSON.parse(decodedConfig)

	return config
}

export function useDomains() {
	const { domains } = useConfig()

	return Object.keys(domains)
}

export function doesDomainExist(domain: string) {
	const domains = useDomains()

	return domains.includes(domain)
}

export function useProvider(domain: string) {
	if(!doesDomainExist(domain))
		throw new Error('Domain not found')

	const { domains, providers } = useConfig()
	const { provider: providerName, zoneId, disallowedSubdomains } = domains[domain]
	if(!providers[providerName])
		throw new Error('Provider not found')

	// TODO: use service for other DNS providers
	const { token } = providers[providerName]

	const client = new Cloudflare({ token })

	return {
		provider: client,
		zoneId,
		disallowedSubdomains
	}
}
