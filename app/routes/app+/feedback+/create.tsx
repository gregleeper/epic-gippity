import { openai } from '@ai-sdk/openai'
import { type ActionFunctionArgs, json } from '@remix-run/node'
import {
	Form,
	useActionData,
	useFetchers,
	useLoaderData,
	useNavigation,
	useSubmit,
} from '@remix-run/react'
import { generateText } from 'ai'
import { ClipboardCopyIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '#/app/components/ui/button.tsx'
import { prisma } from '#/app/utils/db.server.ts'
import { TextareaField } from '#app/components/forms.tsx'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '#app/components/ui/accordion.tsx'
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '#app/components/ui/resizable.tsx'
import { cn } from '#app/utils/misc.tsx'
import { requireUserWithPermission } from '#app/utils/permissions.ts'
import { context as defaultContext } from '../../../context/index.ts'
import { type ChatHistoryProps } from '../../resources+/feedback-assistant.ts'

export async function loader({ request }: ActionFunctionArgs) {
	const userId = await requireUserWithPermission(request, 'create:chat')
	const feedback = await prisma.feedback.findFirst({
		orderBy: {
			createdAt: 'desc',
		},
		where: {
			userId: userId,
		},
	})
	if (!feedback) {
		return json({
			assistantRole: defaultContext[0].content,
			rubric: defaultContext[1].content,
			requirements: defaultContext[2].content,
			studentResponse: '',
			formattedFeedbackInfo: null,
		})
	}
	const formattedFeedbackInfo = await prisma.format.findMany({
		where: {
			userId: {
				equals: userId,
			},
			instanceId: feedback.id,
		},
	})
	return json({
		assistantRole: feedback?.assistantRole,
		rubric: feedback?.rubric,
		requirements: feedback?.requirements,
		studentResponse: feedback?.studentResponse,
		feedbackResponse: feedback.feedbackResponse,
		formattedFeedbackInfo,
	})
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserWithPermission(request, 'create:chat')
	const formData = await request.formData()

	const chatHistory = [] as ChatHistoryProps[]

	const assistantRole = formData.get('assistantRole')
	const rubric = formData.get('rubric')
	const requirements = formData.get('requirements')
	const studentResponse = formData.get('studentResponse')
	// create a session cookie to store these values for later

	if (
		typeof assistantRole === 'string' &&
		typeof rubric === 'string' &&
		typeof requirements === 'string' &&
		typeof studentResponse === 'string'
	) {
		const feedback = await prisma.feedback.create({
			data: {
				assistantRole: assistantRole,
				rubric: rubric,
				requirements: requirements,
				userId: userId,
				studentResponse: studentResponse,
				feedbackResponse: '',
			},
		})
		// console.log("feedback", feedback);

		const myContext = Object.keys(feedback).map(key => {
			if (
				key === 'rubric' ||
				key === 'assistantRole' ||
				key === 'requirements'
			) {
				let value = feedback[key]

				return {
					role: 'system',
					content: value,
				}
			}
			return undefined
		})
		const cleanContext = myContext.filter(item => item !== undefined) as {
			role: 'system'
			content: string
		}[]

		// store your key in .env
		try {
			const chat = await generateText({
				model: openai('gpt-4o-mini'),
				system: cleanContext.join('\n'),
				messages: [
					{
						role: 'user',
						content: studentResponse,
					},
				],
			})

			const answer = chat.text

			const updatedFeedback = await prisma.feedback.update({
				where: {
					id: feedback.id,
				},
				data: {
					feedbackResponse: answer ? answer : '',
				},
			})

			return {
				message: studentResponse,
				answer: answer as string,
				chatHistory,
				feedback: updatedFeedback,
			}
		} catch (error: any) {
			return {
				message: studentResponse,
				answer: '',
				error: error.message || 'Something went wrong! Please try again.',
				chatHistory,
				feedback: null,
			}
		}
		// return json({ studentResponse: studentResponse, feedbackId: feedback.id });
	}
	throw new Error('Something went wrong')
}
export default function Home() {
	const data = useLoaderData<typeof loader>()

	const actionData = useActionData<typeof action>()
	console.log('actionData', actionData)

	const navigation = useNavigation()
	const fetchers = useFetchers()
	console.log(fetchers)

	const submit = useSubmit()
	const [feedbackResponse, setFeedbackResponse] = useState(
		actionData?.answer || '',
	)

	const [copied, setCopied] = useState(false)
	const [showRubicTextarea, setShowRubicTextarea] = useState(
		data.formattedFeedbackInfo?.find(f => f.subObject === 'Rubric')
			? false
			: true,
	)
	const [showRequirementsTextarea, setShowRequirementsTextarea] = useState(
		data.formattedFeedbackInfo?.find(f => f.subObject === 'Requirements')
			? false
			: true,
	)

	useEffect(() => {
		if (navigation.state === 'submitting') {
			window.scrollTo(0, 0)
			setFeedbackResponse('')
		}
	}, [navigation.state])

	useEffect(() => {
		if (actionData?.answer) {
			setFeedbackResponse(actionData.answer)
		}
	}, [actionData?.answer])

	const handleCopy = () => {
		navigator.clipboard.writeText(feedbackResponse)
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
		console.log('here')

		if (actionData?.feedback) {
			submit(
				{
					text: actionData.feedback?.requirements,
					lengthOfSummary: 20,
					modelToUpdate: 'feedback',
					instanceId: actionData.feedback?.id,
				},
				{
					method: 'post',
					action: '/resources/summarizer',
					fetcherKey: `feedback-summary-${actionData.feedback.id}`,
					preventScrollReset: false,
					replace: false,
					navigate: false,
				},
			)
			submit(
				{
					text: actionData.feedback?.studentResponse,
					object: 'Feedback',
					instanceId: actionData.feedback?.id,
					subObject: 'StudentResponse',
					intent: 'submit',
					feedbackId: actionData.feedback?.id,
				},
				{
					method: 'post',
					action: '/resources/markdown-formatter',
					fetcherKey: `formatter-sr-${actionData.feedback.id}`,
					preventScrollReset: false,
					replace: false,
					navigate: false,
				},
			)
			submit(
				{
					text: actionData.feedback?.rubric,
					object: 'Feedback',
					instanceId: actionData.feedback?.id,
					subObject: 'Rubric',
					intent: 'submit',
					feedbackId: actionData.feedback?.id,
				},
				{
					method: 'post',
					action: '/resources/markdown-formatter',
					fetcherKey: `formatter-rubric-${actionData.feedback.id}`,
					preventScrollReset: false,
					replace: false,
					navigate: false,
				},
			)
			submit(
				{
					text: actionData.feedback?.requirements,
					object: 'Feedback',
					instanceId: actionData.feedback?.id,
					subObject: 'Requirements',
					intent: 'submit',
					feedbackId: actionData.feedback?.id,
				},
				{
					method: 'post',
					action: '/resources/markdown-formatter',
					fetcherKey: `formatter-requirements-${actionData.feedback.id}`,
					preventScrollReset: false,
					replace: false,
					navigate: false,
				},
			)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [actionData?.feedback])

	return (
		<ResizablePanelGroup direction="horizontal" className="h-screen">
			<ResizablePanel defaultSize={50} className="h-screen ">
				<div className="form-container col-span-5 col-start-1 mx-auto max-h-screen max-w-7xl space-y-2 overflow-auto p-4  sm:px-6  lg:px-8">
					<h1 className="text-center text-3xl font-bold">Feedback</h1>
					<p className="text-center text-lg font-light">
						Set the rubric and requirements. We will use the last submission to
						populate the Rubric and Requirements fields. Paste in the Student
						content you'd like feedback on.
					</p>
					<Form method="post" name="rubricForm" className="space-y-4">
						<TextareaField
							textareaProps={{
								placeholder: 'Assistant Role',

								name: 'assistantRole',
								readOnly: true,
								defaultValue: data.assistantRole || '',
								id: 'assistantRole',
								cols: 30,
								rows: 4,
							}}
							labelProps={{
								htmlFor: 'assistantRole',
								children: 'Assistant Role',
							}}
						></TextareaField>
						<div className="group prose-sm">
							<Accordion type="multiple" className="w-full">
								<AccordionItem value="item-1">
									<AccordionTrigger className="text-lg font-medium">
										Rubric from last Submission
									</AccordionTrigger>
									<AccordionContent>
										<Markdown
											remarkPlugins={[remarkGfm]}
											children={
												data.formattedFeedbackInfo?.find(
													f => f.subObject === 'Rubric',
												)?.output
													? data.formattedFeedbackInfo?.find(
															f => f.subObject === 'Rubric',
													  )?.output
													: 'No formatted rubric found'
											}
										/>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
							<div className="mb-4 mt-4">
								<Button
									variant={'default'}
									type="button"
									onClick={e => setShowRubicTextarea(value => !value)}
								>
									{showRubicTextarea ? 'Set Rubric' : 'Edit Rubric'}
								</Button>
							</div>
							<TextareaField
								textareaProps={{
									placeholder: 'Add a rubric',
									name: 'rubric',
									defaultValue: data.rubric || '',
									id: 'rubric',
									cols: 30,
									rows: 15,
								}}
								labelProps={{
									htmlFor: 'rubric',
									children: 'Rubric',
								}}
								className={cn(showRubicTextarea ? 'block' : 'hidden')}
							></TextareaField>
						</div>
						<div className="group prose-sm">
							<Accordion type="multiple" className="w-full">
								<AccordionItem value="item-1">
									<AccordionTrigger className="text-lg font-medium">
										Requirements from last Submission
									</AccordionTrigger>
									<AccordionContent>
										<Markdown
											remarkPlugins={[remarkGfm]}
											children={
												data.formattedFeedbackInfo?.find(
													f => f.subObject === 'Requirements',
												)?.output
													? data.formattedFeedbackInfo?.find(
															f => f.subObject === 'Requirements',
													  )?.output
													: 'No formatted requirements found'
											}
										/>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
							<div className="mb-4 mt-4">
								<Button
									variant={'default'}
									type="button"
									onClick={e => setShowRequirementsTextarea(value => !value)}
								>
									{showRequirementsTextarea
										? 'Set Requirements'
										: 'Edit Requirements'}
								</Button>
							</div>
							<TextareaField
								textareaProps={{
									placeholder: 'Add Requirements',
									name: 'requirements',
									defaultValue: data.requirements || '',
									id: 'requirements',
									cols: 30,
									rows: 15,
								}}
								labelProps={{
									htmlFor: 'requirements',
									children: 'Requirements',
								}}
								className={cn(showRequirementsTextarea ? 'block' : 'hidden')}
							></TextareaField>
						</div>
						<div className="group pt-8">
							<TextareaField
								textareaProps={{
									placeholder: 'Student Response',
									name: 'studentResponse',
									defaultValue: data.studentResponse || '',
									id: 'studentResponse',
									cols: 30,
									rows: 15,
								}}
								labelProps={{
									htmlFor: 'studentResponse',
									children: 'Student Response',
								}}
							></TextareaField>
						</div>
						<Button variant={'default'} type="submit">
							Submit
						</Button>
					</Form>
				</div>
			</ResizablePanel>
			<ResizableHandle className="border-2" />
			<ResizablePanel>
				<div className="col-span-7 col-start-6 ">
					{navigation.state === 'submitting' ? (
						<div className="mx-auto my-4 flex w-3/4 items-center justify-center gap-4 rounded-md border border-gray-400 p-4">
							<div className="inline-block h-4 w-4 animate-bounce rounded-full bg-orange-700 delay-75"></div>
							<div className="inline-block h-4 w-4 animate-bounce rounded-full bg-orange-700 delay-100"></div>
							<div className="inline-block h-4 w-4 animate-bounce rounded-full bg-orange-700"></div>
						</div>
					) : null}

					{feedbackResponse ? (
						<div
							className="mx-auto my-4 flex w-3/4 items-start justify-center rounded-md border border-gray-400 p-4"
							style={{ whiteSpace: 'pre-wrap' }}
						>
							{feedbackResponse}
							<Button
								onClick={() => handleCopy()}
								className="w-[48px]"
								variant={'ghost'}
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
					) : null}
				</div>
			</ResizablePanel>
		</ResizablePanelGroup>
	)
}
