import { getFormProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import {
	type ActionFunctionArgs,
	type DataFunctionArgs,
	type HeadersFunction,
	redirect,
	json,
} from '@remix-run/node'
import {
	Outlet,
	Form,
	Link,
	useLoaderData,
	useFetchers,
	useFetcher,
} from '@remix-run/react'
import { forwardRef } from 'react'
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import { ServerOnly } from 'remix-utils/server-only'
import { z } from 'zod'
import { Confetti } from '#app/components/confetti.tsx'
import { EpicProgress } from '#app/components/progress-bar.tsx'
import { EpicToaster } from '#app/components/toaster.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import {
	NavigationMenu,
	NavigationMenuList,
	NavigationMenuItem,
	NavigationMenuTrigger,
	NavigationMenuContent,
	NavigationMenuLink,
} from '#app/components/ui/navigation-menu.tsx'
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from '#app/components/ui/popover.tsx'
import { getUserId, logout } from '#app/utils/auth.server.ts'
import { getHints, useHints } from '#app/utils/client-hints.tsx'
import { getConfetti } from '#app/utils/confetti.server.ts'
import { csrf } from '#app/utils/csrf.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getEnv } from '#app/utils/env.server.ts'
import { honeypot } from '#app/utils/honeypot.server.ts'
import { cn, combineHeaders, getDomainUrl } from '#app/utils/misc.tsx'
import { useRequestInfo } from '#app/utils/request-info.ts'
import { getTheme, setTheme, type Theme } from '#app/utils/theme.server.ts'
import { makeTimings, time } from '#app/utils/timing.server.ts'
import { getToast } from '#app/utils/toast.server.ts'

export async function loader({ request }: DataFunctionArgs) {
	const timings = makeTimings('root loader')
	const userId = await time(() => getUserId(request), {
		timings,
		type: 'getUserId',
		desc: 'getUserId in root',
	})

	const user = userId
		? await time(
				() =>
					prisma.user.findUniqueOrThrow({
						select: {
							id: true,
							name: true,
							username: true,
							image: { select: { id: true } },
							roles: {
								select: {
									name: true,
									permissions: {
										select: { entity: true, action: true, access: true },
									},
								},
							},
							subscriptionStatus: true,
							subscriptionId: true,
						},
						where: { id: userId },
					}),
				{ timings, type: 'find user', desc: 'find user in root' },
		  )
		: null
	if (userId && !user) {
		console.info('something weird happened')
		// something weird happened... The user is authenticated but we can't find
		// them in the database. Maybe they were deleted? Let's log them out.
		await logout({ request, redirectTo: '/' })
	}
	const { toast, headers: toastHeaders } = await getToast(request)
	const { confettiId, headers: confettiHeaders } = getConfetti(request)
	const honeyProps = honeypot.getInputProps()
	const [csrfToken, csrfCookieHeader] = await csrf.commitToken()

	return json(
		{
			user,
			requestInfo: {
				hints: getHints(request),
				origin: getDomainUrl(request),
				path: new URL(request.url).pathname,
				userPrefs: {
					theme: getTheme(request),
				},
			},
			ENV: getEnv(),
			toast,
			confettiId,
			honeyProps,
			csrfToken,
		},
		{
			headers: combineHeaders(
				{ 'Server-Timing': timings.toString() },
				toastHeaders,
				confettiHeaders,
				csrfCookieHeader ? { 'set-cookie': csrfCookieHeader } : null,
			),
		},
	)
}

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	const headers = {
		'Server-Timing': loaderHeaders.get('Server-Timing') ?? '',
	}
	return headers
}

const ThemeFormSchema = z.object({
	theme: z.enum(['system', 'light', 'dark']),
	// this is useful for progressive enhancement
	redirectTo: z.string().optional(),
})

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: ThemeFormSchema,
	})

	invariantResponse(submission.status === 'success', 'Invalid theme received')

	const { theme, redirectTo } = submission.value

	const responseInit = {
		headers: { 'set-cookie': setTheme(theme) },
	}
	if (redirectTo) {
		return redirect(redirectTo, responseInit)
	} else {
		return json({ result: submission.reply() }, responseInit)
	}
}

