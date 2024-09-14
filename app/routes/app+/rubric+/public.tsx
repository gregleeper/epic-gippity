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

export async function loader({ params, request }: LoaderFunctionArgs) {
	const publicRubrics = await prisma.rubric.findMany({
		where: {
			isPublic: true,
		},
		orderBy: {
			createdAt: 'desc',
		},
	})
	const rubricsByDate = groupRubricsByDate(publicRubrics)

	const rubricsByDateJSON = JSON.stringify(Array.from(rubricsByDate.entries()))

	return json({
		publicRubrics,
		rubricsByDateJSON,
	})
}

function groupRubricsByDate(rubrics: Rubric[]) {
	let rubricsByDate = new Map()

	for (let rubric of rubrics) {
		let date = rubric.createdAt.toISOString().split('T')[0]
		if (!rubricsByDate.has(date)) {
			rubricsByDate.set(date, [])
		}
		rubricsByDate.get(date).push(rubric)
	}

	return rubricsByDate
}

export default function PublicRubrics() {
	const loaderData = useLoaderData<typeof loader>()

	const rubricsByDate = useMemo(
		() =>
			new Map(JSON.parse(loaderData.rubricsByDateJSON)) as Map<
				string,
				Rubric[]
			>,
		[loaderData.rubricsByDateJSON],
	)

	const [dateIsExpanded, setDateIsExpanded] = useState<
		Map<string, { open: boolean }>
	>(new Map())

	const location = useLocation()
	const [selectedRubricId, setSelectedRubricId] = useState<string | null>(null)

	useEffect(() => {
		if (location.pathname.endsWith('/public')) {
			setSelectedRubricId(null)
		} else if (location.pathname.includes('/public/')) {
			setSelectedRubricId(location.pathname.split('/').at(-1) || null)
		}
	}, [location.pathname])

	useEffect(() => {
		const initialOpenState = new Map()
		for (const [date, values] of rubricsByDate) {
			let open = values.some(r => r.id === selectedRubricId)
			initialOpenState.set(date, { open })
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
						<h1 className="text-2xl font-semibold">Public Rubrics</h1>
						<p className="text-base font-light">Publicly shared rubrics</p>
					</div>
					<div className="mt-4 max-h-screen overflow-auto">
						{Array.from(rubricsByDate.entries()).map(([date, rubrics]) => (
							<Collapsible
								key={date}
								open={dateIsExpanded.get(date)?.open}
								onOpenChange={() => toggleOpen(date)}
								className="mt-6 space-y-2"
							>
								<div className="flex items-center justify-center">
									<div className="text-lg font-bold">
										{new Date(date).toLocaleDateString()} - {rubrics.length}{' '}
										rubrics
									</div>
									<CollapsibleTrigger asChild>
										<Button variant="ghost" size="sm" className="w-9 p-0">
											<ChevronsUpDown className="h-4 w-4" />
											<span className="sr-only">Toggle</span>
										</Button>
									</CollapsibleTrigger>
								</div>
								{rubrics.map((rubric, index) => (
									<CollapsibleContent key={rubric.id}>
										<div className="mx-10">
											<Link to={`/app/rubric/public/${rubric.id}`}>
												<Card
													className={cn(
														selectedRubricId === rubric.id
															? 'bg-accent'
															: 'bg-background',
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
						))}
					</div>
				</ResizablePanel>
				<ResizableHandle className="rounded-lg border-4" />
				<ResizablePanel defaultSize={75} className="">
					{location.pathname.endsWith('/public') ? (
						<div className="flex items-center justify-center">
							<div className="text-lg font-bold">
								Select a public rubric on the left to view it
							</div>
						</div>
					) : null}
					<Outlet context={setSelectedRubricId} />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	)
}
