import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '#app/components/ui/accordion.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithPermission } from '#app/utils/permissions.ts'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await requireUserWithPermission(request, 'create:chat')
	const feedback = await prisma.feedback.findUniqueOrThrow({
		where: {
			id: params.feedbackId,
			userId: userId,
		},
	})
	const formattedFeedbackInfo = await prisma.format.findMany({
		where: {
			userId: {
				equals: userId,
			},
			instanceId: feedback.id,
		},
	})
	return json({
		feedback,
		formattedFeedbackInfo,
	})
}

export default function MyFeedbackById() {
	const data = useLoaderData<typeof loader>()
	const { feedback, formattedFeedbackInfo } = data

	return (
		<div className="prose prose-lg  h-full  max-w-none overflow-y-scroll p-10 dark:prose-invert">
			<p>Created at: {new Date(feedback.createdAt).toLocaleTimeString('us')}</p>
			<Accordion type="multiple" className="w-full">
				<AccordionItem value="item-1">
					<AccordionTrigger className="text-lg font-medium">
						View Student Text
					</AccordionTrigger>
					<AccordionContent>
						<Markdown
							remarkPlugins={[remarkGfm]}
							children={
								formattedFeedbackInfo.find(
									f => f.subObject === 'StudentResponse',
								)?.output
									? formattedFeedbackInfo.find(
											f => f.subObject === 'StudentResponse',
									  )?.output
									: feedback.studentResponse
							}
						/>
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="item-2">
					<AccordionTrigger className="text-lg font-medium">
						View Requirements
					</AccordionTrigger>
					<AccordionContent>
						<Markdown
							remarkPlugins={[remarkGfm]}
							children={
								formattedFeedbackInfo.find(f => f.subObject === 'Requirements')
									?.output
									? formattedFeedbackInfo.find(
											f => f.subObject === 'Requirements',
									  )?.output
									: feedback.requirements
							}
						/>
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="item-3">
					<AccordionTrigger className="text-lg font-medium">
						View Rubric
					</AccordionTrigger>
					<AccordionContent>
						<Markdown
							remarkPlugins={[remarkGfm]}
							children={
								formattedFeedbackInfo.find(f => f.subObject === 'Rubric')
									?.output
									? formattedFeedbackInfo.find(f => f.subObject === 'Rubric')
											?.output
									: feedback.rubric
							}
						/>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
			<div>
				<h3 className="">Feedback Response</h3>
				<Markdown
					remarkPlugins={[remarkGfm]}
					children={feedback.feedbackResponse}
				/>
			</div>
		</div>
	)
}
