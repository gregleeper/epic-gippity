import {
	getFormProps,
	getInputProps,
	getTextareaProps,
	type SubmissionResult,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { Form } from '@remix-run/react'
import OpenAI from 'openai'
import { useEffect, useState } from 'react'
import { redirect, typedjson, useTypedActionData } from 'remix-typedjson'
import { z } from 'zod'
import { Field, TextareaField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { invariantResponse } from '#app/utils/misc.tsx'
import { requireUserWithPermission } from '#app/utils/permissions.ts'

const unitPlanSchema = z.object({
	topics: z.string().min(3),
	standards: z.string().min(3).max(255).optional(),
	additionalContext: z.string().min(3).max(2500).optional(),
	gradeLevel: z.string().min(3).max(255),
	lengthOfUnit: z.string().min(3).max(255),
	intent: z.enum(['submit', 'update']),
	summarizedUnitPlan: z.string().min(3).max(2500).optional(),
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

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: unitPlanSchema,
		async: false,
	})

	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}

	let unitPlanId = null
	// create the unit plan in the database
	const unitPlan = await prisma.unitPlan.create({
		data: {
			topics: submission.value.topics,
			gradeLevel: submission.value.gradeLevel,
			standards: submission.value.standards,
			additionalContext: submission.value.additionalContext,
			userId: userId,
			lengthOfUnit: submission.value.lengthOfUnit,
		},
	})
	unitPlanId = unitPlan.id

	const unitPlanSystemContext = `You are a ${submission.value?.gradeLevel} teacher. You will be creating a unit plan for to cover a specified period of time and the specified topics. If a standards are provided, you should ensure that the unit plan is aligned to those standards. You will reply with your anser in Markdown format.`

	const upTopics = `Write a unit plan that carefully considers the standard elements of teaching to ensure effective teaching and learning. The topic for this unit should cover the following:  ${submission.value?.topics}.`
	const upContext = `Additionally you should consider the following context when creating the unit plan: ${submission.value?.additionalContext}.`

	const upStandards = `The unit plan should be aligned to the following standards: ${submission.value?.standards}.`
	const upLengthOfUnit = `The unit plan should cover the following length of time: ${submission.value?.lengthOfUnit}.`

	const cleanContext = [] as {
		role: 'system'
		content: string
	}[]

	cleanContext.push({
		role: 'system',
		content: unitPlanSystemContext,
	})

	const userMessages = [] as {
		role: 'user'
		content: string
	}[]

	userMessages.push({
		role: 'user',
		content: upTopics,
	})
	if (submission.value?.additionalContext) {
		userMessages.push({
			role: 'user',
			content: upContext,
		})
	}

	if (submission.value?.standards) {
		userMessages.push({
			role: 'user',
			content: upStandards,
		})
	}
	userMessages.push({
		role: 'user',
		content: upLengthOfUnit,
	})

	const openai = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
	})
	if (!unitPlanId) {
		invariantResponse(unitPlanId, 'unitPlanId is null')
	}
	try {
		const chat = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo-1106',
			temperature: 0.1,
			messages: [...cleanContext, ...userMessages],
		})

		const answer = chat.choices[0].message.content

		await prisma.unitPlan.update({
			where: {
				id: unitPlanId,
			},
			data: {
				unitPlanResponse: answer ? answer : '',
			},
		})

		return redirect(`/app/unit-plan/mine/${unitPlanId}`)
	} catch (error: any) {
		return typedjson({
			generatedUP: null,
			error: error.message || 'Something went wrong! Please try again.',
			chatHistory: [],
		})
	}
}

export default function CreateUnitPlan() {
	const actionData = useTypedActionData<typeof action>()

	function isSubmissionResult(
		data: unknown,
	): data is { result: SubmissionResult } {
		return (
			data != null &&
			typeof data === 'object' &&
			'result' in data &&
			data.result != null
		)
	}

	const [form, fields] = useForm({
		id: 'unit-plan-form',
		constraint: getZodConstraint(unitPlanSchema),
		lastResult: isSubmissionResult(actionData) ? actionData.result : null,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: unitPlanSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	const [copied, setCopied] = useState(false)

	// const handleCopy = (text: string) => {
	// 	navigator.clipboard.writeText(text)
	// 	setCopied(true)
	// }

	useEffect(() => {
		if (copied) {
			setTimeout(() => {
				setCopied(false)
			}, 2000)
		}
	}, [copied])

	// useEffect(() => {
	// 	if (actionData?.generatedUP) {
	// 		submit(
	// 			{
	// 				text: actionData.generatedUP?.unitPlanResponse,
	// 				lengthOfSummary: 10,
	// 				modelToUpdate: 'unitPlan',
	// 				instanceId: actionData.generatedUP?.id,
	// 			},
	// 			{
	// 				method: 'post',
	// 				action: '/resources/summarizer',
	// 				fetcherKey: 'summary',
	// 				preventScrollReset: false,
	// 				replace: false,
	// 				navigate: false,
	// 			},
	// 		)
	// 	}
	// 	// eslint-disable-next-line react-hooks/exhaustive-deps
	// }, [actionData?.generatedUP])

	return (
		<div className="grid grid-cols-12">
			<div className="col-span-12 grid-cols-subgrid">
				<Form method="post" {...getFormProps(form)}>
					<div className="grid grid-cols-12 gap-4 px-10">
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
						<div className="col-span-3">
							<Field
								inputProps={{
									...getInputProps(fields.lengthOfUnit, { type: 'text' }),
								}}
								labelProps={{
									htmlFor: fields.lengthOfUnit.id,
									children: 'Length of Unit',
								}}
								errors={fields.lengthOfUnit.errors}
							/>
						</div>
						<div className="col-span-12">
							<TextareaField
								textareaProps={{
									...getTextareaProps(fields.topics),
								}}
								labelProps={{
									htmlFor: fields.topics.id,
									children: 'Topics To Cover / Unit Plan Title',
								}}
								errors={fields.topics.errors}
							/>
						</div>
						<div className="grid-subgrid col-span-12">
							<TextareaField
								textareaProps={{
									...getTextareaProps(fields.additionalContext),
								}}
								labelProps={{
									htmlFor: fields.additionalContext.id,
									children: 'Context',
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
									children: 'Standards Set to Align to',
								}}
								errors={fields.standards.errors}
							/>
						</div>
						<div className="col-start-1">
							<Button type="submit">Submit</Button>
						</div>
					</div>
				</Form>
			</div>
			{/* <div className="col-span-10 col-start-2 mt-8 grid-cols-subgrid">
				<div className="prose prose-lg   max-w-none  p-10">
					{actionData?.generatedUP?.unitPlanResponse ? (
						<div>
							<div
								className="mx-auto my-4 flex w-full items-start justify-center rounded-lg border border-gray-400 p-4"
								style={{ whiteSpace: 'pre-wrap' }}
							>
								<div ref={unitPlanResponseRef}>
									<Markdown remarkPlugins={[remarkGfm]}>
										{actionData?.generatedUP?.unitPlanResponse}
									</Markdown>
								</div>

								<div>
									<Button
										onClick={() =>
											handleCopy(unitPlanResponseRef.current?.innerText || '')
										}
										className="w-[48px]"
										variant={'ghost'}
										title="Copy Unit Plan Response"
									>
										<div className="relative">
											{copied ? (
												<span>Copied</span>
											) : (
												<ClipboardCopyIcon className="h-6 w-6" />
											)}
										</div>
									</Button>
								</div>
							</div>
						</div>
					) : null}
				</div>
			</div> */}
		</div>
	)
}
