import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { useLoaderData, Link } from '@remix-run/react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithPermission } from '#app/utils/permissions.ts'
import { Button } from '#app/components/ui/button.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '#app/components/ui/popover.tsx'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await requireUserWithPermission(request, 'create:chat')
	const assignment = await prisma.assignment.findUniqueOrThrow({
		where: {
			id: params.assignmentId,
			userId: userId,
		},
		include: {
			rubric: true,
		},
	})
	return json({
		assignment,
	})
}

export default function MyAssignment() {
	const data = useLoaderData<typeof loader>()
	const { assignment } = data
	return (
		<div className="grid grid-cols-12">
			<div className="col-span-2 ml-4">
				
			<Popover>
				<PopoverTrigger asChild>
					<Button variant="outline">Assignment Actions</Button>
				</PopoverTrigger>
				<PopoverContent className="w-56">
					<div className="grid gap-4">
						<Link
							to={`/app/submission/${assignment.id}/create`}
							className="flex items-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground"
						>
							Create a Submission
						</Link>
						<Link
							to={`/app/submission/${assignment.id}/submissions`}
							className="flex items-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground"
						>
							View All Submissions
						</Link>
					</div>
				</PopoverContent>
			</Popover>
			</div>
			<div className="prose prose-lg col-span-12 max-h-screen max-w-none overflow-auto  p-10 dark:prose-invert">
				<h1>{assignment.title}</h1>
				<Markdown
					remarkPlugins={[remarkGfm]}
					children={assignment.description}
				/>

				<h2>Requirements</h2>
				<Markdown
					remarkPlugins={[remarkGfm]}
					children={assignment.requirements}
				/>
				<h2>Rubric</h2>
				<Markdown
					remarkPlugins={[remarkGfm]}
					children={assignment.rubric.rubricResponse}
				/>
			</div>
		</div>
	)
}
