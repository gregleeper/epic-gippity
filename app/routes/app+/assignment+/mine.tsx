import { type Feedback } from '@prisma/client'
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
import { requireUserWithPermission } from '#app/utils/permissions.ts'
import { ScrollArea } from '#app/components/ui/scroll-area.tsx'

export async function loader({ params, request }: LoaderFunctionArgs) {
	const userId = await requireUserWithPermission(request, 'create:chat')
	const feedbacks = await prisma.feedback.findMany({
		where: {
			userId: userId,
		},
		orderBy: {
			createdAt: 'desc',
		},
	})
	const feedbackSummaries = await prisma.summary.findMany({
		where: {
			model: 'feedback',
			userId: userId,
		},
	})
	const feedbacksByDate = groupFeedbacksByDate(feedbacks)

	const feedbacksByDateJSON = JSON.stringify(
		Array.from(feedbacksByDate.entries()),
	)

	return json({
		feedbacksByDate,
		feedbackSummaries,
		feedbacksByDateJSON,
	})
}

function groupFeedbacksByDate(feedbacks: Feedback[]) {
	let feedbacksByDate = new Map()

	for (let feedback of feedbacks) {
		let date = feedback.createdAt.toISOString().split('T')[0] // get the date part
		if (!feedbacksByDate.has(date)) {
			feedbacksByDate.set(date, [])
		}
		feedbacksByDate.get(date).push(feedback)
	}

	return feedbacksByDate
}

export default function MyFeedbacks() {
	const loaderData = useLoaderData<typeof loader>()

	const feedbacksByDate = useMemo(
		() =>
			// @ts-ignore
			new Map(JSON.parse(loaderData.feedbacksByDateJSON)) as Map<
				string,
				Feedback[]
			>,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	)

	const [dateIsExpanded, setDateIsExpanded] = useState<
		Map<string, { open: boolean }>
	>(new Map())

	const location = useLocation()
	const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(
		null,
	)

	useEffect(() => {
		if (location.pathname.endsWith('/mine')) {
			setSelectedFeedbackId(null)
		} else if (
			location.pathname.includes('/mine/') &&
			location.pathname.split('/').length === 5
		) {
			setSelectedFeedbackId(location.pathname.split('/').at(-1) || null)
		} else if (
			location.pathname.includes('/mine/') &&
			location.pathname.split('/').length === 6
		) {
			setSelectedFeedbackId(location.pathname.split('/').at(-2) || null)
		}
	}, [location.pathname])

	useEffect(() => {
		// Initialize the state
		const initialOpenState = new Map()
		for (const [date, values] of feedbacksByDate) {
			let open = values.some(r => r.id === selectedFeedbackId)
			open
				? initialOpenState.set(date, { open: true })
				: initialOpenState.set(date, { open: false })
		}
		setDateIsExpanded(initialOpenState)
	}, [selectedFeedbackId, feedbacksByDate])

	const toggleOpen = (date: string) => {
		setDateIsExpanded(prevState => {
			const newState = new Map(prevState)
			newState.set(date, { open: !newState.get(date)?.open })
			return newState
		})
	}

	return (
		<div className="mb-12 max-h-screen overflow-auto">
			<ResizablePanelGroup
				direction="horizontal"
				className=" max-w-full  rounded-lg"
			>
				<ResizablePanel defaultSize={25} className="">
					<div className="mx-10 mt-4 ">
						<h1 className="text-2xl font-semibold">My Feedbacks</h1>
						<p className="text-base font-light">Feedbacks I've had generated</p>
					</div>
					<ScrollArea className="mb-8 mt-4 max-h-screen overflow-auto">
						{Array.from(feedbacksByDate.entries()).map(([date, plans]) => {
							return (
								<Collapsible
									open={dateIsExpanded.get(date)?.open}
									onOpenChange={() => toggleOpen(date)}
									className=" mt-6 space-y-2"
									key={date}
								>
									<div className="flex items-center justify-center">
										<div className="text-lg font-bold ">
											{new Date(date).toLocaleDateString()}- {plans.length}{' '}
											feedbacks
										</div>

										<CollapsibleTrigger asChild>
											<Button variant="ghost" size="sm" className="w-9 p-0">
												<ChevronsUpDown className="h-4 w-4" />
												<span className="sr-only">Toggle</span>
											</Button>
										</CollapsibleTrigger>
									</div>
									{plans.at(0) && (
										<div className="mx-10">
											<Link to={`/app/feedback/mine/${plans.at(0)?.id}`}>
												<Card
													key={location.pathname}
													className={cn(
														selectedFeedbackId === plans.at(0)?.id
															? 'bg-accent hover:bg-accent/80'
															: ' hover:bg-accent/20',
													)}
												>
													<CardHeader>
														<CardTitle>
															<h3 className="text-lg font-semibold">
																{loaderData.feedbackSummaries.find(
																	summary =>
																		summary.instanceId === plans.at(0)?.id,
																)?.summary ?? 'Feedback'}
															</h3>
														</CardTitle>
														<CardDescription className="truncate-3-lines h-14 overflow-hidden">
															<p>{plans.at(0)?.requirements}</p>
														</CardDescription>
													</CardHeader>
												</Card>
											</Link>
										</div>
									)}
									{plans
										.filter((plan, index) => index > 0)
										.map(plan => (
											<CollapsibleContent key={plan.id}>
												<div className="mx-10">
													<Link to={`/app/feedback/mine/${plan.id}`}>
														<Card
															key={location.pathname}
															className={cn(
																selectedFeedbackId === plan.id
																	? 'bg-accent hover:bg-accent/80'
																	: 'hover:bg-accent/20',
															)}
														>
															<CardHeader>
																<CardTitle>
																	<h3 className="text-lg font-semibold">
																		{loaderData.feedbackSummaries.find(
																			summary =>
																				summary.instanceId === plan?.id,
																		)?.summary ?? 'Feedback'}
																	</h3>
																</CardTitle>
																<CardDescription className="truncate-4-lines h-14 overflow-hidden">
																	<p>{plan.requirements}</p>
																</CardDescription>
															</CardHeader>
														</Card>
													</Link>
												</div>
											</CollapsibleContent>
										))}
								</Collapsible>
							)
						})}
					</ScrollArea>
				</ResizablePanel>
				<ResizableHandle className="rounded-lg border-4" />
				<ResizablePanel defaultSize={75} className="">
					{location.pathname.endsWith('/mine') ? (
						<div className="flex items-center justify-center">
							<div className="text-lg font-bold ">
								Select a feedback on the left to view it
							</div>
						</div>
					) : null}

					<ScrollArea className=" mt-4 max-h-screen overflow-auto">
						<Outlet context={setSelectedFeedbackId} />
					</ScrollArea>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	)
}
