import { createId as cuid } from '@paralleldrive/cuid2'
import { redirect } from '@remix-run/node'
import { GoogleStrategy } from 'remix-auth-google'
// import { z } from 'zod'
// import { cache, cachified } from '../cache.server.ts'
import { connectionSessionStorage } from '../connections.server.ts'
import { MOCK_CODE_GOOGLE, MOCK_CODE_GOOGLE_HEADER } from './constants.ts'
import { type AuthProvider } from './provider.ts'
// const GoogleUserSchema = z.object({ login: z.string() })
// const GoogleUserParseResult = z
// 	.object({
// 		success: z.literal(true),
// 		data: GoogleUserSchema,
// 	})
// 	.or(
// 		z.object({
// 			success: z.literal(false),
// 		}),
// 	)

const shouldMock =
	process.env.GOOGLE_CLIENT_ID?.startsWith('MOCK_') ||
	process.env.NODE_ENV === 'test'

export class GoogleProvider implements AuthProvider {
	getAuthStrategy() {
		return new GoogleStrategy(
			{
				clientID: process.env.GOOGLE_CLIENT_ID ?? '',
				clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
				callbackURL: '/auth/google/callback',
			},
			async ({ profile }) => {
				const email = profile.emails[0]?.value.trim().toLowerCase()
				if (!email) {
					throw new Error('Email not found')
				}
				const username = profile.displayName
				const imageUrl = profile.photos[0].value
				// Cache the user profile data
				// await cachified({
				// 	key: `google-profile:${profile.id}`,
				// 	cache,
				// 	ttl: 1000 * 60 * 60, // 1 hour
				// 	swr: 1000 * 60 * 60 * 24, // 1 day
				// 	getFreshValue: async () => ({
				// 		email,
				// 		id: profile.id,
				// 		username,
				// 		name: profile.name.givenName,
				// 		imageUrl,
				// 	}),
				// })
				return {
					email,
					id: profile.id,
					username,
					name: profile.name.givenName,
					imageUrl,
				}
			},
		)
	}
}

// async resolveConnectionData(
// 	providerId: string,
// 	{ timings }: { timings?: Timings } = {},
// ) {
// 	const result = await cachified({
// 		key: `connection-data:github:${providerId}`,
// 		cache,
// 		timings,
// 		ttl: 1000 * 60,
// 		swr: 1000 * 60 * 60 * 24 * 7,
// 		async getFreshValue(context) {
// 			const response = await fetch(
// 				`https://api.google.com/user/${providerId}`,
// 				{ headers: { Authorization: `token ${process.env.GOOGLE_TOKEN}` } },
// 			)
// 			const rawJson = await response.json()
// 			const result = GoogleUserParseResult.safeParse(rawJson)
// 			if (!result.success) {
// 				// if it was unsuccessful, then we should kick it out of the cache
// 				// asap and try again.
// 				context.metadata.ttl = 0
// 			}
// 			return result
// 		},
// 		checkValue: GoogleUserParseResult,
// 	})
// 	return {
// 		displayName: result.success ? result.data.login : 'Unknown',
// 		link: result.success ? `https://google.com/${result.data.login}` : null,
// 	} as const
// }

export async function handleMockAction(request: Request) {
	if (!shouldMock) return

	const connectionSession = await connectionSessionStorage.getSession(
		request.headers.get('cookie'),
	)
	const state = cuid()
	connectionSession.set('oauth2:state', state)

	// allows us to inject a code when running e2e tests,
	// but falls back to a pre-defined 🐨 constant
	const code = request.headers.get(MOCK_CODE_GOOGLE_HEADER) || MOCK_CODE_GOOGLE
	const searchParams = new URLSearchParams({ code, state })
	throw redirect(`/auth/google/callback?${searchParams}`, {
		headers: {
			'set-cookie':
				await connectionSessionStorage.commitSession(connectionSession),
		},
	})
}
