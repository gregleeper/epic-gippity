import { type DOK } from '@prisma/client'
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
	const doks = await prisma.dOK.findMany({
		where: {
			userId: userId,
		},
		orderBy: {
			createdAt: 'desc',
		},
	})
	const dokSummaries = await prisma.summary.findMany({
		where: {
			model: 'dok',
			userId: userId,
		},
	})
	const doksByDate = groupDoksByDate(doks)

	const doksByDateJSON = JSON.stringify(Array.from(doksByDate.entries()))

	return json({
		doks,
		dokSummaries,
		doksByDateJSON,
	})
}

function groupDoksByDate(doks: DOK[]) {
	let doksByDate = new Map()

	for (let plan of doks) {
		let date = plan.createdAt.toISOString().split('T')[0] // get the date part
		if (!doksByDate.has(date)) {
			doksByDate.set(date, [])
		}
		doksByDate.get(date).push(plan)
	}

	return doksByDate
}

export default function MyUnitPlans() {
	const loaderData = useLoaderData<typeof loader>()

	const doksByDate = useMemo(
		() =>
			// @ts-ignore
			new Map(JSON.parse(loaderData.doksByDateJSON)) as Map<string, DOK[]>,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	)

	const [dateIsExpanded, setDateIsExpanded] = useState<
		Map<string, { open: boolean }>
	>(new Map())

	const location = useLocation()
	const [selectedDokId, setSelectedDokId] = useState<string | null>(null)

	useEffect(() => {
		if (location.pathname.endsWith('/mine')) {
			setSelectedDokId(null)
		} else if (
			location.pathname.includes('/mine/') &&
			location.pathname.split('/').length === 5
		) {
			setSelectedDokId(location.pathname.split('/').at(-1) || null)
		} else if (
			location.pathname.includes('/mine/') &&
			location.pathname.split('/').length === 6
		) {
			setSelectedDokId(location.pathname.split('/').at(-2) || null)
		}
	}, [location.pathname])

	useEffect(() => {
		// Initialize the state
		const initialOpenState = new Map()
		for (const [date, values] of doksByDate) {
			let open = values.some(r => r.id === selectedDokId)
			open
				? initialOpenState.set(date, { open: true })
				: initialOpenState.set(date, { open: false })
		}
		setDateIsExpanded(initialOpenState)
	}, [selectedDokId, doksByDate])

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
						<h1 className="text-2xl font-semibold">My DOKs</h1>
						<p className="text-base font-light">DOKs I've had generated</p>
					</div>
					<div className="mt-4 max-h-screen overflow-auto">
						{Array.from(doksByDate.entries()).map(([date, plans]) => {
							return (
								<Collapsible
									open={dateIsExpanded.get(date)?.open}
									onOpenChange={() => toggleOpen(date)}
									className=" mt-6 space-y-2"
									key={date}
								>
									<div className="flex items-center justify-center">
										<div className="text-lg font-bold ">
											{new Date(date).toLocaleDateString()}- {plans.length} DOKs
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
											<Link to={`/app/dok/mine/${plans.at(0)?.id}`}>
												<Card
													key={location.pathname}
													className={cn(
														selectedDokId === plans.at(0)?.id
															? 'bg-amber-300/80 dark:bg-amber-700/90'
															: 'bg-white dark:bg-slate-900',
													)}
												>
													<CardHeader>
														<CardTitle>
															<h3 className="text-lg font-semibold">
																{
																	loaderData.dokSummaries.find(
																		summary =>
																			summary.instanceId === plans.at(0)?.id,
																	)?.summary
																}
															</h3>
														</CardTitle>
														<CardDescription className="prose line-clamp-3 text-amber-950">
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
													<Link to={`/app/dok/mine/${plan.id}`}>
														<Card
															key={location.pathname}
															className={cn(
																selectedDokId === plan.id
																	? 'bg-accent'
																	: 'bg-background',
															)}
														>
															<CardHeader>
																<CardTitle>
																	<h3 className="text-lg font-semibold">
																		{
																			loaderData.dokSummaries.find(
																				summary =>
																					summary.instanceId === plan?.id,
																			)?.summary
																		}
																	</h3>
																</CardTitle>
																<CardDescription className="prose line-clamp-3 ">
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
								Select a DOK group on the left to view it
							</div>
						</div>
					) : null}
					<Outlet context={setSelectedDokId} />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	)
}
