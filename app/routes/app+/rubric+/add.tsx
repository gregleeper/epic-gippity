import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import OpenAI from 'openai'
import { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { z } from 'zod'
import { Field, SelectField, TextareaField } from '#app/components/forms.tsx'
import TableInput from '#app/components/tableInput.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { RadioGroup, RadioGroupItem } from '#app/components/ui/radio-group.tsx'
import { SelectItem } from '#app/components/ui/select.tsx'
import { type ChatHistoryProps } from '#app/routes/resources+/feedback-assistant.ts'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithPermission } from '#app/utils/permissions.ts'

const cellSchema = z.string()

const rowSchema = z.array(cellSchema)

const tableSchema = z.array(rowSchema)

const rubricSchema = z.object({
	title: z.string().min(3),
	objective: z.string().min(3).max(255),
	description: z.string().min(3).max(2500).optional(),
	gradeLevel: z.string().min(3).max(255),
	public: z.enum(['yes', 'no']),
})

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserWithPermission(request, 'create:chat')

	const chatHistory = [] as ChatHistoryProps[]

	return json({
		chatHistory,
	})
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserWithPermission(request, 'create:chat')

	const chatHistory = [] as ChatHistoryProps[]

	const formData = await request.formData()
	const tableData: string[][] = []
	for (const [name, value] of formData.entries()) {
		if (name.startsWith('cell-')) {
			const [_, rowIndex, columnIndex] = name.split('-').map(Number)
			if (!tableData[rowIndex]) {
				tableData[rowIndex] = []
			}
			tableData[rowIndex][columnIndex] = value as string
		}
	}
	const rubric = tableSchema.parse(tableData)
	console.log(rubric)

	const submission = await parse(formData, {
		schema: rubricSchema,
		async: false,
	})
	console.log(submission.value)

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}
	// create the rubric in the database
	const dbRubric = await prisma.userRubric.create({
		data: {
			name: submission.value.title,
			objective: submission.value.objective,
			description: submission.value.description
				? submission.value.description
				: '',
			public: submission.value.public === 'yes' ? true : false,
			gradeLevel: submission.value.gradeLevel,
			userId: userId,
		},
	})

	for (const [index, row] of rubric.entries()) {
		await prisma.rubricRow.create({
			data: {
				rubricId: dbRubric.id,
				content: '',
				order: index,
			},
		})
	}

	for (let i = 0; i < rubric[0].length; i++) {
		await prisma.rubricColumn.create({
			data: {
				rubricId: dbRubric.id,
				content: '',
				order: i,
			},
		})
	}

	const rows = await prisma.rubricRow.findMany({
		where: {
			rubricId: dbRubric.id,
		},
	})
	const columns = await prisma.rubricColumn.findMany({
		where: {
			rubricId: dbRubric.id,
		},
	})
	for (const [index, row] of rubric.entries()) {
		for (const [i, cell] of row.entries()) {
			const rowId = rows.find(r => r.order === index)?.id
			const columnId = columns.find(c => c.order === i)?.id
			if (!columnId || !rowId) {
				continue
			}

			await prisma.rubricCell.create({
				data: {
					rowId,
					columnId,
					content: cell,
				},
			})
		}
	}

	// const rubricSystemContext = `You are a ${submission.value?.gradeLevel} teaching assistnat. The teacher is requesting that you produce a rubric for an assignment. You will reply with your anser in Markdown format.`

	// const rubricTitle = `The title of the rubric is ${submission.value?.title}.`
	// const rubricDescription = `The description of the rubric is ${submission.value?.description}.`
	// const rubricObjective = `The objective of the lesson is ${submission.value?.objective}.`

	// const cleanContext = [] as {
	// 	role: 'system'
	// 	content: string
	// }[]

	// cleanContext.push({
	// 	role: 'system',
	// 	content: rubricSystemContext,
	// })

	// const userMessages = [] as {
	// 	role: 'user'
	// 	content: string
	// }[]

	// userMessages.push({
	// 	role: 'user',
	// 	content: rubricTitle,
	// })

	// userMessages.push({
	// 	role: 'user',
	// 	content: rubricDescription,
	// })

	// userMessages.push({
	// 	role: 'user',
	// 	content: rubricObjective,
	// })

	// const openai = new OpenAI({
	// 	apiKey: process.env.OPENAI_API_KEY,
	// })

	// try {
	// 	const chat = await openai.chat.completions.create({
	// 		model: 'gpt-3.5-turbo-1106',
	// 		temperature: 0.1,
	// 		messages: [...cleanContext, ...userMessages],
	// 	})

	// 	const answer = chat.choices[0].message.content

	// 	await prisma.rubric.update({
	// 		where: {
	// 			id: rubric.id,
	// 		},
	// 		data: {
	// 			rubricResponse: answer ? answer : '',
	// 		},
	// 	})

	// 	return {
	// 		message: rubric.description,
	// 		answer: answer as string,
	// 		chatHistory,
	// 	}
	// } catch (error: any) {
	// 	return {
	// 		message: rubric.description,
	// 		answer: '',
	// 		error: error.message || 'Something went wrong! Please try again.',
	// 		chatHistory,
	// 	}
	// }

	return json({
		submission,
	})
}

