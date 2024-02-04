import { type ActionFunctionArgs, json } from '@remix-run/node'
import {
	Form,
	useActionData,
	useLoaderData,
	useNavigation,
} from '@remix-run/react'
// import { set } from 'date-fns'
import { ClipboardCopyIcon } from 'lucide-react'
import OpenAI from 'openai'
import { useEffect, useState } from 'react'
import { Button } from '#/app/components/ui/button.tsx'
// import { Label } from '#/app/components/ui/label.tsx'
// import { Textarea } from '#/app/components/ui/textarea.tsx'
// import { isAuthenticated } from '#/app/utils/auth.server.ts'
import { prisma } from '#/app/utils/db.server.ts'
import { TextareaField } from '#app/components/forms.tsx'
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '#app/components/ui/resizable.tsx'
import { requireUserWithPermission } from '#app/utils/permissions.ts'
import { context as defaultContext } from '../../context/index.ts'
import { type ChatHistoryProps } from '../resources+/feedback-assistant.ts'

// type LoaderData = {
// 	assistantRole: string
// 	rubric: string
// 	requirements: string
// 	context: { content: string; id: number }[]
// 	studentResponse: string
// }

// type ActionData = {
// 	answer: string
// }

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
		})
	}
	return json({
		assistantRole: feedback?.assistantRole,
		rubric: feedback?.rubric,
		requirements: feedback?.requirements,
		studentResponse: feedback?.studentResponse,
		feedbackResponse: feedback.feedbackResponse,
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
		const openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		})

		try {
			const chat = await openai.chat.completions.create({
				model: 'gpt-3.5-turbo-1106',
				temperature: 0.1,
				messages: [
					...cleanContext,
					...chatHistory,
					{
						role: 'user',
						content: studentResponse,
					},
				],
			})

			const answer = chat.choices[0].message.content

			await prisma.feedback.update({
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
			}
		} catch (error: any) {
			return {
				message: studentResponse,
				answer: '',
				error: error.message || 'Something went wrong! Please try again.',
				chatHistory,
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
	const [feedbackResponse, setFeedbackResponse] = useState(
		actionData?.answer || '',
	)

	const [copied, setCopied] = useState(false)

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

	return (
		<ResizablePanelGroup direction="horizontal" className="h-screen">
			<ResizablePanel defaultSize={50} className="h-screen ">
				<div className="form-container col-span-5 col-start-1 mx-auto max-h-screen max-w-7xl space-y-2 overflow-auto p-4  sm:px-6  lg:px-8">
					<h1 className="text-center text-3xl font-bold">Feedback</h1>
					<p className="text-center text-lg font-light">
						Set the rubric and reuirements. Then paste in the Student content
						you'd like feedback on.{' '}
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
						<div className="group">
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
							></TextareaField>
						</div>
						<div className="group">
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
							></TextareaField>
						</div>
						<div className="group">
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
