import { anthropic } from '@ai-sdk/anthropic'
// import Anthropic from '@anthropic-ai/sdk'
// import { type TextBlock } from '@anthropic-ai/sdk/resources/messages.mjs'
import { getFormProps, getTextareaProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
	redirect,
} from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { generateObject } from 'ai'
import { z } from 'zod'
import { TextareaField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { type ChatHistoryProps } from '#app/routes/resources+/feedback-assistant.ts'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithValidSubscription } from '#app/utils/permissions.ts'

export async function loader({ request, params }: LoaderFunctionArgs) {
	await requireUserWithValidSubscription(request)
	const assignmentId = params.assignmentId
	const assignment = await prisma.assignment.findUniqueOrThrow({
		where: {
			id: assignmentId,
		},
	})
	return json({
		assignment,
	})
}
const aiStructuredFeedback = z.object({
	paragraphs: z.array(
		z.object({
			id: z.string(),
			content: z.string(),
			type: z.enum(['introduction', 'main', 'conclusion']),
			feedback: z.string(),
		}),
	),
	overallFeedback: z.string(),
})

export type AiStructuredFeedback = z.infer<typeof aiStructuredFeedback>

export async function action({ request, params }: ActionFunctionArgs) {
	const userId = await requireUserWithValidSubscription(request)
	const assignmentId = params.assignmentId
	if (!assignmentId) {
		throw new Error('No assignmentId provided')
	}
	const formData = await request.formData()

	const chatHistory = [] as ChatHistoryProps[]

	const studentResponse = formData.get('studentResponse')

	const sub = await parseWithZod(formData, {
		schema: submissionSchema,
		async: false,
	})

	if (sub.status !== 'success') {
		return json(
			{ result: sub.reply() },
			{ status: sub.status === 'error' ? 400 : 200 },
		)
	}
	const assignment = await prisma.assignment.findUnique({
		where: {
			id: assignmentId,
		},
		include: {
			rubric: true,
		},
	})
	const ctx = [
		{
			role: 'user',
			content: `You are a teacher providing valuable, constructive feedback to students on thir writing. The requirements this assignment are listed: 
			
			${assignment?.requirements}`,
		},
		{
			role: 'assistant',
			content: `I will do my best to provide you with the best feedback possible.`,
		},
		{
			role: 'user',
			content: `The rubric for this assignment is: 
			
			${assignment?.rubric.rubricResponse}
			
			The grade level for this assignment is: ${assignment?.gradeLevel}`,
		},
		{
			role: 'assistant',
			content:
				"The rubric is a guideline for the assignment. It's important to provide feedback that is constructive and helpful to the student. My feedback will be based on the rubric and the requirements of the assignment and appropriate for the grade level.",
		},
		{
			role: 'user',
			content: `Provide feedback on the student's response using the following structure:

1. Overall Feedback: A brief summary of the overall performance.

2. Detailed Feedback: Provide 3-5 paragraphs of detailed feedback. Each paragraph should focus on a specific aspect of the writing. Structure each paragraph as follows:
   - Aspect: [Name of the aspect being discussed, be sure to include account for the score of this aspect in respect to the overall score of the assignment]
   - Feedback: [Detailed feedback on this aspect]
   - Suggestion: [A specific suggestion for improvement]

3. Conclusion: A final encouraging statement and summary of key points to focus on.

Present your response in markdown format, using appropriate headers and bullet points where necessary. Do not include any preamble or explanations outside of this structure.`,
		},
	] as { role: 'assistant' | 'user'; content: string }[]
	// const anthropic = new Anthropic({
	// 	apiKey: process.env.ANTHROPIC_API_KEY,
	// })
	// const openai = new OpenAI({
	// 	apiKey: process.env.OPENAI_API_KEY,
	// })

	try {
		// Generate structured feedback
		const structuredChat = await generateObject({
			model: anthropic('claude-3-5-sonnet-20240620'),
			messages: [
				...ctx,
				{
					role: 'user',
					content: `Provide structured feedback on the student's response. Include a score as an integer based on the rubrics score, an overall impression, and key points (4 positive and 4 negative). Format your response as a JSON object. The student's submission is: ${studentResponse}`,
				},
			],
			schema: z.object({
				score: z.number().min(0),
				overallImpression: z.string().min(10).max(500),
				keyPoints: z.object({
					positive: z.array(z.string()).length(4),
					negative: z.array(z.string()).length(4),
				}),
				detailedFeedback: z.string().min(10).max(20000),
			}),
		})

		if (!structuredChat.object) {
			throw new Error('No feedback provided')
		}

		const submission = await prisma.submission.create({
			data: {
				assignmentId: assignmentId,
				studentText: studentResponse as string,
				userId: userId,
				aiFeedback: structuredChat.object.detailedFeedback,
				score: structuredChat.object.score,
				overallImpression: structuredChat.object.overallImpression,
				positivePoints: structuredChat.object.keyPoints.positive.join('\n '),
				negativePoints: structuredChat.object.keyPoints.negative.join('\n '),
			},
		})

		return redirect(`/app/submission/${assignmentId}/${submission.id}`)
	} catch (error: any) {
		console.log('error', error)

		return json(
			{
				result: {
					message: studentResponse,
					error: error.message || 'Something went wrong! Please try again.',
					chatHistory,
				},
			},
			{ status: 500 },
		)
	}
	// return json({ studentResponse: studentResponse, feedbackId: feedback.id });

	throw new Error('Something went wrong')
}

const submissionSchema = z.object({
	studentResponse: z.string().min(10),
})

export default function CreateSubmission() {
	const data = useLoaderData<typeof loader>()
	console.log(data)

	const actionData = useActionData<typeof action>()
	const [form, fields] = useForm({
		id: 'add-assignment-form',
		constraint: getZodConstraint(submissionSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: submissionSchema })
		},
		shouldRevalidate: 'onBlur',
	})
	console.log(form, fields)

	return (
		<div className="grid grid-cols-12">
			<div className="col-span-10 row-start-2">
				<Form method="post" {...getFormProps(form)}>
					<div>
						<TextareaField
							labelProps={{
								htmlFor: fields.studentResponse.id,
								children: 'Student Response',
							}}
							textareaProps={{
								...getTextareaProps(fields.studentResponse),
								rows: 12,
							}}
						/>
					</div>
					<div>
						<Button type="submit">Submit</Button>
					</div>
				</Form>
			</div>
			{/* <div className="prose prose-lg col-span-10">
				<h3>Response</h3>
				<Markdown
					children={actionData?.result?.error}
					remarkPlugins={[remarkGfm]}
				/>
			</div> */}
		</div>
	)
}
