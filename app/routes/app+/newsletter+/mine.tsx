import { type NewsLetter } from '@prisma/client'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLocation, Outlet, useLoaderData, Link } from '@remix-run/react'
import { ChevronsUpDown } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '#app/components/ui/button.tsx'
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.tsx'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '#app/components/ui/collapsible.tsx'
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '#app/components/ui/resizable.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { cn } from '#app/utils/misc.tsx'
import { requireUserWithValidSubscription } from '#app/utils/permissions.ts'

export async function loader({ params, request }: LoaderFunctionArgs) {
	const userId = await requireUserWithValidSubscription(request)
	const newsletters = await prisma.newsLetter.findMany({
		where: {
			userId: userId,
		},
		orderBy: {
			createdAt: 'desc',
		},
	})
	const newslettersByDate = groupNewslettersByDate(newsletters)

	const newslettersByDateJSON = JSON.stringify(
		Array.from(newslettersByDate.entries()),
	)

	return json({
		newsletters,
		newslettersByDateJSON,
	})
}

function groupNewslettersByDate(newsletters: NewsLetter[]) {
	let newslettersByDate = new Map()

	for (let newsletter of newsletters) {
		let date = newsletter.createdAt.toISOString().split('T')[0] // get the date part
		if (!newslettersByDate.has(date)) {
			newslettersByDate.set(date, [])
		}
		newslettersByDate.get(date).push(newsletter)
	}

	return newslettersByDate
}

export default function MyNewsletters() {
	const loaderData = useLoaderData<typeof loader>()

	const newslettersByDate = useMemo(
		() =>
			new Map(
				JSON.parse(loaderData.newslettersByDateJSON) as [
					string,
					NewsLetter[],
				][],
			) as Map<string, NewsLetter[]>,
		[loaderData.newslettersByDateJSON],
	)

	const [dateIsExpanded, setDateIsExpanded] = useState<
		Map<string, { open: boolean }>
	>(new Map())

	const location = useLocation()
	const [selectedNewsletterId, setSelectedNewsletterId] = useState<
		string | null
	>(null)

	useEffect(() => {
		if (location.pathname.endsWith('/mine')) {
			setSelectedNewsletterId(null)
		} else if (location.pathname.includes('/mine/')) {
			setSelectedNewsletterId(location.pathname.split('/').at(-1) || null)
		}
	}, [location.pathname])

	useEffect(() => {
		const initialOpenState = new Map()
		for (const [date, values] of newslettersByDate) {
			let open = values.some(n => n.id === selectedNewsletterId)
			initialOpenState.set(date, { open })
		}
		setDateIsExpanded(initialOpenState)
	}, [selectedNewsletterId, newslettersByDate])

	const toggleOpen = (date: string) => {
		setDateIsExpanded(prevState => {
			const newState = new Map(prevState)
			newState.set(date, { open: !newState.get(date)?.open })
			return newState
		})
	}

	return (
		<div className="h-full">
			<ResizablePanelGroup
				direction="horizontal"
				className="h-full max-w-full rounded-lg"
			>
				<ResizablePanel
					defaultSize={25}
					className="max-h-screen overflow-y-scroll"
				>
					<div className="mx-10 mt-4">
						<h1 className="text-2xl font-semibold">My Newsletters</h1>
					</div>
					<div className="mt-4 max-h-screen overflow-auto">
						{Array.from(newslettersByDate.entries()).map(
							([date, newsletters]) => (
								<Collapsible
									key={date}
									open={dateIsExpanded.get(date)?.open}
									onOpenChange={() => toggleOpen(date)}
									className="mt-6 space-y-2"
								>
									<div className="flex items-center justify-center">
										<div className="text-lg font-bold">
											{new Date(date).toLocaleDateString()} -{' '}
											{newsletters.length} newsletters
										</div>
										<CollapsibleTrigger asChild>
											<Button variant="ghost" size="sm" className="w-9 p-0">
												<ChevronsUpDown className="h-4 w-4" />
												<span className="sr-only">Toggle</span>
											</Button>
										</CollapsibleTrigger>
									</div>
									{newsletters.map((newsletter, index) => (
										<CollapsibleContent key={newsletter.id}>
											<div className="mx-10">
												<Link to={`/app/newsletter/mine/${newsletter.id}`}>
													<Card
														className={cn(
															selectedNewsletterId === newsletter.id
																? 'bg-accent'
																: '',
															index === 0 ? '' : 'mt-2',
														)}
													>
														<CardHeader>
															<CardTitle>
																<h3 className="text-lg font-semibold">
																	{newsletter.title}
																</h3>
															</CardTitle>
															<CardDescription>
																<p>{newsletter.content.substring(0, 100)}...</p>
															</CardDescription>
														</CardHeader>
													</Card>
												</Link>
											</div>
										</CollapsibleContent>
									))}
								</Collapsible>
							),
						)}
					</div>
				</ResizablePanel>
				<ResizableHandle className="rounded-lg border-4" />
				<ResizablePanel defaultSize={75}>
					{location.pathname.endsWith('/mine') ? (
						<div className="flex items-center justify-center">
							<div className="text-lg font-bold">
								Select a newsletter on the left to view it
							</div>
						</div>
					) : null}
					<Outlet context={setSelectedNewsletterId} />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	)
}
