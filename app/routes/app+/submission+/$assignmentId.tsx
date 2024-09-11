import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, Outlet, useLoaderData } from '@remix-run/react'
import { Button } from '#app/components/ui/button.tsx'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.tsx'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '#app/components/ui/popover.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithValidSubscription } from '#app/utils/permissions.ts'

export async function loader({ request, params }: LoaderFunctionArgs) {
	await requireUserWithValidSubscription(request)
	const assignmentId = params.assignmentId
	if (!assignmentId) {
		throw new Error('No submissionId provided')
	}
	const assignment = await prisma.assignment.findUniqueOrThrow({
		where: {
			id: assignmentId,
		},
	})
	return json({ assignment })
}

export default function SubmittionAssignment() {
	const { assignment } = useLoaderData<typeof loader>()
	return (
		<div className="grid grid-cols-6 gap-6 p-6">
			<Card className="relative col-span-6">
				<CardHeader>
					<CardTitle className="">
						<span className="rounded-md bg-amber-200 px-3 py-2 text-amber-700">
							{assignment.title}
						</span>
					</CardTitle>
					<CardDescription className="pt-2">
						{assignment.description}
					</CardDescription>
					<div className="absolute right-4 top-4">
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline">Assignment Actions</Button>
							</PopoverTrigger>
							<PopoverContent className="w-56">
								<div className="grid gap-4">
									<Link
										to={`/app/submission/${assignment.id}/submissions`}
										className="flex items-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground"
									>
										View All Submissions
									</Link>
									<Link
										to={`/app/assignment/mine/${assignment.id}`}
										className="flex items-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground"
									>
										View Assignment
									</Link>
									<Link
										to={`/app/submission/${assignment.id}/create`}
										className="flex items-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground"
									>
										New Submission
									</Link>
								</div>
							</PopoverContent>
						</Popover>
					</div>
				</CardHeader>
				<CardContent>
					<div className="">
						<span className="rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
							{assignment.gradeLevel}
						</span>
						<p>{assignment.requirements}</p>
					</div>
				</CardContent>
			</Card>

			<div className="col-span-6">
				<Outlet />
			</div>
		</div>
	)
}
