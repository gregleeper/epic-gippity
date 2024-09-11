import {
	getFormProps,
	getInputProps,
	getTextareaProps,
	type SubmissionResult,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { Form } from '@remix-run/react'
import { OpenAI } from 'openai'
import { typedjson, useTypedActionData } from 'remix-typedjson'
import { z } from 'zod'
import { Field, TextareaField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { type ChatHistoryProps } from '#app/routes/resources+/feedback-assistant.ts'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithPermission } from '#app/utils/permissions.ts'

const lessonPlanSchema = z.object({
	objective: z.string().min(3),
	standards: z.string().min(3).max(255).optional(),
	additionalContext: z.string().min(3).max(2500),
	gradeLevel: z.string().min(3).max(255),
	intent: z.enum(['submit', 'update']),
	summarizedLessonPlan: z.string().min(3).max(2500).optional(),
	id: z.string().optional(),
})

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserWithPermission(request, 'create:chat')

	// const chatHistory = [] as ChatHistoryProps[]

	// const lp = await prisma.lessonPlan.findFirst({
	// 	where: {
	// 		userId: userId,
	// 	},
	// 	orderBy: {
	// 		createdAt: 'desc',
	// 	},
	// 	include: {
	// 		supportingTexts: true,
	// 	},
	// })
	return json({
		// submission: lp,
		// answer: lp?.lessonPlanResponse,
		// chatHistory,
		userId,
	})
}
export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserWithPermission(request, 'create:chat')

	const chatHistory = [] as ChatHistoryProps[]

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: lessonPlanSchema,
		async: false,
	})
	if (submission.status !== 'success') {
		return json({ result: submission.reply() } as const, {
			status: 400,
		})
	}

	let lpId = null
	// create the lesson plan in the database
	const lp = await prisma.lessonPlan.create({
		data: {
			objective: submission.value.objective,
			gradeLevel: submission.value.gradeLevel,
			standards: submission.value.standards,
			additionalContext: submission.value.additionalContext,
			userId: userId,
		},
	})
	lpId = lp.id

	const lessponPlanSystemContext = `You are a ${submission.value.gradeLevel} teacher. You will be creating a detailed lesson plan for the specified standard and/or objective. You will reply with your anser in Markdown format.`

	const lpObjective = `Write a lesson plan that effectively details a lesson that achieves the following objective:  ${submission.value.objective}.`
	const lpContext = `Additionally you should consider the following context when creating the lesson plan: ${submission.value.additionalContext}.`

	const lpStandards = `The lesson plan should be aligned to the following standards: ${submission.value.standards}.`

	const cleanContext = [] as {
		role: 'system'
		content: string
	}[]

	cleanContext.push({
		role: 'system',
		content: lessponPlanSystemContext,
	})

	const userMessages = [] as {
		role: 'user'
		content: string
	}[]

	userMessages.push({
		role: 'user',
		content: lpObjective,
	})
	if (submission.value.additionalContext) {
		userMessages.push({
			role: 'user',
			content: lpContext,
		})
	}

	if (submission.value.standards) {
		userMessages.push({
			role: 'user',
			content: lpStandards,
		})
	}

	const openai = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
	})
	if (!lpId) {
		invariantResponse(lpId, 'lpId is null')
	}
	try {
		const chat = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo-1106',
			temperature: 0.1,
			messages: [...cleanContext, ...userMessages],
		})

		const answer = chat.choices[0].message.content

		const generatedLP = await prisma.lessonPlan.update({
			where: {
				id: lpId,
			},
			data: {
				lessonPlanResponse: answer ? answer : '',
			},
		})

		return typedjson({
			generatedLP,
			error: null,
			chatHistory,
		})
	} catch (error: any) {
		return typedjson({
			generatedLP: null,
			error: error.message || 'Something went wrong! Please try again.',
			chatHistory,
		})
	}
}

export default function CreateLessonPlan() {
	const actionData = useTypedActionData<typeof action>()

	function isSubmissionResult(
		data: unknown,
	): data is { result: SubmissionResult } {
		return data != null && typeof data === 'object' && 'result' in data
	}

	const [form, fields] = useForm({
		id: 'lessonPlanForm',
		constraint: getZodConstraint(lessonPlanSchema),
		lastResult: isSubmissionResult(actionData) ? actionData.result : undefined,
		onValidate({ formData }) {
			const result = parseWithZod(formData, { schema: lessonPlanSchema })
			return result
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="grid grid-cols-12">
			<div className="col-span-12 grid-cols-subgrid">
				<Form method="post" {...getFormProps(form)}>
					<div className="grid  grid-cols-12 gap-4 px-10">
						<div className="col-span-4">
							<Field
								inputProps={{
									...getInputProps(fields.gradeLevel, { type: 'text' }),
								}}
								labelProps={{
									htmlFor: fields.gradeLevel.id,
									children: 'Grade Level',
								}}
								errors={fields.gradeLevel.errors}
							/>
						</div>
						<div className="col-span-12">
							<TextareaField
								textareaProps={{
									...getTextareaProps(fields.objective),
								}}
								labelProps={{
									htmlFor: fields.objective.id,
									children: 'Objective',
								}}
								errors={fields.objective.errors}
							/>
						</div>
						<div className="grid-subgrid col-span-12">
							<TextareaField
								textareaProps={{
									...getTextareaProps(fields.additionalContext),
								}}
								labelProps={{
									htmlFor: fields.additionalContext.id,
									children: 'Additional Context',
								}}
								errors={fields.additionalContext.errors}
							/>
						</div>
						<div className="col-span-3">
							<Field
								inputProps={{
									...getInputProps(fields.standards, { type: 'text' }),
								}}
								labelProps={{
									htmlFor: fields.standards.id,
									children: 'Standards',
								}}
								errors={fields.standards.errors}
							/>
						</div>
						<input type="hidden" name="intent" value="submit" />
						<div className="col-start-1">
							<Button type="submit">Submit</Button>
						</div>
					</div>
				</Form>
			</div>
		</div>
	)
}
