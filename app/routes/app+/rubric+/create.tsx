import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import OpenAI from 'openai'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { z } from 'zod'
import { Field, TextareaField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { type ChatHistoryProps } from '#app/routes/resources+/feedback-assistant.ts'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithPermission } from '#app/utils/permissions.ts'

const rubricSchema = z.object({
	title: z.string().min(3),
	objective: z.string().min(3).max(255),
	description: z.string().min(3).max(2500),
	gradeLevel: z.string().min(3).max(255),
	pointScale: z.coerce.number(),
	customization: z.string().optional(),
})

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserWithPermission(request, 'create:chat')

	const chatHistory = [] as ChatHistoryProps[]

	const rubric = await prisma.rubric.findFirst({
		where: {
			userId: userId,
		},
		orderBy: {
			createdAt: 'desc',
		},
	})
	return json({
		submission: rubric,
		answer: rubric?.rubricResponse,
		chatHistory,
	})
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserWithPermission(request, 'create:chat')

	const chatHistory = [] as ChatHistoryProps[]

	const formData = await request.formData()
	const submission = await parse(formData, {
		schema: rubricSchema,
		async: false,
	})

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}
	// create the rubric in the database
	const rubric = await prisma.rubric.create({
		data: {
			title: submission.value.title,
			description: submission.value.description,
			objective: submission.value.objective,
			gradeLevel: submission.value.gradeLevel,
			pointScale: submission.value.pointScale,
			customization: submission.value.customization,
			userId: userId,
		},
	})

	const rubricSystemContext = `You are a ${submission.value?.gradeLevel} teaching assistnat. The teacher is requesting that you produce a rubric for an assignment. You will reply with your anser in Markdown format.`

	const rubricTitle = `The title of the rubric is ${submission.value?.title}.`
	const rubricDescription = `The description of the rubric is ${submission.value?.description}.`
	const rubricObjective = `The objective of the lesson is ${submission.value?.objective}.`

	const cleanContext = [] as {
		role: 'system'
		content: string
	}[]

	cleanContext.push({
		role: 'system',
		content: rubricSystemContext,
	})

	const userMessages = [] as {
		role: 'user'
		content: string
	}[]

	userMessages.push({
		role: 'user',
		content: rubricTitle,
	})

	userMessages.push({
		role: 'user',
		content: rubricDescription,
	})

	userMessages.push({
		role: 'user',
		content: rubricObjective,
	})

	const openai = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
	})

	try {
		const chat = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo-1106',
			temperature: 0.1,
			messages: [...cleanContext, ...userMessages],
		})

		const answer = chat.choices[0].message.content

		await prisma.rubric.update({
			where: {
				id: rubric.id,
			},
			data: {
				rubricResponse: answer ? answer : '',
			},
		})

		return {
			message: rubric.description,
			answer: answer as string,
			chatHistory,
		}
	} catch (error: any) {
		return {
			message: rubric.description,
			answer: '',
			error: error.message || 'Something went wrong! Please try again.',
			chatHistory,
		}
	}

	return json({
		submission,
	})
}

export default function CeateRubric() {
	const loaderData = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const [form, fields] = useForm({
		id: 'signup-form',
		constraint: getFieldsetConstraint(rubricSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			const result = parse(formData, { schema: rubricSchema })
			return result
		},
		shouldRevalidate: 'onBlur',
	})
	console.log(loaderData)

	return (
		<div className="mx-16 grid grid-cols-12">
			<div className="col-span-12 grid-cols-subgrid">
				<Form method="post" {...form.props}>
					<div className="grid  grid-cols-12 gap-4 px-10">
						<div className="col-span-4">
							<Field
								inputProps={{
									...conform.input(fields.title),
									defaultValue: loaderData.submission?.title,
								}}
								labelProps={{
									htmlFor: fields.title.id,
									children: 'Title',
								}}
								errors={fields.title.errors}
							/>
						</div>
						<div className="col-span-8">
							<Field
								inputProps={{
									...conform.input(fields.objective),
									defaultValue: loaderData.submission?.objective,
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
									...conform.input(fields.description),
									defaultValue: loaderData.submission?.description,
								}}
								labelProps={{
									htmlFor: fields.description.id,
									children: 'Description',
								}}
								errors={fields.description.errors}
							/>
						</div>
						<div className="col-span-3">
							<Field
								inputProps={{
									...conform.input(fields.gradeLevel),
									defaultValue: loaderData.submission?.gradeLevel,
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
									...conform.input(fields.pointScale),
									defaultValue: loaderData.submission?.pointScale,
								}}
								labelProps={{
									htmlFor: fields.pointScale.id,
									children: 'Point Scale',
								}}
								errors={fields.pointScale.errors}
							/>
						</div>
						<div className="col-span-10">
							<Field
								inputProps={{
									...conform.input(fields.customization),
									defaultValue: loaderData.submission?.customization || '',
								}}
								labelProps={{
									htmlFor: fields.customization.id,
									children: 'Customization',
								}}
								errors={fields.customization.errors}
							/>
						</div>
						<div className="col-start-1">
							<Button type="submit">Submit</Button>
						</div>
					</div>
				</Form>
			</div>
			<div className="col-span-10 col-start-2 mt-8 grid-cols-subgrid">
				<div className="prose prose-lg   max-w-none bg-green-50 p-10">
					{loaderData.answer ? (
						<Markdown remarkPlugins={[remarkGfm]}>{loaderData.answer}</Markdown>
					) : null}
				</div>
			</div>
		</div>
	)
}
