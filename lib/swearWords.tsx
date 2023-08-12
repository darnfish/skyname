import BadWords from 'bad-words'

const filter = new BadWords()

export default function isSubdomainExplicit(subdomain: string) {
	return filter.isProfane(subdomain)
}
