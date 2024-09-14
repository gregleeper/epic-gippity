import {
	getFormProps,
	getInputProps,
	getSelectProps,
	getTextareaProps,
	type SubmissionResult,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs, json } from '@remix-run/node'
import { Form, Link, useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { redirect, useTypedActionData } from 'remix-typedjson'
import { z } from 'zod'
import { prisma } from '#/app/utils/db.server.ts'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Field, SelectField, TextareaField } from '#app/components/forms.tsx'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '#app/components/ui/accordion.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { SelectItem } from '#app/components/ui/select.tsx'
import { requireUserWithValidSubscription } from '#app/utils/permissions.ts'

export async function loader({ request }: ActionFunctionArgs) {
	const userId = await requireUserWithValidSubscription(request)
	const { searchParams } = new URL(request.url)
	const rubricId = searchParams.get('rubricId')
	console.log(rubricId)
	let chosenRubric = null
	if (rubricId) {
		const rubric = await prisma.rubric.findUnique({
			where: {
				id: rubricId,
				OR: [{ isPublic: true }, { userId }],
			},
			select: {
				rubricResponse: true,
				title: true,
				id: true,
			},
		})
		console.log(rubric)
		if (!rubric) {
			const userRubrics = await prisma.rubric.findMany({
				where: {
					OR: [{ userId }, { isPublic: true }],
				},
			})
			return {
				userRubrics,
				userId,
				chosenRubric: null,
			}
		}
		chosenRubric = rubric
	}
	const userRubrics = await prisma.rubric.findMany({
		where: {
			OR: [{ userId }, { isPublic: true }],
		},
	})
	return { userRubrics, userId, chosenRubric }
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserWithValidSubscription(request)

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: assignmentSchema,
		async: false,
	})

	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}

	// create the assignment in the database
	const assignment = await prisma.assignment.create({
		data: {
			description: submission.value.description,
			requirements: submission.value.requirements,
			title: submission.value.title,
			userId: userId,
			gradeLevel: submission.value.gradeLevel,
			rubricId: submission.value.rubricId,
		},
	})
	return redirect(`/app/assignment/mine/${assignment.id}`)
}

const assignmentSchema = z.object({
	assistantRole: z.string().optional(),
	rubricId: z.string(),
	requirements: z.string(),
	gradeLevel: z.string(),
	title: z.string(),
	description: z.string(),
	userId: z.string(),
})

export default function CreateAssignmentRoute() {
	const data = useLoaderData<typeof loader>()
	const actionData = useTypedActionData<typeof action>()
	const [selectedRubric, setSelectedRubric] = useState<string | null>(
		data.chosenRubric?.id ?? null,
	)
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
		id: 'add-assignment-form',
		constraint: getZodConstraint(assignmentSchema),
		lastResult: isSubmissionResult(actionData) ? actionData.result : null,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: assignmentSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="mx-auto w-3/4">
			<div className="pb-4">
				<h2 className="text-xl font-semibold">Create Assignment</h2>
			</div>
			<div className="mb-4 md:w-1/2">
				<div className="flex items-start justify-between space-x-2">
					<div className="rounded-md bg-amber-200/50 p-2">
						<p className="">
							You can create an assignment with a rubric you have already
							created, or create a new rubric to use for this assignment.
						</p>
					</div>
					<div className="">
						<Link to="/app/rubric/add" className="">
							<Button variant="outline" className="">
								Add new rubric
							</Button>
						</Link>
					</div>
				</div>
			</div>
			<div>
				<Form method="post" {...getFormProps(form)}>
					<div className="grid grid-cols-12 gap-4 space-x-2">
						<div className="col-span-6">
							<Field
								inputProps={{
									...getInputProps(fields.title, { type: 'text' }),
								}}
								labelProps={{
									htmlFor: fields.title.id,
									children: 'Title',
								}}
								errors={fields.title.errors}
							/>
						</div>
						<div className="col-span-6">
							<Field
								inputProps={{
									...getInputProps(fields.description, { type: 'text' }),
								}}
								labelProps={{
									htmlFor: fields.description.id,
									children: 'Description',
								}}
								errors={fields.description.errors}
							/>
						</div>
						<div className="col-span-6">
							<TextareaField
								textareaProps={{
									...getTextareaProps(fields.requirements),
								}}
								labelProps={{
									htmlFor: fields.requirements.id,
									children: 'Requirements',
								}}
								errors={fields.requirements.errors}
							/>
						</div>
						<div className="col-span-6">
							<div className="flex flex-row space-x-2">
								<div className="flex-grow">
									<SelectField
										buttonProps={{
											...getSelectProps(fields.rubricId),
											defaultValue: selectedRubric ?? '',
										}}
										labelProps={{
											htmlFor: fields.rubricId.id,
											children: 'Rubric',
										}}
										errors={fields.rubricId.errors}
										handleValueChange={value => setSelectedRubric(value)}
									>
										{data.userRubrics.map(rubric => (
											<SelectItem key={rubric.id} value={String(rubric.id)}>
												{rubric.title}
											</SelectItem>
										))}
									</SelectField>
								</div>
							</div>
						</div>
						<div className="col-span-6">
							<SelectField
								buttonProps={{
									...getSelectProps(fields.gradeLevel),
								}}
								labelProps={{
									htmlFor: fields.gradeLevel.id,
									children: 'Grade Level',
								}}
								errors={fields.gradeLevel.errors}
								handleValueChange={value => setSelectedRubric(value)}
							>
								{[
									'2nd',
									'3rd',
									'4th',
									'5th',
									'6th',
									'7th',
									'8th',
									'9th',
									'10th',
									'11th',
									'12th',
									'College',
								].map(level => (
									<SelectItem key={level} value={String(level)}>
										{level}
									</SelectItem>
								))}
							</SelectField>
						</div>
						<input
							{...getInputProps(fields.userId, { type: 'hidden' })}
							value={data.userId}
						/>
						<div className="col-span-2 col-start-1 mt-2">
							<Button type="submit">Create Assignment</Button>
						</div>
					</div>
				</Form>
			</div>
			{selectedRubric ? (
				<div className="prose prose-sm max-h-screen max-w-none overflow-auto  p-10 dark:prose-invert">
					<Accordion type="single" collapsible>
						<AccordionItem title="View Rubric" value={'Rubric'}>
							<AccordionTrigger>View Selected Rubric</AccordionTrigger>
							<AccordionContent>
								<Markdown
									remarkPlugins={[remarkGfm]}
									children={
										data.userRubrics.find(r => r.id === selectedRubric)
											?.rubricResponse
									}
								/>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			) : null}
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
				403: () => (
					<p>You must have a valid subscription to create an assignment</p>
				),
				400: () => <p>Invalid request</p>,
			}}
		/>
	)
}
