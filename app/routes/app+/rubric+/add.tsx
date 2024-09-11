import {
	getFormProps,
	getInputProps,
	getSelectProps,
	getTextareaProps,
	type SubmissionResult,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	unstable_createMemoryUploadHandler as createMemoryUploadHandler,
	json,
	unstable_parseMultipartFormData as parseMultipartFormData,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { Form, useNavigation, useRouteError } from '@remix-run/react'
import { useState } from 'react'
import { redirect, useTypedActionData } from 'remix-typedjson'
import { z } from 'zod'
import { Field, SelectField, TextareaField } from '#app/components/forms.tsx'
import TableInput from '#app/components/tableInput.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { RadioGroup, RadioGroupItem } from '#app/components/ui/radio-group.tsx'
import { SelectItem } from '#app/components/ui/select.tsx'
import { type ChatHistoryProps } from '#app/routes/resources+/feedback-assistant.ts'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithValidSubscription } from '#app/utils/permissions.ts'

const cellSchema = z.string()

const rowSchema = z.array(cellSchema)

const tableSchema = z.array(rowSchema)

const rubricSchema = z.object({
	title: z.string().min(3),
	objective: z.string().min(3).max(255),
	description: z.string().min(3).max(2500).optional(),
	gradeLevel: z.string().min(3).max(255),
	public: z.enum(['yes', 'no']),
	pdf: z.instanceof(File).optional(),
})

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithValidSubscription(request)

	const chatHistory = [] as ChatHistoryProps[]

	return json({
		chatHistory,
	})
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserWithValidSubscription(request)

	const formData = await parseMultipartFormData(
		request,
		createMemoryUploadHandler({ maxPartSize: 10345660 }),
	)

	const submission = await parseWithZod(formData, {
		schema: rubricSchema,
		async: false,
	})

	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}

	if (!formData.get('pdf')) {
		const tableData: string[][] = []
		for (const [name, value] of formData.entries()) {
			if (name.startsWith('cell-')) {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const [_, rowIndex, columnIndex] = name.split('-').map(Number)
				if (!tableData[rowIndex]) {
					tableData[rowIndex] = []
				}
				tableData[rowIndex][columnIndex] = value as string
			}
		}
		tableSchema.parse(tableData)
	}

	if (submission.value.pdf) {
		const pdf = submission.value.pdf
		if (pdf) {
			try {
				const res = await fetch(
					'https://pdf-table-extractor.fly.dev/convert-rubric',
					{
						method: 'POST',
						headers: {
							Authorization: 'Basic YWRtaW46dGVzdHBhc3M=',
						},
						body: formData,
					},
				)
				if (!res.ok) {
					return json({ error: res.statusText }, { status: res.status })
				}
				const data = (await res.json()) as { natural_language_rubric: string }
				const myRubric = await prisma.rubric.create({
					data: {
						title: submission.value.title,
						objective: submission.value.objective,
						description: submission.value.description
							? submission.value.description
							: '',
						gradeLevel: submission.value.gradeLevel,
						userId: userId,
						rubricResponse: data?.natural_language_rubric,
						pointScale: 4,
						isPublic:
							submission.value.public.toLowerCase() === 'yes' ? true : false,
					},
				})

				return redirect(`/app/rubric/mine/${myRubric.id}`)
			} catch (error) {
				return json({ error: error }, { status: 500 })
			}
		}
	}

	// const dbRubric = await prisma.userRubric.create({
	// 	data: {
	// 		name: submission.value.title,
	// 		objective: submission.value.objective,
	// 		description: submission.value.description
	// 			? submission.value.description
	// 			: '',
	// 		public: submission.value.public === 'yes' ? true : false,
	// 		gradeLevel: submission.value.gradeLevel,
	// 		userId: userId,
	// 	},
	// })

	// for (const [index] of dbRubric.entries()) {
	// 	await prisma.rubricRow.create({
	// 		data: {
	// 			rubricId: dbRubric.id,
	// 			content: '',
	// 			order: index,
	// 		},
	// 	})
	// }

	// for (let i = 0; i < rubric[0].length; i++) {
	// 	await prisma.rubricColumn.create({
	// 		data: {
	// 			rubricId: dbRubric.id,
	// 			content: '',
	// 			order: i,
	// 		},
	// 	})
	// }

	// const rows = await prisma.rubricRow.findMany({
	// 	where: {
	// 		rubricId: dbRubric.id,
	// 	},
	// })
	// const columns = await prisma.rubricColumn.findMany({
	// 	where: {
	// 		rubricId: dbRubric.id,
	// 	},
	// })
	// for (const [index, row] of rubric.entries()) {
	// 	for (const [i, cell] of row.entries()) {
	// 		const rowId = rows.find(r => r.order === index)?.id
	// 		const columnId = columns.find(c => c.order === i)?.id
	// 		if (!columnId || !rowId) {
	// 			continue
	// 		}

	// 		await prisma.rubricCell.create({
	// 			data: {
	// 				rowId,
	// 				columnId,
	// 				content: cell,
	// 			},
	// 		})
	// 	}
	// }

	// return json({
	// 	submission,
	// })
}

const initialTableData = [
	['', '', '', '', ''],
	['', '', '', '', ''],
	['', '', '', '', ''],
	['', '', '', '', ''],
	['', '', '', '', ''],
]

export default function AddRubric() {
	// const loaderData = useLoaderData<typeof loader>()
	const actionData = useTypedActionData<typeof action>()
	const [inputType, setInputType] = useState('pdf')
	const navigation = useNavigation()
	const [tableData, setTableData] = useState(initialTableData)

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
		id: 'add-rubric-form',
		constraint: getZodConstraint(rubricSchema),
		lastResult: isSubmissionResult(actionData) ? actionData.result : null,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: rubricSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	const handleTableChange = (
		e: React.ChangeEvent<HTMLTextAreaElement>,
		rowIndex: number,
		columnIndex: number,
	) => {
		const newData = [...tableData]
		newData[rowIndex][columnIndex] = e.target.value
		setTableData(newData)
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

	return (
		<div className="mx-16 grid grid-cols-12">
			<div className="col-span-12 grid-cols-subgrid">
				<Form
					method="post"
					{...getFormProps(form)}
					encType="multipart/form-data"
				>
					<div className="grid  grid-cols-12 gap-4 px-10">
						<div className="col-span-4">
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
						<div className="col-span-8">
							<Field
								inputProps={{
									...getInputProps(fields.objective, { type: 'text' }),
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
									...getTextareaProps(fields.description),
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
							<SelectField
								buttonProps={{
									...getSelectProps(fields.public),
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

						<div className="col-span-4">
							<RadioGroup
								defaultValue={inputType}
								onValueChange={value => setInputType(value)}
							>
								<div>
									<Label>Rubric Type</Label>
								</div>
								<div className="flex justify-start gap-2">
									<div>
										<RadioGroupItem value="pdf" id="pdf" />
									</div>
									<div>
										<Label htmlFor="pdf">Upload PDF</Label>
									</div>
								</div>
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
								<Input type="file" name="pdf" accept="application/pdf" />
							</div>
						)}

						<div className="col-start-1">
							<Button type="submit" disabled={navigation.state !== 'idle'}>
								Submit
							</Button>
						</div>
					</div>
				</Form>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	const isRouteError = useRouteError()
	if (isRouteError) {
		return <div>There was an error</div>
	}
	return <div>An error occurred</div>
}
