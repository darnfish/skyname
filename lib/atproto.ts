import axios from 'axios'
import { decode } from 'jsonwebtoken'

export async function fetchUser(did: string, token: string, server = 'bsky.social') {
	const { data: user } = await axios.get(`https://${server}/xrpc/app.bsky.actor.getProfile`, {
		params: {
			actor: did
		},
		headers: {
			Authorization: `Bearer ${token}`
		}
	})

	return user
}

export function verifyUser(token: string, server = 'bsky.social') {
	const { sub: did } = decode(token)

	return fetchUser(did as string, token, server)
}

const RESOLVE_USERNAME_RETRIES = 50

export async function waitForUsernameToResolve(username: string, did: string, server = 'bsky.social') {
	let resolved = false

	// Try 20 times
	for(let i = 0; i < RESOLVE_USERNAME_RETRIES; i++) {
		try {
			const { data } = await axios.get(`https://${server}/xrpc/com.atproto.identity.resolveHandle`, {
				params: {
					handle: username
				}
			})

			console.log(`Username ${username} on ${server} to provisioned!`)

			if(data.did !== did)
				throw new Error('DID mismatch')

			resolved = true
			break
		} catch(error) {
			console.log(`Waiting for username ${username} on ${server} to provision... (attempt ${i}/${RESOLVE_USERNAME_RETRIES})`)
		}

		await new Promise(resolve => setTimeout(resolve, 1000))
	}

	return resolved
}

const UPDATE_USERNAME_RETRIES = 20

export async function updateUsername(username: string, token: string, server = 'bsky.social') {
	for(let i = 0; i < UPDATE_USERNAME_RETRIES; i++) {
		try {
			await axios.post(`https://${server}/xrpc/com.atproto.identity.updateHandle`, {
				handle: username
			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			})
			
			console.log(`Updated ${username} on ${server}!`)

			break
		} catch {
			console.log(`Updating ${username} on ${server} (attempt ${i}/${UPDATE_USERNAME_RETRIES})`)
		}
	}
}
