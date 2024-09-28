import { openai } from '@ai-sdk/openai'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs, json } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { generateText } from 'ai'
import { useState } from 'react'
import { redirect } from 'remix-typedjson'
import { z } from 'zod'
import { Field } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithValidSubscription } from '#app/utils/permissions.ts'
import { PlusIcon, XIcon } from 'lucide-react'

const newsletterSchema = z.object({
	title: z.string().min(3),
	events: z.array(z.string()).optional(),
	reminders: z.array(z.string()).optional(),
	news: z.array(z.string()).optional(),
	classId: z.string().optional(),
})

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserWithValidSubscription(request)

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: newsletterSchema,
		async: false,
	})

	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}

	// Generate newsletter content using GPT-4
	const prompt = `Create a newsletter with the following components:
		Title: ${submission.value.title}
		Events: ${submission.value.events?.join(', ')}
		Reminders: ${submission.value.reminders?.join(', ')}
		News: ${submission.value.news?.join(', ')}
		
		Please format the newsletter in a fun and engaging manner. Use emojis and other fun symbols to make it more engaging. Do not over use the emojis and other symbols. Use markdown formatting.`

	const textResponse = await generateText({
		model: openai('gpt-4o-mini-2024-07-18'),
		messages: [{ role: 'user', content: prompt }],
	})

	let newsletterContent = textResponse.text

	// Create newsletter in the database
	const newsletter = await prisma.newsLetter.create({
		data: {
			title: submission.value.title,
			content: newsletterContent,
			userId,
		},
	})

	return redirect(`/app/newsletter/mine/${newsletter.id}`)
}

export default function CreateNewsletter() {
	const actionData = useActionData<typeof action>()
	const [eventFields, setEventFields] = useState<number>(1)
	const [reminderFields, setReminderFields] = useState<number>(1)
	const [newsFields, setNewsFields] = useState<number>(1)

	const [form, fields] = useForm({
		id: 'create-newsletter-form',
		constraint: getZodConstraint(newsletterSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: newsletterSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="mx-auto w-full max-w-3xl px-4 py-24">
			<div className="pb-4">
				<h2 className="text-xl font-semibold">Create Newsletter</h2>
			</div>
			<Form method="post" {...getFormProps(form)} className="space-y-6">
				<div className="space-y-4">
					<Field
						labelProps={{ children: 'Title' }}
						inputProps={{
							...getInputProps(fields.title, { type: 'text' }),
							className: 'w-full',
						}}
						errors={fields.title.errors}
					/>

					<div className="space-y-2 rounded-md  p-8 hover:bg-gray-50">
						<label className="block text-sm font-medium">Events</label>
						{Array.from({ length: eventFields }).map((_, index) => (
							<div key={index} className="flex items-center space-x-2">
								<Field
									labelProps={{ children: 'Event' }}
									inputProps={{
										...getInputProps(fields.events, { type: 'text' }),
										className: 'flex-grow',
									}}
									className="flex flex-grow items-center justify-start space-x-2"
								/>
								<Button
									type="button"
									variant="destructive"
									onClick={() => setEventFields(eventFields - 1)}
									disabled={eventFields === 1}
									className="h-8 w-8 rounded-full p-0"
									title="Remove Event"
								>
									<XIcon className="h-4 w-4" />
								</Button>
							</div>
						))}
						<Button
							type="button"
							variant="secondary"
							onClick={() => setEventFields(eventFields + 1)}
							className="h-8 w-8 rounded-full p-0"
							title="Add Event"
						>
							<PlusIcon className="h-4 w-4" />
						</Button>
					</div>

					<div className="space-y-2 rounded-md  p-8 hover:bg-gray-50">
						<label className="block text-sm font-medium">Reminders</label>
						{Array.from({ length: reminderFields }).map((_, index) => (
							<div key={index} className="flex items-center space-x-2">
								<Field
									inputProps={{
										...getInputProps(fields.reminders, { type: 'text' }),
										className: 'flex-grow',
									}}
									labelProps={{ children: 'Reminder' }}
									className="flex flex-grow items-center justify-start space-x-2"
								/>
								<Button
									type="button"
									variant="destructive"
									onClick={() => setReminderFields(reminderFields - 1)}
									disabled={reminderFields === 1}
									className="h-8 w-8 rounded-full p-0"
									title="Remove Reminder"
								>
									<XIcon className="h-4 w-4" />
								</Button>
							</div>
						))}
						<Button
							type="button"
							variant="secondary"
							onClick={() => setReminderFields(reminderFields + 1)}
							className="h-8 w-8 rounded-full p-0"
							title="Add Reminder"
						>
							<PlusIcon className="h-4 w-4" />
						</Button>
					</div>

					<div className="space-y-2 rounded-md  p-8 hover:bg-gray-50">
						<label className="block text-sm font-medium">News</label>
						{Array.from({ length: newsFields }).map((_, index) => (
							<div key={index} className="flex items-center space-x-2">
								<Field
									inputProps={{
										...getInputProps(fields.news, { type: 'text' }),
										className: 'flex-grow',
									}}
									labelProps={{ children: 'News' }}
									className="flex flex-grow items-center justify-start space-x-2"
								/>
								<Button
									type="button"
									variant="destructive"
									onClick={() => setNewsFields(newsFields - 1)}
									disabled={newsFields === 1}
									className="h-8 w-8 rounded-full p-0"
									title="Remove News"
								>
									<XIcon className="h-4 w-4" />
								</Button>
							</div>
						))}
						<Button
							type="button"
							variant="secondary"
							onClick={() => setNewsFields(newsFields + 1)}
							className="h-8 w-8 rounded-full p-0"
							title="Add News"
						>
							<PlusIcon className="h-4 w-4" />
						</Button>
					</div>

					<Button type="submit" className="w-full">
						Create Newsletter
					</Button>
				</div>
			</Form>
		</div>
	)
}
