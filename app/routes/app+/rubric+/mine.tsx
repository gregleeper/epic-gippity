import { type Rubric } from '@prisma/client'
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
	const rubrics = await prisma.rubric.findMany({
		where: {
			userId: userId,
		},
		orderBy: {
			createdAt: 'desc',
		},
	})
	const rubricsByDate = groupRubricsByDate(rubrics)

	const rubricsByDateJSON = JSON.stringify(Array.from(rubricsByDate.entries()))

	return json({
		rubrics,
		rubricsByDateJSON,
	})
}

function groupRubricsByDate(rubrics: Rubric[]) {
	let rubricsByDate = new Map()

	// Assuming `rubrics` is an array of your rubric objects
	for (let rubric of rubrics) {
		let date = rubric.createdAt.toISOString().split('T')[0] // get the date part
		if (!rubricsByDate.has(date)) {
			rubricsByDate.set(date, [])
		}
		rubricsByDate.get(date).push(rubric)
	}

	return rubricsByDate
}

export default function MyRubrics() {
	const loaderData = useLoaderData<typeof loader>()

	const rubricsByDate = useMemo(
		() =>
			new Map(JSON.parse(loaderData.rubricsByDateJSON)) as Map<
				string,
				Rubric[]
			>,
		[],
	)

	const [dateIsExpanded, setDateIsExpanded] = useState<
		Map<string, { open: boolean }>
	>(new Map())

	const location = useLocation()
	const [selectedRubricId, setSelectedRubricId] = useState<string | null>(null)

	useEffect(() => {
		if (location.pathname.endsWith('/mine')) {
			setSelectedRubricId(null)
		} else if (location.pathname.includes('/mine/')) {
			setSelectedRubricId(location.pathname.split('/').at(-1) || null)
		}
	}, [location.pathname])

	useEffect(() => {
		// Initialize the state
		const initialOpenState = new Map()
		for (const [date, values] of rubricsByDate) {
			let open = values.some(r => r.id === selectedRubricId)
			open
				? initialOpenState.set(date, { open: true })
				: initialOpenState.set(date, { open: false })
		}
		setDateIsExpanded(initialOpenState)
	}, [selectedRubricId, rubricsByDate])

	const toggleOpen = (date: string) => {
		setDateIsExpanded(prevState => {
			const newState = new Map(prevState)
			newState.set(date, { open: !newState.get(date)?.open })
			return newState
		})
	}
	console.log(selectedRubricId)

	return (
		<div>
			<ResizablePanelGroup
				direction="horizontal"
				className="max-w-full rounded-lg  "
			>
				<ResizablePanel defaultSize={50}>
					<div className="mx-10 mt-4 ">
						<h1 className="text-2xl font-semibold">My Rubrics</h1>
						<p className="text-base font-light">Rubrics I've had generated</p>
					</div>
					<div className="mt-4 max-h-screen overflow-auto">
						{Array.from(rubricsByDate.entries()).map(([date, rubrics]) => {
							return (
								<Collapsible
									open={dateIsExpanded.get(date)?.open}
									onOpenChange={() => toggleOpen(date)}
									className=" mt-6 space-y-2"
									key={date}
								>
									<div className="flex items-center justify-center">
										<div className="text-lg font-bold ">
											{new Date(date).toLocaleDateString()}- {rubrics.length}{' '}
											rubrics
										</div>

										<CollapsibleTrigger asChild>
											<Button variant="ghost" size="sm" className="w-9 p-0">
												<ChevronsUpDown className="h-4 w-4" />
												<span className="sr-only">Toggle</span>
											</Button>
										</CollapsibleTrigger>
									</div>
									{rubrics.at(0) && (
										<div className="mx-10">
											<Link to={`/app/rubric/mine/${rubrics.at(0)?.id}`}>
												<Card
													key={location.pathname}
													className={cn(
														selectedRubricId === rubrics.at(0)?.id
															? 'bg-stone-100'
															: 'bg-white',
													)}
												>
													<CardHeader>
														<CardTitle>
															<h3 className="text-lg font-semibold">
																{rubrics.at(0)?.title}
															</h3>
														</CardTitle>
														<CardDescription>
															<p>{rubrics.at(0)?.description}</p>
														</CardDescription>
													</CardHeader>
												</Card>
											</Link>
										</div>
									)}
									{rubrics
										.filter((rubric, index) => index > 0)
										.map(rubric => (
											<CollapsibleContent key={rubric.id}>
												<div className="mx-10">
													<Link to={`/app/rubric/mine/${rubric.id}`}>
														<Card
															key={location.pathname}
															className={cn(
																selectedRubricId === rubric.id
																	? 'bg-stone-100'
																	: 'bg-white',
															)}
														>
															<CardHeader>
																<CardTitle>
																	<h3 className="text-lg font-semibold">
																		{rubric.title}
																	</h3>
																</CardTitle>
																<CardDescription>
																	<p>{rubric.description}</p>
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
				<ResizablePanel defaultSize={50} className="">
					{location.pathname.endsWith('/mine') ? (
						<div className="flex items-center justify-center">
							<div className="text-lg font-bold ">
								Select a rubric on the left to view it
							</div>
						</div>
					) : null}
					<Outlet context={setSelectedRubricId} />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	)
}
