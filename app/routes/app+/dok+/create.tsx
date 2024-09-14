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
import { Form, useLoaderData } from '@remix-run/react'
import OpenAI from 'openai'
import { useEffect, useState } from 'react'
import { redirect, useTypedActionData } from 'remix-typedjson'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Field, TextareaField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithValidSubscription } from '#app/utils/permissions.ts'

const dokSchema = z.object({
	standards: z.string().min(3).max(2500),
	gradeLevel: z.string().min(3).max(255),
	userId: z.string(),
})

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserWithValidSubscription(request)
	return json({ userId })
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserWithValidSubscription(request)

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: dokSchema,
		async: false,
	})

	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}

	const dok = await prisma.dOK.create({
		data: {
			gradeLevel: submission.value.gradeLevel,
			standards: submission.value.standards,
			userId: userId,
		},
	})

	const dokSystemContext = `You are a ${submission.value.gradeLevel} teacher. You will be creating Depth of Knowledge (DOK) Questions covering topics sent by the user. If a number of questions are specified, reply with that number of questions for each DOK level. Always provide a correct answer for each question. You will give 5 questions for each level of DOK. Do not ask the user any questions or reply with any preamble. You will reply with your answer in Markdown format.`

	const dokStandards = `Write DOK Quetions covering the following topics, standards, or objectives:  ${submission.value.standards}.`

	const dokAnswerKey = `Provide the answer key for the level 1 through 3 DOK Questions you wrote above. Always give me an answer key.`

	const openai = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
	})

	try {
		const chat = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			temperature: 0.1,
			messages: [
				{ role: 'system', content: dokSystemContext },
				{ role: 'user', content: dokStandards },
				{ role: 'user', content: dokAnswerKey },
			],
		})

		const answer = chat.choices[0].message.content

		const generatedDOK = await prisma.dOK.update({
			where: { id: dok.id },
			data: { dokResponse: answer || '' },
		})

		return redirect(`/app/dok/mine/${generatedDOK.id}`)
	} catch (error: any) {
		return json(
			{ error: error.message || 'Something went wrong! Please try again.' },
			{ status: 500 },
		)
	}
}

export default function CreateDOKQuestions() {
	const data = useLoaderData<typeof loader>()
	const actionData = useTypedActionData<typeof action>()
	const [copied, setCopied] = useState(false)

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
		id: 'dok-form',
		constraint: getZodConstraint(dokSchema),
		lastResult: isSubmissionResult(actionData) ? actionData.result : null,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: dokSchema })
		},
		shouldRevalidate: 'onBlur',
	})

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

						<div className="col-span-12">
							<TextareaField
								textareaProps={{
									...getTextareaProps(fields.standards),
								}}
								labelProps={{
									htmlFor: fields.standards.id,
									children: 'Topics, Standards, TEKS, Obectives, etc.',
								}}
								errors={fields.standards.errors}
							/>
						</div>

						<input
							{...getInputProps(fields.userId, { type: 'hidden' })}
							value={data.userId}
						/>
						<div className="col-start-1">
							<Button type="submit">Submit</Button>
						</div>
					</div>
				</Form>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No user with the username "{params.username}" exists</p>
				),
				400: () => <p>Invalid request</p>,
			}}
		/>
	)
}