const initialTableData = [
	['', '', '', '', ''],
	['', '', '', '', ''],
	['', '', '', '', ''],
	['', '', '', '', ''],
	['', '', '', '', ''],
]

export default function AddRubric() {
	const loaderData = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const [inputType, setInputType] = useState('table')
	const [textAreaData, setTextAreaData] = useState('')
	const [tableData, setTableData] = useState(initialTableData)
	console.log('input type', inputType)

	const handleTableChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		rowIndex: number,
		columnIndex: number,
	) => {
		const newData = [...tableData]
		newData[rowIndex][columnIndex] = e.target.value
		setTableData(newData)
	}

	const handleTextAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTextAreaData(e.target.value)
	}
	const addRow = () => {
		const newRow = new Array(tableData[0].length).fill('')
		setTableData([...tableData, newRow])
	}

	const removeRow = () => {
		if (tableData.length > 1) {
			const newData = [...tableData]
			newData.pop()
			setTableData(newData)
		}
	}

	const addColumn = () => {
		const newData = tableData.map(row => [...row, ''])
		setTableData(newData)
	}

	const removeColumn = () => {
		if (tableData[0].length > 1) {
			const newData = tableData.map(row => {
				const newRow = [...row]
				newRow.pop()
				return newRow
			})
			setTableData(newData)
		}
	}

	const [form, fields] = useForm({
		id: 'add-rubric-form',
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
								}}
								labelProps={{
									htmlFor: fields.gradeLevel.id,
									children: 'Grade Level',
								}}
								errors={fields.gradeLevel.errors}
							/>
						</div>
						<div className="col-span-3">
							<SelectField
								buttonProps={{
									...conform.select(fields.public),
									id: 'aboveOrBelow',
								}}
								labelProps={{
									htmlFor: fields.public.id,
									children: 'Public?',
								}}
							>
								<SelectItem value="yes">Yes</SelectItem>
								<SelectItem value="no">No</SelectItem>
							</SelectField>
						</div>

						<div>
							<RadioGroup
								defaultValue={inputType}
								onValueChange={value => setInputType(value)}
							>
								<div>
									<Label>Rubric Type</Label>
								</div>
								<div className="flex justify-start gap-2">
									<div>
										<RadioGroupItem value="table" id="table" />
									</div>
									<div>
										<Label htmlFor="table">Table</Label>
									</div>
								</div>
								{/* <div className="flex justify-start gap-2">
									<div>
										<RadioGroupItem
											value="textarea"
											id="textarea"
										/>
									</div>
									<div>
										<Label htmlFor="textarea">Textarea</Label>
									</div>
								</div> */}
							</RadioGroup>
						</div>
						{inputType === 'table' ? (
							<div className="col-span-12">
								<div>
									<Label>Rubric</Label>
								</div>
								<div className="flex items-center justify-center pb-2">
									<div className="pr-2">
										<Button size={'sm'} onClick={addRow}>
											Add Row
										</Button>
									</div>
									<div className="pr-2">
										<Button size={'sm'} onClick={addColumn}>
											Add Column
										</Button>
									</div>
									<div className="pr-2">
										<Button size={'sm'} onClick={removeRow}>
											Remove Row
										</Button>
									</div>
									<div className="pr-2">
										<Button size={'sm'} onClick={removeColumn}>
											Remove Column
										</Button>
									</div>
								</div>
								<div></div>
								<TableInput
									tableData={tableData}
									handleTableChange={handleTableChange}
								/>
							</div>
						) : (
							<div className="col-span-12">
								<TextareaField
									textareaProps={{
										...conform.input(fields.rubric),
									}}
									labelProps={{
										htmlFor: fields.rubric.id,
										children: 'Rubric',
									}}
									errors={fields.rubric.errors}
								/>
							</div>
						)}

						<div className="col-start-1">
							<Button type="submit">Submit</Button>
						</div>
					</div>
				</Form>
			</div>
			{/* <div className="col-span-10 col-start-2 mt-8 grid-cols-subgrid">
				<div className="prose prose-lg   max-w-none bg-green-50 p-10">
					{loaderData.answer ? (
						<Markdown remarkPlugins={[remarkGfm]}>{loaderData.answer}</Markdown>
					) : null}
				</div>
			</div> */}
		</div>
	)
}
