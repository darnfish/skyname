import { useMemo, useEffect, useState, useCallback } from 'react'

import axios from 'axios'
import { useRouter } from 'next/router'
import { useCookies } from 'react-cookie'

export function useUser() {
	const router = useRouter()
	const [cookies, setCookie, deleteCookie] = useCookies(['did', 'server', 'access_token', 'refresh_token'])

	const did = useMemo(() => cookies.did, [cookies])
	const server = useMemo(() => cookies.server, [cookies])
	const accessToken = useMemo(() => cookies.access_token, [cookies])
	const refreshToken = useMemo(() => cookies.refresh_token, [cookies])
	
	const isLoggedIn = useMemo(() => did && server && accessToken && refreshToken, [did, server, accessToken, refreshToken])

	const [user, setUser] = useState(null)

	const clearSession = useCallback(() => {
		deleteCookie('did')
		deleteCookie('server')
		deleteCookie('access_token')
		deleteCookie('refresh_token')
	}, [deleteCookie])

	const fetchUser = useCallback(async () => {
		try {
			const { data: user } = await axios.get(`https://${server}/xrpc/app.bsky.actor.getProfile`, {
				params: {
					actor: did
				},
				headers: {
					Authorization: `Bearer ${accessToken}`
				}
			})

			setUser(user)
		} catch {
			clearSession()
		}
	}, [did, accessToken, setUser, clearSession])

	useEffect(() => {
		if(isLoggedIn && router.route === '/login')
			router.push('/')

		if(!isLoggedIn && router.route !== '/login') {
			router.push('/login')
			clearSession()
		}

		if(isLoggedIn)
			fetchUser()
	}, [
		fetchUser,
		clearSession,

		isLoggedIn
	])

	return {
		user,
		fetchUser,
		credentials: isLoggedIn && {
			accessToken,
			refreshToken
		},
		logout: clearSession
	}
}

export function useDomains() {
	const [domains, setDomains] = useState({})

	const fetchDomains = useCallback(async () => {
		const { data: domains } = await axios.get(`/api/domains`)

		setDomains(domains)
	}, [setDomains])

	useEffect(() => {
		fetchDomains()
	}, [])

	return domains
}
