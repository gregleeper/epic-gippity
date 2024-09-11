import { type LessonPlan } from '@prisma/client'
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

export async function loader({ params, request }: LoaderFunctionArgs) {
	const userId = await requireUserWithPermission(request, 'create:chat')
	const lessonPlans = await prisma.lessonPlan.findMany({
		where: {
			userId: userId,
		},
		orderBy: {
			createdAt: 'desc',
		},
	})
	const lessonPlanSummaries = await prisma.summary.findMany({
		where: {
			model: 'lessonPlan',
			userId: userId,
		},
	})
	const lessonPlansByDate = groupLessonPlansByDate(lessonPlans)

	const lessonPlansByDateJSON = JSON.stringify(
		Array.from(lessonPlansByDate.entries()),
	)

	return json({
		lessonPlans,
		lessonPlanSummaries,
		lessonPlansByDateJSON,
	})
}

function groupLessonPlansByDate(lessonPlans: LessonPlan[]) {
	let lessonPlansByDate = new Map()

	for (let plan of lessonPlans) {
		let date = plan.createdAt.toISOString().split('T')[0] // get the date part
		if (!lessonPlansByDate.has(date)) {
			lessonPlansByDate.set(date, [])
		}
		lessonPlansByDate.get(date).push(plan)
	}

	return lessonPlansByDate
}

export default function MyLessonPlans() {
	const loaderData = useLoaderData<typeof loader>()

	const lessonPlansByDate = useMemo(
		() =>
			// @ts-ignore
			new Map(JSON.parse(loaderData.lessonPlansByDateJSON)) as Map<
				string,
				LessonPlan[]
			>,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	)

	const [dateIsExpanded, setDateIsExpanded] = useState<
		Map<string, { open: boolean }>
	>(new Map())

	const location = useLocation()
	const [selectedLessonPlanId, setSelectedLessonPlanId] = useState<
		string | null
	>(null)

	useEffect(() => {
		if (location.pathname.endsWith('/mine')) {
			setSelectedLessonPlanId(null)
		} else if (
			location.pathname.includes('/mine/') &&
			location.pathname.split('/').length === 5
		) {
			setSelectedLessonPlanId(location.pathname.split('/').at(-1) || null)
		} else if (
			location.pathname.includes('/mine/') &&
			location.pathname.split('/').length === 6
		) {
			setSelectedLessonPlanId(location.pathname.split('/').at(-2) || null)
		}
	}, [location.pathname])

	useEffect(() => {
		// Initialize the state
		const initialOpenState = new Map()
		for (const [date, values] of lessonPlansByDate) {
			let open = values.some(r => r.id === selectedLessonPlanId)
			open
				? initialOpenState.set(date, { open: true })
				: initialOpenState.set(date, { open: false })
		}
		setDateIsExpanded(initialOpenState)
	}, [selectedLessonPlanId, lessonPlansByDate])

	const toggleOpen = (date: string) => {
		setDateIsExpanded(prevState => {
			const newState = new Map(prevState)
			newState.set(date, { open: !newState.get(date)?.open })
			return newState
		})
	}
	console.log(loaderData.lessonPlanSummaries)

	return (
		<div className="">
			<ResizablePanelGroup
				direction="horizontal"
				className="max-w-full rounded-lg  "
			>
				<ResizablePanel defaultSize={25}>
					<div className="mx-10 mt-4 ">
						<h1 className="text-2xl font-semibold">My Lesson Plans</h1>
						<p className="text-base font-light">
							Lesson Plans I've had generated
						</p>
					</div>
					<div className="mt-4 max-h-screen overflow-auto">
						{Array.from(lessonPlansByDate.entries()).map(([date, plans]) => {
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
											lesson plans
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
											<Link to={`/app/lesson-plan/mine/${plans.at(0)?.id}`}>
												<Card
													key={location.pathname}
													className={cn(
														selectedLessonPlanId === plans.at(0)?.id
															? 'bg-accent'
															: 'bg-background',
													)}
												>
													<CardHeader>
														<CardTitle>
															<h3 className="text-lg font-semibold">
																{
																	loaderData.lessonPlanSummaries.find(
																		summary =>
																			summary.instanceId === plans.at(0)?.id,
																	)?.summary
																}
															</h3>
														</CardTitle>
														<CardDescription>
															<p>{plans.at(0)?.standards}</p>
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
													<Link to={`/app/lesson-plan/mine/${plan.id}`}>
														<Card
															key={location.pathname}
															className={cn(
																selectedLessonPlanId === plan.id
																	? 'bg-accent'
																	: 'bg-background',
															)}
														>
															<CardHeader>
																<CardTitle>
																	<h3 className="text-lg font-semibold">
																		{
																			loaderData.lessonPlanSummaries.find(
																				summary =>
																					summary.instanceId === plan?.id,
																			)?.summary
																		}
																	</h3>
																</CardTitle>
																<CardDescription>
																	<p>{plan.standards}</p>
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
					</div>
				</ResizablePanel>
				<ResizableHandle className="rounded-lg border-4" />
				<ResizablePanel defaultSize={75} className="">
					{location.pathname.endsWith('/mine') ? (
						<div className="flex items-center justify-center">
							<div className="text-lg font-bold ">
								Select a lesson plan on the left to view it
							</div>
						</div>
					) : null}
					<Outlet context={setSelectedLessonPlanId} />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	)
}
