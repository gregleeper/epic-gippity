import { useRouteLoaderData } from '@remix-run/react'
import { type loader as appLoader } from '#app/routes/app.tsx'
import { invariant } from './misc.tsx'

/**
 * @returns the request info from the root loader
 */
export function useRequestInfo() {
	const data = useRouteLoaderData<typeof appLoader>('routes/app')
	console.log('data', data)
	invariant(data?.requestInfo, 'No requestInfo found in app loader')

	return data.requestInfo
}
