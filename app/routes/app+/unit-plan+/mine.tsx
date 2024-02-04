import { type UnitPlan } from '@prisma/client'
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
	const unitPlans = await prisma.unitPlan.findMany({
		where: {
			userId: userId,
		},
		orderBy: {
			createdAt: 'desc',
		},
	})
	const unitPlanSummaries = await prisma.summary.findMany({
		where: {
			model: 'unitPlan',
			userId: userId,
		},
	})
	const unitPlansByDate = groupUnitPlansByDate(unitPlans)

	const unitPlansByDateJSON = JSON.stringify(
		Array.from(unitPlansByDate.entries()),
	)

	return json({
		unitPlans,
		unitPlanSummaries,
		unitPlansByDateJSON,
	})
}

function groupUnitPlansByDate(unitPlans: UnitPlan[]) {
	let unitPlansByDate = new Map()

	for (let plan of unitPlans) {
		let date = plan.createdAt.toISOString().split('T')[0] // get the date part
		if (!unitPlansByDate.has(date)) {
			unitPlansByDate.set(date, [])
		}
		unitPlansByDate.get(date).push(plan)
	}

	return unitPlansByDate
}

export default function MyUnitPlans() {
	const loaderData = useLoaderData<typeof loader>()

	const unitPlansByDate = useMemo(
		() =>
			// @ts-ignore
			new Map(JSON.parse(loaderData.unitPlansByDateJSON)) as Map<
				string,
				UnitPlan[]
			>,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	)

	const [dateIsExpanded, setDateIsExpanded] = useState<
		Map<string, { open: boolean }>
	>(new Map())

	const location = useLocation()
	const [selectedUnitPlanId, setSelectedUnitPlanId] = useState<string | null>(
		null,
	)

	useEffect(() => {
		if (location.pathname.endsWith('/mine')) {
			setSelectedUnitPlanId(null)
		} else if (
			location.pathname.includes('/mine/') &&
			location.pathname.split('/').length === 5
		) {
			setSelectedUnitPlanId(location.pathname.split('/').at(-1) || null)
		} else if (
			location.pathname.includes('/mine/') &&
			location.pathname.split('/').length === 6
		) {
			setSelectedUnitPlanId(location.pathname.split('/').at(-2) || null)
		}
	}, [location.pathname])

	useEffect(() => {
		// Initialize the state
		const initialOpenState = new Map()
		for (const [date, values] of unitPlansByDate) {
			let open = values.some(r => r.id === selectedUnitPlanId)
			open
				? initialOpenState.set(date, { open: true })
				: initialOpenState.set(date, { open: false })
		}
		setDateIsExpanded(initialOpenState)
	}, [selectedUnitPlanId, unitPlansByDate])

	const toggleOpen = (date: string) => {
		setDateIsExpanded(prevState => {
			const newState = new Map(prevState)
			newState.set(date, { open: !newState.get(date)?.open })
			return newState
		})
	}

	return (
		<div className="h-screen">
			<ResizablePanelGroup
				direction="horizontal"
				className="max-w-full rounded-lg  "
			>
				<ResizablePanel defaultSize={25} className=" ">
					<div className="mx-10 mt-4 ">
						<h1 className="text-2xl font-semibold">My Unit Plans</h1>
						<p className="text-base font-light">
							Unit Plans I've had generated
						</p>
					</div>
					<div className="mt-4 max-h-screen overflow-auto">
						{Array.from(unitPlansByDate.entries()).map(([date, plans]) => {
							return (
								<Collapsible
									open={dateIsExpanded.get(date)?.open}
									onOpenChange={() => toggleOpen(date)}
									className=" mt-6 space-y-2"
									key={date}
								>
									<div className="flex items-center justify-center">
										<div className="text-lg font-bold ">
											{new Date(date).toLocaleDateString()}- {plans.length} unit
											plans
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
											<Link to={`/app/unit-plan/mine/${plans.at(0)?.id}`}>
												<Card
													key={location.pathname}
													className={cn(
														selectedUnitPlanId === plans.at(0)?.id
															? 'bg-slate-300/80 dark:bg-slate-700/90'
															: 'bg-white dark:bg-slate-900',
													)}
												>
													<CardHeader>
														<CardTitle>
															<h3 className="text-lg font-semibold">
																{
																	loaderData.unitPlanSummaries.find(
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
													<Link to={`/app/unit-plan/mine/${plan.id}`}>
														<Card
															key={location.pathname}
															className={cn(
																selectedUnitPlanId === plan.id
																	? 'bg-slate-300/80 dark:bg-slate-700/90'
																	: 'bg-white dark:bg-slate-900',
															)}
														>
															<CardHeader>
																<CardTitle>
																	<h3 className="text-lg font-semibold">
																		{
																			loaderData.unitPlanSummaries.find(
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
								Select a unit plan on the left to view it
							</div>
						</div>
					) : null}
					<Outlet context={setSelectedUnitPlanId} />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	)
}
