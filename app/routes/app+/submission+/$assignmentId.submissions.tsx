import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithValidSubscription } from '#app/utils/permissions.ts'

export async function loader({ request, params }: LoaderFunctionArgs) {
	await requireUserWithValidSubscription(request)
	const assignmentId = params.assignmentId
	if (!assignmentId) {
		throw new Error('No assignmentId provided')
	}
	const submissions = await prisma.submission.findMany({
		where: {
			assignmentId: assignmentId,
		},
		orderBy: {
			createdAt: 'desc',
		},
	})
	return json({ submissions })
}

export default function SubmissionsList() {
	const { submissions } = useLoaderData<typeof loader>()

	return (
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
			{submissions.map(submission => (
				<Link
					key={submission.id}
					to={`/app/submission/${submission.assignmentId}/${submission.id}`}
					className="block "
				>
					<Card className="h-full transition-colors duration-200 ease-in-out hover:bg-gray-100">
						<CardHeader>
							<CardTitle className="text-lg">
								Submission {submission.id}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-gray-600">
								Created: {new Date(submission.createdAt).toLocaleDateString()}
							</p>
							<p className="mt-2 line-clamp-3">{submission.studentText}</p>
						</CardContent>
					</Card>
				</Link>
			))}
		</div>
	)
}
