import { parse } from '@conform-to/zod'
import {
	type LoaderFunctionArgs,
	json,
	type ActionFunctionArgs,
} from '@remix-run/node'
import OpenAI from 'openai'
import { z } from 'zod'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
// import { Textarea } from '#app/components/ui/textarea.tsx'
// import { Button } from '#app/components/ui/button.tsx'

// type LoaderData = {
// 	assistantRole: string
// 	rubric: string
// 	requirements: string
// 	id: string
// 	studentResponse: string
// }

// interface SummaryData {
// 	summary: string
// }

export const supportingTextSchema = z.object({
	aboverOrBelow: z.enum(['above', 'below', 'on']),
	numberOfLevels: z.coerce.number().min(0).max(5).optional(),
	textLength: z.coerce.number().min(10).max(2500),
})

export interface ReturnedDataProps {
	messages: { role: string; content: string }[]
	answer: string
	error?: string
	chatHistory: OpenAI.Chat.Completions.ChatCompletionMessage[]
}

export interface ChatHistoryProps
	extends OpenAI.Chat.Completions.ChatCompletionMessage {
	error?: boolean
}

export async function loader({ request, params }: LoaderFunctionArgs) {
	const lessonPlanId = params?.id
	const lessonPlan = await prisma.lessonPlan.findUnique({
		where: { id: lessonPlanId },
		include: {
			supportingTexts: true,
		},
	})
	return json({
		id: lessonPlan?.id,
		objective: lessonPlan?.objective,
		standards: lessonPlan?.standards,
		additionalContext: lessonPlan?.additionalContext,
		lessonPlanResponse: lessonPlan?.lessonPlanResponse,
		supportingTexts: lessonPlan?.supportingTexts,
	})
}

/**
 * API call executed server side
 */
export async function action({
	request,
}: ActionFunctionArgs): Promise<ReturnedDataProps> {
	const userId = await requireUserId(request)
	const body = await request.formData()
	console.log(body)

	const chatHistory = JSON.parse(body.get('chat-history') as string) || []
	const submission = await parse(body, {
		schema: supportingTextSchema,
		async: false,
	})

	if (!submission.value) {
		throw new Error('Somthing went wrong!')
	}

	const lessonPlan = await prisma.lessonPlan.findUnique({
		where: { id: body.get('lessonPlanId') as string },
	})
	if (!lessonPlan) {
		return {
			answer: 'No lesson plan found. Something went wrong.',
			// @ts-ignore
			chatHistory,
		}
	}
	// take the keys of the context object and map them to an array of objects
	// with a role of "system" and the content of the value
	const supportingTextSystemContext = `You are a ${lessonPlan.gradeLevel} teacher. You will be creating a text to support a lesson plan. Follow the instuctions provided, to best support the leson plan. Do not create another lessson plan!  You will reply with your text in Markdown format.`

	const lpObjective = `The lesson plan has the following objective:  ${lessonPlan.objective}. Write a supporting text that will help students achieve the objective.`
	const lpContext = `Additionally you should consider the following context when creating the supporting text: ${lessonPlan.additionalContext}.`

	const lpStandards = `The lesson plan was aligned to the following standards: ${lessonPlan.standards}. Take into acccount the standards when creating the supporting text.`

	const textComplexity =
		submission.value.numberOfLevels && submission.value.numberOfLevels > 0
			? `The complexity of the supporting text should be ${submission.value.numberOfLevels} ${submission.value.aboverOrBelow} the ${lessonPlan.gradeLevel} grade level.`
			: `The complexity of the supporting text should be ${submission.value.aboverOrBelow} the ${lessonPlan.gradeLevel} grade level.`

	const textLength = `The length of the supporting text should be ${submission.value.textLength},
	)} words.`

	const cleanContext = [] as {
		role: 'system'
		content: string
	}[]

	cleanContext.push({
		role: 'system',
		content: supportingTextSystemContext,
	})

	const userMessages = [] as {
		role: 'user'
		content: string
	}[]

	userMessages.push({
		role: 'user',
		content: lpObjective,
	})
	if (lessonPlan.additionalContext) {
		userMessages.push({
			role: 'user',
			content: lpContext,
		})
	}

	if (lessonPlan.standards) {
		userMessages.push({
			role: 'user',
			content: lpStandards,
		})
	}
	const assistantMessages = [] as {
		role: 'assistant'
		content: string
	}[]

	assistantMessages.push({
		role: 'assistant',
		content: textComplexity,
	})

	assistantMessages.push({
		role: 'assistant',
		content: textLength,
	})

	// store your key in .env
	const openai = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
	})

	try {
		const chat = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo',
			messages: [
				...cleanContext,
				// @ts-ignore
				...chatHistory,
				...userMessages,
			],
		})

		const answer = chat.choices[0].message.content
		if (!answer) throw new Error('Something went wrong! Please try again.')
		const supportingText = await prisma.supportingText.create({
			data: {
				textResponse: answer,
				prompt: JSON.stringify({
					userMessages,
					cleanContext,
					assistantMessages,
				}),
				subject: lessonPlan.subject ?? '',
				gradeLevel: lessonPlan.gradeLevel,
				user: {
					connect: {
						id: userId,
					},
				},
				LessonPlan: {
					connect: {
						id: body.get('lessonPlanId') as string,
					},
				},
			},
		})
		return {
			messages: userMessages,
			answer: answer as string,
			//@ts-ignore
			chatHistory,
		}
	} catch (error: any) {
		return {
			messages: userMessages,
			answer: '',
			error: error.message || 'Something went wrong! Please try again.',
			// @ts-ignore
			chatHistory,
		}
	}
}