const navComponents: { title: string; href: string; description: string }[] = [
	{
		title: 'Assignments',
		href: '/app/assignment',
		description: 'Create assignments and submit student work',
	},
	{
		title: 'Lesson Plans',
		href: '/app/lesson-plan',
		description: 'Create and manage lesson plans',
	},
	{
		title: 'Unit Plans',
		href: '/app/unit-plan',
		description: 'Create and manage unit plans',
	},
	{
		title: 'DOK',
		href: '/app/dok',
		description: 'Create and view Depth of Knowledge Qs',
	},
	{
		title: 'Rubric',
		href: '/app/rubric',
		description: 'Create and manage rubrics',
	},
]

const profileComponents: {
	title: string
	href: string
	description: string
}[] = [
	{
		title: 'Profile',
		href: '/app/settings/profile',
		description: 'Manage your profile',
	},
	// {
	// 	title: 'Settings',
	// 	href: '/settings',
	// 	description: 'Manage your settings',
	// },
]

function App() {
	const theme = useTheme()
	const data = useLoaderData<typeof loader>()
	const user = data.user
	return (
		<>
			<div className="flex min-h-screen flex-col justify-between">
				<div className="flex w-full items-center justify-start py-4">
					<div className="py2 w-1/4 px-4">
						<div className="h-20 w-20">
							{theme === 'dark' ? (
								<img src="/ProsperIconWhiteLine.png" alt="Prosper Logo" />
							) : (
								<img src="/ProsperIcon.png" alt="Prosper Logo" />
							)}
						</div>
					</div>
					<div className="w-3/4">
						<NavigationMenu>
							<NavigationMenuList>
								<NavigationMenuItem>
									<NavigationMenuTrigger>Menu</NavigationMenuTrigger>
									<NavigationMenuContent>
										<ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
											{navComponents.map(component => (
												<ListItem
													href={component.href}
													title={component.title}
													key={component.href}
												>
													{component.description}
												</ListItem>
											))}
										</ul>
									</NavigationMenuContent>
								</NavigationMenuItem>
								<NavigationMenuItem>
									<NavigationMenuTrigger>Profile</NavigationMenuTrigger>
									<NavigationMenuContent>
										<ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
											{profileComponents.map(component => (
												<ListItem
													href={component.href}
													title={component.title}
													key={component.href}
												>
													{component.description}
												</ListItem>
											))}
										</ul>
									</NavigationMenuContent>
								</NavigationMenuItem>
							</NavigationMenuList>
						</NavigationMenu>
					</div>
					{user ? (
						<div
							className="ml-auto mr-12 transition-opacity duration-300 ease-in-out"
							style={{ opacity: user ? 1 : 0 }}
						>
							<Popover>
								<PopoverTrigger asChild>
									<Button variant="outline">Account</Button>
								</PopoverTrigger>
								<PopoverContent className="w-[200px]">
									<ul className="grid gap-3 p-4">
										<li>
											<Form method="POST" action="/logout">
												<Button
													type="submit"
													className="w-full rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-700"
												>
													Logout
												</Button>
											</Form>
										</li>
									</ul>
								</PopoverContent>
							</Popover>
						</div>
					) : null}
				</div>

				<div className="flex-grow">
					<Outlet />
				</div>
			</div>
			<Confetti id={data.confettiId} />
			<EpicToaster toast={data.toast} />
			<EpicProgress />
			<footer className="flex w-full justify-between  border-t pb-5 text-foreground">
				<div className="container my-8 flex justify-between gap-10">
					<div className="w-1/4">
						<ThemeSwitch userPreference={data.requestInfo.userPrefs.theme} />
					</div>
					<div className="flex w-full items-center justify-between gap-10 ">
						{/* list the about page, privacy page, home page */}
						<div className="flex w-3/4 items-center justify-around gap-6">
							<Link to="/" className="text-foreground` text-sm font-medium">
								Home
							</Link>
							<Link
								to="/about"
								className="text-foreground` text-sm font-medium"
							>
								About
							</Link>
							<Link
								to="/privacy"
								className="text-foreground` text-sm font-medium"
							>
								Privacy
							</Link>
						</div>

						<div className=" w-1/4 text-right">
							<span className="text-sm font-medium text-foreground ">
								© {new Date().getFullYear().toString()} Prosper Education
							</span>
						</div>
					</div>
				</div>
			</footer>
		</>
	)
}
export default function AppWithProviders() {
	const data = useLoaderData<typeof loader>()
	return (
		<AuthenticityTokenProvider token={data.csrfToken}>
			<HoneypotProvider {...data.honeyProps}>
				<App />
			</HoneypotProvider>
		</AuthenticityTokenProvider>
	)
}
/**
 * @returns the user's theme preference, or the client hint theme if the user
 * has not set a preference.
 */
