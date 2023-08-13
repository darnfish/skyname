import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import axios from 'axios'

import Input from '../components/Input'
import Button from '../components/Button'

import { useDomains, useUser } from '../utils/hooks'
import Select from '../components/Select'

const MAX_USERNAMES = 3

export default function Index() {
	const domains = useDomains()
	const domainsList = Object.keys(domains)
	const { user, fetchUser, credentials, logout } = useUser()

	const [usernames, setUsernames] = useState(null)

	const [subdomain, setSubdomain] = useState('')
	const [selectedDomain, setSelectedDomain] = useState('')

	const username = useMemo(() => [subdomain, selectedDomain].join('.').toLowerCase(), [subdomain, selectedDomain])
	const [confirmed, setConfirmed] = useState(false)
	const [isRegistering, setRegistering] = useState(false)
	const [setAsPrimaryUsername, setSetAsPrimaryUsername] = useState(true)
	const [releasingUsernameId, setReleasingUsername] = useState('')
	const [switchingToUsernameId, setSwitchingToUsernameId] = useState('')

	/**
	 * Username Availability
	 */
	const [available, setAvailable] = useState(false)
	const [isCheckingAvailability, setCheckingAvailability] = useState(false)
	const checkAvailabilityTimeoutRef = useRef(null)

	const isUsernameValid = useMemo(() => subdomain.length > 0 && selectedDomain.length > 0, [subdomain, selectedDomain])

	/**
	 * Default Username
	 */
	const defaultUsername = useMemo(() => usernames?.[0]?.previousUsername || user?.handle, [usernames, user])

	const fetchUsernames = useCallback(async () => {
		try {
			const { data: usernames } = await axios.get('/api/list', {
				headers: {
					Authorization: `Bearer ${credentials.accessToken}`
				}
			})

			setUsernames(usernames)
		} catch {

		}
	}, [credentials])

	const checkUsername = useCallback(async () => {
		setCheckingAvailability(true)

		try {
			const { data } = await axios.post('/api/check', {
				subdomain,
				domain: selectedDomain
			}, {
				headers: {
					Authorization: `Bearer ${credentials.accessToken}`
				}
			})

			setAvailable(data.available)
		} catch {

		}

		setCheckingAvailability(false)
	}, [subdomain, selectedDomain, credentials, setAvailable, setCheckingAvailability])

	useEffect(() => {
		if(subdomain.length === 0 || selectedDomain.length === 0) {
			setCheckingAvailability(false)

			return
		}

		setCheckingAvailability(true)

		if(checkAvailabilityTimeoutRef.current) {
			clearTimeout(checkAvailabilityTimeoutRef.current)
			checkAvailabilityTimeoutRef.current = null
		}

		checkAvailabilityTimeoutRef.current = setTimeout(checkUsername, 500)
	}, [subdomain, selectedDomain])

	const registerUsername = useCallback(async () => {
		setRegistering(true)

		try {
			await axios.post('/api/register', {
				domain: selectedDomain,
				subdomain,
				setAsPrimaryUsername
			}, {
				headers: {
					Authorization: `Bearer ${credentials.accessToken}`
				}
			})

			setConfirmed(false)
			setSetAsPrimaryUsername(true)

			setSubdomain('')
			setSelectedDomain('')

			fetchUser() // also calls fetchUsernames
		} catch {

		}

		setRegistering(false)
	}, [subdomain, selectedDomain, credentials])

	const switchToUsername = useCallback(async (id: string) => {
		setSwitchingToUsernameId(id)

		try {
			await axios.post('/api/switch', {
				id
			}, {
				headers: {
					Authorization: `Bearer ${credentials.accessToken}`
				}
			})

			fetchUser() // also calls fetchUsernames
		} catch {

		}

		setSwitchingToUsernameId('')
	}, [credentials, setSwitchingToUsernameId])

	const releaseUsername = useCallback(async (id: string) => {
		setReleasingUsername(id)
	
		try {
			await axios.post('/api/release', {
				id
			}, {
				headers: {
					Authorization: `Bearer ${credentials.accessToken}`
				}
			})

			// Remove username
			setUsernames(usernames => usernames.filter(username => username.id !== id))
			fetchUser() // also calls fetchUsernames
		} catch {

		}

		setReleasingUsername('')
	}, [credentials, fetchUsernames, setReleasingUsername])

	useEffect(() => {
		if(!user)
			return

			fetchUsernames()
	}, [user])

	if(!user)
		return <></>

	const usernameOwner = domains[selectedDomain]

	return (
		<div className="w-screen h-screen flex flex-col items-center my-5">
			<div className="flex flex-col mx-5 md:w-1/2 xl:w-1/3 overflow-scroll">
				<div className="flex flex-row mb-3">
					<div>
					<p className="text-3xl font-bold">Skyname<span className="uppercase align-super text-xs ml-1 text-red-500">BETA</span></p>
						<p>Free, unique usernames for Bluesky</p>
					</div>
					<div className="flex-grow" />
					<img src={user.avatar} className="h-10 rounded-full cursor-pointer" onClick={() => {
						if(!confirm('Would you like to log out?'))
							return

							logout()
					}} />
				</div>
				{defaultUsername && (
					<div className={`bg-black/5 px-3 py-2 mb-2`}>
						<p className="text-lg">{defaultUsername}</p>
						<p className="text-sm">Default username</p>
						<p className="text-sm">{defaultUsername === user.handle ? <a className="text-green-500">In Use</a> : <a className={`font-semibold ${!!switchingToUsernameId ? 'cursor-not-allowed opacity-25' : 'hover:underline cursor-pointer text-blue-500'} ${switchingToUsernameId === 'default' ? 'cursor-wait' : ''}`} onClick={() => !!switchingToUsernameId ? {} : switchToUsername('default')}>{switchingToUsernameId === 'default' ? 'Switching...' : 'Set as Primary'}</a>}</p>
					</div>
				)}
				<div className="bg-black/5 px-5 py-3 mb-3">
					<p className="text-xl font-bold mb-2">Usernames ({usernames?.length || 0}/{MAX_USERNAMES})</p>
					{usernames ? (
						<>
						{usernames.length > 0 ? (
							<>
								{usernames.map((username, i) => {
									const isReleasingUsername = username.id === releasingUsernameId
									const isReleasingSomeUsername = !!releasingUsernameId

									const isSwitchingToUsername = username.id === switchingToUsernameId
									const isSwitchingToSomeUsername = !!switchingToUsernameId
									
									const isLastUsername = i === usernames.length - 1
									
									const usernameString = [username.subdomain, username.domain].join('.')
									const isUsernameInUse = usernameString === user.handle 

									return (
										<div className={`bg-black/5 px-3 py-2 ${isLastUsername ? '' : 'mb-2'}`} key={username.id}>
											<p className="text-lg">{usernameString}</p>
											<p className="text-sm">{isUsernameInUse ? <a className="text-green-500">In Use</a> : <a className={`font-semibold ${isSwitchingToSomeUsername ? 'cursor-not-allowed opacity-25' : 'hover:underline cursor-pointer text-blue-500'} ${isSwitchingToUsername ? 'cursor-wait' : ''}`} onClick={() => isSwitchingToSomeUsername ? {} : switchToUsername(username.id)}>{isSwitchingToUsername ? 'Switching...' : 'Set as Primary'}</a>} &bull; <span className="opacity-75">Registered {new Date(username.createdAt).toDateString()} &bull; </span><a className={`text-red-500 ${isReleasingSomeUsername ? 'cursor-not-allowed' : 'cursor-pointer hover:underline'}`} onClick={() => isReleasingSomeUsername ? {} : releaseUsername(username.id)}>{isReleasingUsername ? 'Deleting...' : 'Delete'}</a></p>
										</div>
									)
								})}
								<p className="text-xs opacity-75 mt-2"><b>Tip</b>: even if you're not using a username as your primary username, these usernames will still resolve to your account when clicked or mentioned!</p>
							</>
						) : (
							<p>You don't own any usernames :~(</p>
						)}
						</>
					) : (
						<p>Loading usernames...</p>
					)}
				</div>
				<div className="bg-black/5 px-5 py-3">
					<p className="text-xl font-bold mb-2">Register a username</p>
					{(usernames?.length || 0) < MAX_USERNAMES ? (
						<div className="w-full">
							<div className="w-full flex flex-row">
								<Input className="flex-grow" type="text" placeholder="Subdomain" value={subdomain} onChange={e => setSubdomain(e.target.value?.trim() || '')} />
								<div className="w-2" />
								<Select className="flex-grow" value={selectedDomain} onChange={e => setSelectedDomain(e.target.value)}>
									<option value="">Select a domain</option>
									{domainsList.map(domain => (
										<option value={domain} key={domain}>.{domain}</option>
									))}
								</Select>
							</div>
							{(available && !isCheckingAvailability && isUsernameValid) && (
								<div className="mb-2">
									{usernameOwner.verified ? (
										<div className="text-white bg-green-500 px-3 py-2 mb-2">
											<p>{selectedDomain} is owned by Skyname</p>
										</div>
									) : (
										<div className="text-white bg-yellow-500 px-3 py-2 mb-2">
											<p>{selectedDomain} is owned by <a className="underline" href={usernameOwner.usernameUrl}>@{usernameOwner.username}</a>{usernameOwner.attestationUrl ? <>, they have submitted attestation to keeping this username alive <a className="underline" href={usernameOwner.attestationUrl} target="_blank">here</a></> : ''}</p>
										</div>
									)}
									<p className="text-sm font-semibold">Registration Agreement</p>
									<div className="text-sm opacity-75 mb-2">
										<p>Upon clicking the button below, your Bluesky username will be automatically updated to <b>{username}</b>.</p>
										<ul>
											<li>
												&bull; If you're using a default username tied to your server, such as <i>example.bsky.social</i>, this will automatically be released to the public for anyone to use.
											</li>
											<li>
												&bull; If you're using a custom username, such as <i>example.com</i>, this will not be released to the public as it is scoped to your Bluesky account.
											</li>
										</ul>
										<p>We will make every effort to continue to host your username on our infrastructure for free as long as we can. However, there is no guarantee that usernames will last forever. In the case of a loss of username or service, you will always be able to change your username back on the Bluesky app.</p>
									</div>
									<div className="flex items-start mb-1">
										<input className="mt-[5px]" type="checkbox" checked={confirmed} onChange={e => setConfirmed(_confirmed => !_confirmed)}></input>
										<p className="ml-2 cursor-default" onClick={() => setConfirmed(_confirmed => !_confirmed)}>I am aware that by registering <b>{username}</b> on Skyname by clicking the button below, I may permanently lose my current username, and that I am not guaranteed to keep this username for perpetuity.</p>
									</div>
									<div className="flex items-start mb-2">
										<input className="mt-[5px]" type="checkbox" checked={setAsPrimaryUsername} onChange={e => setSetAsPrimaryUsername(_primary => !_primary)}></input>
										<div className="ml-2  cursor-default" onClick={() => setSetAsPrimaryUsername(_primary => !_primary)}>
											<p>Use as primary username</p>
											<p className="text-xs">Automatically set <b>{username}</b> as your primary username on Bluesky. This will be visible on your profile. Registered usernames, even if not set as primary, will always resolve to your account when clicked or mentioned</p>
										</div>
									</div>
								</div>
							)}
							<Button className="w-full" onClick={registerUsername} disabled={!available || !isUsernameValid ||!confirmed || isRegistering || isCheckingAvailability}>
								{(isCheckingAvailability ? (
									`Checking availability for ${username}...`
								) : (
									(isRegistering ? (
										`Registering ${username}...`
									) : (
										isUsernameValid ? (
											available ? (
												`Register ${username}`
											) : (
												'This username is not available'
											)
										) : (
											'Select a subdomain and a domain'
										)
									))
								))}
							</Button>
						</div>
					) : (
						<p>You've hit the maximum of three usernames registered :~(</p>
					)}
				</div>
				<p className="text-sm opacity-75 mt-2"><a href="https://github.com/darnfish/skyname">View source on GitHub</a></p>
			</div>
		</div>
	)
}
