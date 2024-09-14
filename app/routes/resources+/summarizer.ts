import { openai } from '@ai-sdk/openai'
import { parseWithZod } from '@conform-to/zod'
import { json, type ActionFunctionArgs } from '@remix-run/node'
import { generateText } from 'ai'
import { z } from 'zod'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithPermission } from '#app/utils/permissions.ts'

export const summarizerSchema = z.object({
	text: z.string().min(20).max(100000),
	lengthOfSummary: z.number().min(10).max(1000),
	modelToUpdate: z.string().min(1).max(100),
	instanceId: z.string().min(1).max(100),
})

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserWithPermission(request, 'create:chat')
	console.log('userId', userId)

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: summarizerSchema,
		async: false,
	})

	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}

	if (!submission.value) {
		return json({ submission } as const, { status: 400 })
	}

	const cleanContext = [] as {
		role: 'system'
		content: string
	}[]

	cleanContext.push({
		role: 'system',
		content:
			'You are a summarization assistant. You are helping a teacher summarize a given text. Summarize to the appropriate length given by the teacher.',
	})

	const chatHistory = [] as {
		role: 'system' | 'user'
		content: string
	}[]

	const userMessages = [] as {
		role: 'user'
		content: string
	}[]

	userMessages.push({
		role: 'user',
		content: submission.value.text,
	})

	userMessages.push({
		role: 'user',
		content: `The length of the summary should be ${submission.value.lengthOfSummary} words.`,
	})

	try {
		const chat = await generateText({
			model: openai('gpt-4o-mini'),
			system: cleanContext.join('\n'),
			messages: userMessages,
		})

		const answer = chat.text
		if (!answer) throw new Error('Something went wrong! Please try again.')

		await prisma.summary.upsert({
			where: {
				model_instanceId: {
					instanceId: submission.value.instanceId,
					model: submission.value.modelToUpdate,
				},
			},
			update: {
				summary: answer,
			},
			create: {
				summary: answer,
				model: submission.value.modelToUpdate,
				instanceId: submission.value.instanceId,
				user: {
					connect: {
						id: userId,
					},
				},

				LessonPlan:
					submission.value.modelToUpdate === 'lessonPlan'
						? {
								connect: {
									id: submission.value.instanceId,
								},
						  }
						: undefined,
				Rubric:
					submission.value.modelToUpdate === 'rubric'
						? {
								connect: {
									id: submission.value.instanceId,
								},
						  }
						: undefined,
			},
		})

		return json({
			messages: userMessages,
			answer: answer as string,
			error: null,
			//@ts-ignore
			chatHistory,
		})
	} catch (error: any) {
		console.log(error)

		return json({
			messages: userMessages,
			answer: '',
			error: error.message || 'Something went wrong! Please try again.',
			// @ts-ignore
			chatHistory,
		})
	}
}