export function useTheme() {
	const hints = useHints()
	const requestInfo = useRequestInfo()
	const optimisticMode = useOptimisticThemeMode()
	if (optimisticMode) {
		return optimisticMode === 'system' ? hints.theme : optimisticMode
	}
	return requestInfo.userPrefs.theme ?? hints.theme
}

/**
 * If the user's changing their theme mode preference, this will return the
 * value it's being changed to.
 */
export function useOptimisticThemeMode() {
	const fetchers = useFetchers()
	const themeFetcher = fetchers.find(
		f => f.formAction === '/resources/theme-switch',
	)

	if (themeFetcher && themeFetcher.formData) {
		const submission = parseWithZod(themeFetcher.formData, {
			schema: ThemeFormSchema,
		})

		if (submission.status === 'success') {
			return submission.value.theme
		}
	}
}

export function ThemeSwitch({
	userPreference,
}: {
	userPreference?: Theme | null
}) {
	const fetcher = useFetcher<typeof action>()
	const requestInfo = useRequestInfo()

	const [form] = useForm({
		id: 'theme-switch',
		lastResult: fetcher.data?.result,
	})

	const optimisticMode = useOptimisticThemeMode()
	const mode = optimisticMode ?? userPreference ?? 'system'
	const nextMode =
		mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system'
	const modeLabel = {
		light: (
			<Icon name="sun">
				<span className="sr-only">Light</span>
			</Icon>
		),
		dark: (
			<Icon name="moon">
				<span className="sr-only">Dark</span>
			</Icon>
		),
		system: (
			<Icon name="laptop">
				<span className="sr-only">System</span>
			</Icon>
		),
	}

	return (
		<fetcher.Form
			method="POST"
			{...getFormProps(form)}
			action="/resources/theme-switch"
		>
			<ServerOnly>
				{() => (
					<input type="hidden" name="redirectTo" value={requestInfo.path} />
				)}
			</ServerOnly>
			<input type="hidden" name="theme" value={nextMode} />
			<div className="flex gap-2">
				<button
					type="submit"
					className="flex h-8 w-8 cursor-pointer items-center justify-center"
				>
					{modeLabel[mode]}
				</button>
			</div>
		</fetcher.Form>
	)
}

const ListItem = forwardRef<
	React.ElementRef<'a'>,
	React.ComponentPropsWithoutRef<'a'>
>(({ className, title, children, ...props }, ref) => {
	return (
		<li>
			<NavigationMenuLink asChild>
				<a
					ref={ref}
					className={cn(
						'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
						className,
					)}
					{...props}
				>
					<div className="text-sm font-medium leading-none">{title}</div>
					<p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
						{children}
					</p>
				</a>
			</NavigationMenuLink>
		</li>
	)
})
ListItem.displayName = 'ListItem'
