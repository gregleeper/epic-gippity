import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithValidSubscription } from '#app/utils/permissions.ts'

export async function loader({ request, params }: LoaderFunctionArgs) {
	await requireUserWithValidSubscription(request)
	const submissionId = params.submissionId
	if (!submissionId) {
		throw new Error('No submissionId provided')
	}
	const submission = await prisma.submission.findUniqueOrThrow({
		where: {
			id: submissionId,
		},
		include: {
			assignment: true,
		},
	})
	return json({ submission })
}

export default function SubmissionDetails() {
	const { submission } = useLoaderData<typeof loader>()

	return (
		<div className="relative grid grid-cols-12">
			<div className="col-span-12 row-start-2 lg:col-span-6 lg:row-start-2">
				<h3 className="text-lg font-semibold">Student Response:</h3>
				<div className=" max-w-md overflow-y-auto lg:h-auto lg:max-w-none lg:overflow-y-auto">
					<div className="prose">
						<p className="whitespace-pre-wrap">{submission.studentText}</p>
					</div>
				</div>
			</div>
			<div className="col-span-12 lg:col-span-6 lg:row-start-2">
				<div className="prose ">
					<h3>AI Feedback</h3>
					<Markdown
						children={submission.aiFeedback}
						remarkPlugins={[remarkGfm]}
					/>
				</div>
			</div>
		</div>
	)
}
