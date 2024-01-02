import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { type LessonPlan } from '@prisma/client'
import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { Form, useFetcher, useSubmit } from '@remix-run/react'
import { ClipboardCopyIcon } from 'lucide-react'
import OpenAI from 'openai'
import { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { typedjson, useTypedActionData } from 'remix-typedjson'
import { z } from 'zod'
import { Field, SelectField, TextareaField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '#app/components/ui/popover.tsx'
import { SelectItem } from '#app/components/ui/select.tsx'
import { type ChatHistoryProps } from '#app/routes/resources+/feedback-assistant.ts'
import { supportingTextSchema } from '#app/routes/resources+/supporting-text-generator.ts'
import { prisma } from '#app/utils/db.server.ts'
import { invariantResponse } from '#app/utils/misc.tsx'
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

type ActionData = {
	generatedLP: LessonPlan | null
	error: string | null
	chatHistory: ChatHistoryProps[]
}

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
	const submission = await parse(formData, {
		schema: lessonPlanSchema,
		async: false,
	})

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}
	let lpId = null
	// create the rubric in the database
	if (submission.value.intent === 'submit') {
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
	}

	const lessponPlanSystemContext = `You are a ${submission.value?.gradeLevel} teacher. You will be creating a detailed lesson plan for the specified standard and/or objective. You will reply with your anser in Markdown format.`

	const lpObjective = `Write a lesson plan that effectively details a lesson that achieves the following objective:  ${submission.value?.objective}.`
	const lpContext = `Additionally you should consider the following context when creating the lesson plan: ${submission.value?.additionalContext}.`

	const lpStandards = `The lesson plan should be aligned to the following standards: ${submission.value?.standards}.`

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
	if (submission.value?.additionalContext) {
		userMessages.push({
			role: 'user',
			content: lpContext,
		})
	}

	if (submission.value?.standards) {
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

export default function CeateLessonPlan() {
	// const loaderData = useLoaderData<typeof loader>()
	const actionData: ActionData | null = useTypedActionData()
	const supportingTextFetcher = useFetcher()

	const [copied, setCopied] = useState(false)
	const submit = useSubmit()

	const supportingTextRef = useRef<HTMLDivElement>(null)
	const lessonPlanResponseRef = useRef<HTMLDivElement>(null)
	const supportingTextResponseRef = useRef<HTMLDivElement>(null)

	const [showNumberOfLevels] = useState(false)
	const [form, fields] = useForm({
		id: 'lessonPlanForm',
		constraint: getFieldsetConstraint(lessonPlanSchema),
		onValidate({ formData }) {
			const result = parse(formData, { schema: lessonPlanSchema })
			return result
		},
		shouldRevalidate: 'onBlur',
	})

	const [supportingTextForm, supportingTextFields] = useForm({
		id: 'supportingTextForm',
		constraint: getFieldsetConstraint(supportingTextSchema),
		onValidate({ formData }) {
			const result = parse(formData, { schema: supportingTextSchema })
			return result
		},
		shouldRevalidate: 'onBlur',
	})

	const handleCopy = (text: string) => {
		navigator.clipboard.writeText(text)
		setCopied(true)
	}

	useEffect(() => {
		if (copied) {
			setTimeout(() => {
				setCopied(false)
			}, 2000)
		}
	}, [copied])

	useEffect(() => {
		if (supportingTextFetcher.state === 'submitting') {
			const top = supportingTextRef.current?.getBoundingClientRect().top || 0
			window.scrollTo(0, top)
		}
	}, [supportingTextFetcher.state])

	useEffect(() => {
		console.log('here')

		if (actionData?.generatedLP) {
			submit(
				{
					text: actionData.generatedLP?.lessonPlanResponse,
					lengthOfSummary: 20,
					modelToUpdate: 'lessonPlan',
					instanceId: actionData.generatedLP?.id,
				},
				{
					method: 'post',
					action: '/resources/summarizer',
					fetcherKey: 'summary',
					preventScrollReset: false,
					replace: false,
					navigate: false,
				},
			)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [actionData?.generatedLP])

	return (
		<div className="grid grid-cols-12">
			<div className="col-span-12 grid-cols-subgrid">
				<Form method="post" {...form.props}>
					<div className="grid  grid-cols-12 gap-4 px-10">
						<div className="col-span-4">
							<Field
								inputProps={{
									...conform.input(fields.gradeLevel),
									defaultValue: actionData?.generatedLP?.gradeLevel,
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
									...conform.input(fields.objective),
									defaultValue: actionData?.generatedLP?.objective,
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
									...conform.input(fields.additionalContext),
									defaultValue:
										actionData?.generatedLP?.additionalContext || '',
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
									...conform.input(fields.standards),
									defaultValue: actionData?.generatedLP?.standards || '',
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
			<div className="col-span-10 col-start-2 mt-8 grid-cols-subgrid">
				<div className="prose prose-lg   max-w-none  p-10">
					{actionData?.generatedLP?.lessonPlanResponse ? (
						<div>
							<div
								className="mx-auto my-4 flex w-full items-start justify-center rounded-lg border border-gray-400 p-4"
								style={{ whiteSpace: 'pre-wrap' }}
							>
								<div ref={lessonPlanResponseRef}>
									<Markdown remarkPlugins={[remarkGfm]}>
										{actionData?.generatedLP?.lessonPlanResponse}
									</Markdown>
								</div>
								<div>
									<Popover>
										<PopoverTrigger className="w-[200px]">
											<Button variant="secondary">
												Generate Supporting Text
											</Button>
										</PopoverTrigger>
										<PopoverContent>
											<supportingTextFetcher.Form
												{...supportingTextForm.props}
												method={'post'}
												action={'/resources/supporting-text-generator'}
											>
												<div>
													<p>
														Generate a supporting text for this lesson plan. The
														text should be{' '}
													</p>
													<div>
														<label
															htmlFor={supportingTextFields.aboverOrBelow.id}
															className="sr-only"
														>
															Abover, Below, or On Grade Level
														</label>
														<SelectField
															buttonProps={{
																...conform.select(
																	supportingTextFields.aboverOrBelow,
																),
																defaultValue: 'on',
																id: 'aboveOrBelow',
															}}
															labelProps={{
																htmlFor: supportingTextFields.aboverOrBelow.id,
																children: 'Above, Below, or On Grade Level',
															}}
														>
															<SelectItem value="above">Above</SelectItem>
															<SelectItem value="below">Below</SelectItem>
															<SelectItem value="on">On</SelectItem>
														</SelectField>

														<span>grade level</span>
													</div>
													{showNumberOfLevels ? (
														<Field
															inputProps={{
																...conform.input(
																	supportingTextFields.numberOfLevels,
																),
																type: 'number',
																defaultValue: '0',
															}}
															labelProps={{
																htmlFor: supportingTextFields.numberOfLevels.id,
																children: 'Number of Grade Levels',
															}}
															errors={
																supportingTextFields.numberOfLevels.errors
															}
														/>
													) : null}
												</div>
												<Field
													inputProps={{
														...conform.input(supportingTextFields.textLength),
														type: 'number',
													}}
													labelProps={{
														htmlFor: supportingTextFields.textLength.id,
														children: 'Text Length',
													}}
												/>
												<input
													type="hidden"
													name="lessonPlanId"
													value={actionData?.generatedLP?.id}
												/>
												<Button type="submit">Generate</Button>
											</supportingTextFetcher.Form>
										</PopoverContent>
									</Popover>
								</div>
								<div>
									<Button
										onClick={() =>
											handleCopy(lessonPlanResponseRef.current?.innerText || '')
										}
										className="w-[48px]"
										variant={'ghost'}
										title="Copy Lesson Plan Response"
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
							<div className="prose prose-stone" ref={supportingTextRef}>
								{supportingTextFetcher.state === 'submitting' ? (
									<p>Generating...</p>
								) : supportingTextFetcher.data?.error ? (
									<p>{supportingTextFetcher.data?.error}</p>
								) : supportingTextFetcher.data?.answer ? (
									<div
										className="mx-auto my-4 flex w-full items-start justify-center rounded-lg border border-gray-400 p-4"
										style={{ whiteSpace: 'pre-wrap' }}
									>
										<div ref={supportingTextResponseRef}>
											<Markdown
												remarkPlugins={[remarkGfm]}
												children={supportingTextFetcher.data.answer}
											/>
										</div>
										<div>
											<Button
												onClick={() =>
													handleCopy(supportingTextRef.current?.innerText || '')
												}
												className="w-[48px]"
												variant={'ghost'}
												title="Copy Lesson Plan Response"
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
								) : null}
							</div>
						</div>
					) : null}
				</div>
			</div>
		</div>
	)
}
