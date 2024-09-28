import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithValidSubscription } from '#app/utils/permissions.ts'
import { Badge } from '#app/components/ui/badge.tsx'

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
	const positivePoints = submission?.positivePoints?.split('\n')
	const negativePoints = submission?.negativePoints?.split('\n')

	return (
		<div className="relative grid grid-cols-12">
			<div className="col-span-12 row-start-2 lg:col-span-6 lg:row-start-2">
				<h3 className="text-lg font-semibold">Student Response:</h3>
				<div className=" max-w-md overflow-y-auto lg:h-auto lg:max-w-none lg:overflow-y-auto">
					<div className="prose pr-4">
						<p className="whitespace-pre-wrap   leading-loose">
							{submission.studentText}
						</p>
					</div>
				</div>
			</div>
			<div className="col-span-12 lg:col-span-6 lg:row-start-2">
				<div className="prose ">
					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<h3>AI Feedback</h3>
							{submission?.score && (
								<div>
									Score: <Badge>{submission.score}</Badge>
								</div>
							)}
						</div>
					</div>
					<div className="flex flex-col gap-2">
						{submission.overallImpression && (
							<div className="flex flex-col gap-2">
								<h4>Overall Impression</h4>
								<Markdown
									children={submission.overallImpression}
									remarkPlugins={[remarkGfm]}
								/>
							</div>
						)}
						<div className="flex flex-col gap-2">
							{submission.keyPoints && (
								<Markdown
									children={submission.keyPoints}
									remarkPlugins={[remarkGfm]}
								/>
							)}
						</div>
						<div className="flex flex-col gap-2">
							{positivePoints && (
								<ul>
									{positivePoints.map(point => (
										<li key={point}>{point}</li>
									))}
								</ul>
							)}
						</div>
						<div className="flex flex-col gap-2">
							{negativePoints && (
								<ul>
									{negativePoints.map(point => (
										<li key={point}>{point}</li>
									))}
								</ul>
							)}
						</div>
						<div className="flex flex-col gap-2">
							{submission.detailedFeedback && (
								<Markdown
									children={submission.detailedFeedback}
									remarkPlugins={[remarkGfm]}
								/>
							)}
						</div>
						<div className="flex flex-col gap-2">
							{submission.aiFeedback && (
								<Markdown
									children={submission.aiFeedback}
									remarkPlugins={[remarkGfm]}
								/>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
