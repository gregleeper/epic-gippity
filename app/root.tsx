import { cssBundleHref } from '@remix-run/css-bundle'
import { type MetaFunction, type LinksFunction } from '@remix-run/node'
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from '@remix-run/react'
import { withSentry } from '@sentry/remix'
import { href as iconsHref } from '#app/components/ui/icon.tsx'
import fontStyleSheetUrl from '#app/styles/font.css'
import tailwindStyleSheetUrl from '#app/styles/tailwind.css'
import { useNonce } from './utils/nonce-provider.ts'
import { type Theme } from './utils/theme.server.ts'

export async function loader() {
	return {
		requestInfo: {
			user: null,
		},
	}
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return [
		{ title: data ? 'Prosper Education' : 'Error | Prosper Education' },
		{ name: 'description', content: `Prosper Education` },
	]
}
export const links: LinksFunction = () => {
	return [
		// Preload svg sprite as a resource to avoid render blocking
		{ rel: 'preload', href: iconsHref, as: 'image' },
		// Preload CSS as a resource to avoid render blocking
		{ rel: 'preload', href: fontStyleSheetUrl, as: 'style' },
		{ rel: 'preload', href: tailwindStyleSheetUrl, as: 'style' },
		cssBundleHref ? { rel: 'preload', href: cssBundleHref, as: 'style' } : null,
		{ rel: 'mask-icon', href: '/favicons/favicon-gradient.ico' },
		// {
		// 	rel: 'alternate icon',
		// 	type: 'image/png',
		// 	href: '/favicons/favicon-32x32.png',
		// },
		// { rel: 'apple-touch-icon', href: '/favicons/apple-touch-icon.png' },
		{
			rel: 'manifest',
			href: '/site.webmanifest',
			crossOrigin: 'use-credentials',
		} as const, // necessary to make typescript happy
		//These should match the css preloads above to avoid css as render blocking resource
		{
			rel: 'icon',
			type: 'image/svg+xml',
			href: '/favicons/favicon-gradient.ico',
		},
		{ rel: 'stylesheet', href: fontStyleSheetUrl },
		{ rel: 'stylesheet', href: tailwindStyleSheetUrl },
		cssBundleHref ? { rel: 'stylesheet', href: cssBundleHref } : null,
	].filter(Boolean)
}
function Document({
	children,
	nonce,
	theme = 'light',
	env = {},
}: {
	children: React.ReactNode
	nonce: string
	theme?: Theme
	env?: Record<string, string>
}) {
	return (
		<html lang="en" className={`${theme} h-full  overflow-x-hidden`}>
			<head>
				<Meta />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				<Links />
			</head>
			<body className="text-gray-950 antialiased">
				{children}
				<script
					nonce={nonce}
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(env)}`,
					}}
				/>
				<ScrollRestoration nonce={nonce} />
				<Scripts nonce={nonce} />
				<LiveReload nonce={nonce} />
			</body>
		</html>
	)
}
function App() {
	const nonce = useNonce()
	return (
		<Document nonce={nonce}>
			<div>
				<Outlet />
			</div>
		</Document>
	)
}

export default withSentry(App)

// function UserDropdown() {
// 	const user = useUser()
// 	const submit = useSubmit()
// 	const formRef = useRef<HTMLFormElement>(null)
// 	return (
// 		<DropdownMenu>
// 			<DropdownMenuTrigger asChild>
// 				<Button asChild variant="secondary">
// 					<Link
// 						to={`/users/${user.username}`}
// 						// this is for progressive enhancement
// 						onClick={e => e.preventDefault()}
// 						className="flex items-center gap-2"
// 					>
// 						<img
// 							className="h-8 w-8 rounded-full object-cover"
// 							alt={user.name ?? user.username}
// 							src={getUserImgSrc(user.image?.id)}
// 						/>
// 						<span className="text-body-sm font-bold">
// 							{user.name ?? user.username}
// 						</span>
// 					</Link>
// 				</Button>
// 			</DropdownMenuTrigger>
// 			<DropdownMenuPortal>
// 				<DropdownMenuContent sideOffset={8} align="start">
// 					<DropdownMenuItem asChild>
// 						<Link prefetch="intent" to={`/users/${user.username}`}>
// 							<Icon className="text-body-md" name="avatar">
// 								Profile
// 							</Icon>
// 						</Link>
// 					</DropdownMenuItem>
// 					<DropdownMenuItem asChild>
// 						<Link prefetch="intent" to={`/users/${user.username}/notes`}>
// 							<Icon className="text-body-md" name="pencil-2">
// 								Notes
// 							</Icon>
// 						</Link>
// 					</DropdownMenuItem>
// 					<DropdownMenuItem
// 						asChild
// 						// this prevents the menu from closing before the form submission is completed
// 						onSelect={event => {
// 							event.preventDefault()
// 							submit(formRef.current)
// 						}}
// 					>
// 						<Form action="/logout" method="POST" ref={formRef}>
// 							<Icon className="text-body-md" name="exit">
// 								<button type="submit">Logout</button>
// 							</Icon>
// 						</Form>
// 					</DropdownMenuItem>
// 				</DropdownMenuContent>
// 			</DropdownMenuPortal>
// 		</DropdownMenu>
// 	)
// }
