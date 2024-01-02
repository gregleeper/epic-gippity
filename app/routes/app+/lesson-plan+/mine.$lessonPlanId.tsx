import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Badge } from '#app/components/ui/badge.tsx'
import {
	Dialog,
	DialogContent,
	DialogTrigger,
} from '#app/components/ui/dialog.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithPermission } from '#app/utils/permissions.ts'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await requireUserWithPermission(request, 'create:chat')
	const lessonPlan = await prisma.lessonPlan.findUniqueOrThrow({
		where: {
			id: params.lessonPlanId,
			userId: userId,
		},
		include: {
			summary: true,
			supportingTexts: true,
		},
	})
	return json({
		lessonPlan,
	})
}

export default function MyLessonPlanById() {
	const data = useLoaderData<typeof loader>()
	const { lessonPlan } = data

	const [hasSupportingTexts] = useState(lessonPlan.supportingTexts.length > 0)
	return (
		<div className="prose prose-lg max-h-screen max-w-none  overflow-auto p-10">
			{hasSupportingTexts ? (
				<div className="py-4">
					{lessonPlan.supportingTexts.map((text, index) => (
						<Dialog key={text.id}>
							<DialogTrigger asChild>
								<Badge>Supporting Text {index + 1}</Badge>
							</DialogTrigger>
							<DialogContent className="max-w-4xl">
								<div className="prose prose-stone max-h-[75vh] max-w-4xl overflow-auto">
									<h2 className="pb-4 text-2xl font-semibold">
										Supporting Text
									</h2>
									<Markdown
										remarkPlugins={[remarkGfm]}
										children={text.textResponse}
									/>
								</div>
							</DialogContent>
						</Dialog>
					))}
				</div>
			) : null}
			<Markdown
				remarkPlugins={[remarkGfm]}
				children={lessonPlan.lessonPlanResponse}
			/>
		</div>
	)
}
