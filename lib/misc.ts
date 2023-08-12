export const TLD_REGEX = /^((?!-))(xn--)?[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}\.(xn--)?([a-z0-9\-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$/i
export interface RegistrationRow {
	id: string
	created_at: Date
	invalidated_at?: Date
	actor: string
	subdomain: string
	domain: string
	previous_username: string
	record_id: string
}
