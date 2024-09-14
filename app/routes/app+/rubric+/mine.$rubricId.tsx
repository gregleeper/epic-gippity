import { useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	json,
} from '@remix-run/node'
import { Link, useFetcher, useLoaderData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { z } from 'zod'
import { Field, FieldError } from '#app/components/Field.tsx'
import { SwitchConform } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '#app/components/ui/dropdown-menu.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithValidSubscription } from '#app/utils/permissions.ts'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await requireUserWithValidSubscription(request)
	const rubric = await prisma.rubric.findUniqueOrThrow({
		where: {
			id: params.rubricId,
			userId: userId,
		},
	})
	return json({
		rubric,
	})
}

export async function action({ request, params }: ActionFunctionArgs) {
	const userId = await requireUserWithValidSubscription(request)
	const formData = await request.formData()
	const isPublic = formData.get('isPublic')

	const updatedRubric = await prisma.rubric.update({
		where: {
			id: params.rubricId,
			userId: userId,
		},
		data: { isPublic: isPublic === 'true' },
	})
	return json({ rubric: updatedRubric })
}

const rubricOptionsSchema = z.object({
	isPublic: z.boolean().optional(),
})

export default function MyRubric() {
	const data = useLoaderData<typeof loader>()
	const { rubric } = data
	const [isPublic, setIsPublic] = useState(rubric.isPublic)

	const fetcher = useFetcher<typeof action>()

	console.log(fetcher.data)

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [form, fields] = useForm({
		id: 'rubric-options-form',
		constraint: getZodConstraint(rubricOptionsSchema),
		onValidate({ formData }) {
			const result = parseWithZod(formData, { schema: rubricOptionsSchema })
			console.log(result)
			return result
		},
		shouldRevalidate: 'onBlur',
	})

	useEffect(() => {
		if (fetcher.data) {
			setIsPublic(fetcher.data?.rubric?.isPublic)
		}
	}, [fetcher.data])

	return (
		<div className="prose prose-lg max-h-screen max-w-none overflow-auto  p-10 dark:prose-invert">
			<div className="flex justify-end">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline">Options</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem>
							<Link to={`/app/assignment/create?rubricId=${rubric.id}`}>
								Use in Assignment
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem>
							<div className="flex items-center justify-between">
								<Label
									htmlFor="isPublic"
									className="mr-4 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									Public
								</Label>
								<Field>
									<SwitchConform
										meta={fields.isPublic}
										onCheckedChange={checked => {
											console.log('checked', checked)

											fetcher.submit({ isPublic: checked }, { method: 'POST' })
										}}
										defaultChecked={isPublic ?? false}
									/>
									<FieldError>{fields.isPublic.errors}</FieldError>
								</Field>
							</div>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<Markdown remarkPlugins={[remarkGfm]} children={rubric.rubricResponse} />
		</div>
	)
}
