import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { type DOK } from '@prisma/client'
import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { Form, useSubmit } from '@remix-run/react'
import { ClipboardCopyIcon } from 'lucide-react'
import OpenAI from 'openai'
import { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { typedjson, useTypedActionData } from 'remix-typedjson'
import { z } from 'zod'
import { Field, TextareaField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { type ChatHistoryProps } from '#app/routes/resources+/feedback-assistant.ts'
import { prisma } from '#app/utils/db.server.ts'
import { invariantResponse } from '#app/utils/misc.tsx'
import { requireUserWithPermission } from '#app/utils/permissions.ts'

const dokSchema = z.object({
	standards: z.string().min(3).max(2500),
	gradeLevel: z.string().min(3).max(255),
	intent: z.enum(['submit', 'update']),
	summarizedDOK: z.string().min(3).max(2500).optional(),
	id: z.string().optional(),
})

type ActionData = {
	generatedDOK: DOK | null
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
		schema: dokSchema,
		async: false,
	})

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}
	let dokId = null
	// create the rubric in the database
	if (submission.value.intent === 'submit') {
		const unitPlan = await prisma.dOK.create({
			data: {
				gradeLevel: submission.value.gradeLevel,
				standards: submission.value.standards,
				userId: userId,
			},
		})
		dokId = unitPlan.id
	}

	const dokSystemContext = `You are a ${submission.value?.gradeLevel} teacher. You will be creating Depth of Knowledge (DOK) Questions covering topics sent by the user. If a number of questions are specified, reply with that number of questions for each DOK level. Always provide a correct answer for each question. You will give 5 questions for each level of DOK. Do not ask the user any questions or reply with any preamble. You will reply with your answer in Markdown format.`

	const dokStandards = `Write DOK Quetions covering the following topics, standards, or objectives:  ${submission.value?.standards}.`

	const dokAnswerKey = `Provide the answer key for the level 1 through 3 DOK Questions you wrote above. Always give me an answer key.`

	const cleanContext = [] as {
		role: 'system'
		content: string
	}[]

	cleanContext.push({
		role: 'system',
		content: dokSystemContext,
	})

	const userMessages = [] as {
		role: 'user'
		content: string
	}[]

	userMessages.push({
		role: 'user',
		content: dokStandards,
	})

	userMessages.push({
		role: 'user',
		content: dokAnswerKey,
	})

	const openai = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
	})
	if (!dokId) {
		invariantResponse(dokId, 'DOK Id is null')
	}
	try {
		const chat = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo-1106',
			temperature: 0.1,
			messages: [...cleanContext, ...userMessages],
		})

		const answer = chat.choices[0].message.content

		const generatedDOK = await prisma.dOK.update({
			where: {
				id: dokId,
			},
			data: {
				dokResponse: answer ? answer : '',
			},
		})

		return typedjson({
			generatedDOK,
			error: null,
			chatHistory,
		})
	} catch (error: any) {
		return typedjson({
			generatedDOK: null,
			error: error.message || 'Something went wrong! Please try again.',
			chatHistory,
		})
	}
}

export default function CreateDOKQuestions() {
	// const loaderData = useLoaderData<typeof loader>()
	const actionData: ActionData | null = useTypedActionData()

	const [copied, setCopied] = useState(false)
	const submit = useSubmit()

	const dokResponseRef = useRef<HTMLDivElement>(null)

	const [form, fields] = useForm({
		id: 'dok-form',
		constraint: getFieldsetConstraint(dokSchema),
		onValidate({ formData }) {
			const result = parse(formData, { schema: dokSchema })
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
		if (actionData?.generatedDOK) {
			submit(
				{
					text: actionData.generatedDOK?.dokResponse,
					lengthOfSummary: 10,
					modelToUpdate: 'dok',
					instanceId: actionData.generatedDOK?.id,
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
	}, [actionData?.generatedDOK])

	return (
		<div className="grid grid-cols-12">
			<div className="col-span-12 grid-cols-subgrid">
				<Form method="post" {...form.props}>
					<div className="grid  grid-cols-12 gap-4 px-10">
						<div className="col-span-4">
							<Field
								inputProps={{
									...conform.input(fields.gradeLevel),
									defaultValue: actionData?.generatedDOK?.gradeLevel,
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
									...conform.input(fields.standards),
									defaultValue: actionData?.generatedDOK?.standards,
								}}
								labelProps={{
									htmlFor: fields.standards.id,
									children: 'Topics, Standards, TEKS, Obectives, etc.',
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
					{actionData?.generatedDOK?.dokResponse ? (
						<div>
							<div
								className="mx-auto my-4 flex w-full items-start justify-center rounded-lg border border-gray-400 p-4"
								style={{ whiteSpace: 'pre-wrap' }}
							>
								<div ref={dokResponseRef}>
									<Markdown remarkPlugins={[remarkGfm]}>
										{actionData?.generatedDOK.dokResponse}
									</Markdown>
								</div>

								<div>
									<Button
										onClick={() =>
											handleCopy(dokResponseRef.current?.innerText || '')
										}
										className="w-[48px]"
										variant={'ghost'}
										title="Copy DOKs"
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
			</div>
		</div>
	)
}
