import { type Assignment } from '@prisma/client'
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
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'

export async function loader({ params, request }: LoaderFunctionArgs) {
	const userId = await requireUserWithValidSubscription(request)
	const assignments = await prisma.assignment.findMany({
		where: {
			userId: userId,
		},
		orderBy: {
			createdAt: 'desc',
		},
	})
	const assignmentsByDate = groupAssignmentsByDate(assignments)

	const assignmentsByDateJSON = JSON.stringify(
		Array.from(assignmentsByDate.entries()),
	)

	return json({
		assignments,
		assignmentsByDateJSON,
	})
}

function groupAssignmentsByDate(assignments: Assignment[]) {
	let assignmentsByDate = new Map()

	// Assuming `rubrics` is an array of your rubric objects
	for (let assignment of assignments) {
		let date = assignment.createdAt.toISOString().split('T')[0] // get the date part
		if (!assignmentsByDate.has(date)) {
			assignmentsByDate.set(date, [])
		}
		assignmentsByDate.get(date).push(assignment)
	}

	return assignmentsByDate
}

export default function MyAssignments() {
	const loaderData = useLoaderData<typeof loader>()

	const assignmentsByDate = useMemo(
		() =>
			// @ts-ignore
			new Map(JSON.parse(loaderData.assignmentsByDateJSON)) as Map<
				string,
				Assignment[]
			>,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	)

	const [dateIsExpanded, setDateIsExpanded] = useState<
		Map<string, { open: boolean }>
	>(new Map())

	const location = useLocation()
	const [selectedAssignmentId, setSelectedAssignmentId] = useState<
		string | null
	>(null)

	useEffect(() => {
		if (location.pathname.endsWith('/mine')) {
			setSelectedAssignmentId(null)
		} else if (location.pathname.includes('/mine/')) {
			setSelectedAssignmentId(location.pathname.split('/').at(-1) || null)
		}
	}, [location.pathname])

	useEffect(() => {
		// Initialize the state
		const initialOpenState = new Map()
		for (const [date, values] of assignmentsByDate) {
			let open = values.some(r => r.id === selectedAssignmentId)
			open
				? initialOpenState.set(date, { open: true })
				: initialOpenState.set(date, { open: false })
		}
		setDateIsExpanded(initialOpenState)
	}, [selectedAssignmentId, assignmentsByDate])

	const toggleOpen = (date: string) => {
		setDateIsExpanded(prevState => {
			const newState = new Map(prevState)
			newState.set(date, { open: !newState.get(date)?.open })
			return newState
		})
	}
	console.log(selectedAssignmentId)

	return (
		<div className="h-full">
			<ResizablePanelGroup
				direction="horizontal"
				className="h-full max-w-full rounded-lg  "
			>
				<ResizablePanel
					defaultSize={25}
					className="max-h-screen overflow-y-scroll"
				>
					<div className="mx-10 mt-4 ">
						<h1 className="text-2xl font-semibold">My Assignments</h1>
					</div>
					<div className="mt-4 max-h-screen overflow-auto">
						{Array.from(assignmentsByDate.entries()).map(
							([date, assignments]) => {
								return (
									<Collapsible
										open={dateIsExpanded.get(date)?.open}
										onOpenChange={() => toggleOpen(date)}
										className=" mt-6 space-y-2"
										key={date}
									>
										<div className="flex items-center justify-center">
											<div className="text-lg font-bold ">
												{new Date(date).toLocaleDateString()}-{' '}
												{assignments.length} assignments
											</div>

											<CollapsibleTrigger asChild>
												<Button variant="ghost" size="sm" className="w-9 p-0">
													<ChevronsUpDown className="h-4 w-4" />
													<span className="sr-only">Toggle</span>
												</Button>
											</CollapsibleTrigger>
										</div>
										{assignments.at(0) && (
											<div className="mx-10">
												<Link
													to={`/app/assignment/mine/${assignments.at(0)?.id}`}
												>
													<Card
														key={location.pathname}
														className={cn(
															selectedAssignmentId === assignments.at(0)?.id
																? 'bg-accent'
																: '',
														)}
													>
														<CardHeader>
															<CardTitle>
																<h3 className="text-lg font-semibold">
																	{assignments.at(0)?.title}
																</h3>
																<CardDescription>
																	<p>{assignments.at(0)?.description}</p>
																</CardDescription>
															</CardTitle>
														</CardHeader>
													</Card>
												</Link>
											</div>
										)}
										{assignments
											.filter((assignment, index) => index > 0)
											.map(assignment => (
												<CollapsibleContent key={assignment.id}>
													<div className="mx-10">
														<Link to={`/app/assignment/mine/${assignment.id}`}>
															<Card
																key={location.pathname}
																className={cn(
																	selectedAssignmentId === assignment.id
																		? 'bg-accent'
																		: '',
																)}
															>
																<CardHeader>
																	<CardTitle>
																		<h3 className="text-lg font-semibold">
																			{assignment.title}
																		</h3>
																	</CardTitle>
																	<CardDescription>
																		<p>{assignment.description}</p>
																	</CardDescription>
																</CardHeader>
															</Card>
														</Link>
													</div>
												</CollapsibleContent>
											))}
									</Collapsible>
								)
							},
						)}
					</div>
				</ResizablePanel>
				<ResizableHandle className="rounded-lg border-4" />
				<ResizablePanel defaultSize={75} className="">
					{location.pathname.endsWith('/mine') ? (
						<div className="flex items-center justify-center">
							<div className="text-lg font-bold ">
								Select an assignment on the left to view it
							</div>
						</div>
					) : null}
					<Outlet context={setSelectedAssignmentId} />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				403: () => (
					<div className="flex flex-col items-center justify-center">
						<div className="text-lg font-bold">
							<p>You must have a valid subscription to view your assignments</p>
						</div>
						<Link to="/app/settings/profile/plan">
							<Button>Upgrade</Button>
						</Link>
					</div>
				),
				404: () => <p>Assignment not found</p>,
				500: () => <p>Internal server error</p>,
			}}
		/>
	)
}
