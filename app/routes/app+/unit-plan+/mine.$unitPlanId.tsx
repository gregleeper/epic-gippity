import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithPermission } from '#app/utils/permissions.ts'
import { useEffect } from 'react'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await requireUserWithPermission(request, 'create:chat')
	const unitPlan = await prisma.unitPlan.findUniqueOrThrow({
		where: {
			id: params.unitPlanId,
			userId: userId,
		},
		include: {
			summary: true,
		},
	})
	const summary = await prisma.summary.findUnique({
		where: {
			model_instanceId: {
				model: 'unitPlan',
				instanceId: unitPlan.id,
			},
		},
	})
	console.log(summary)

	return json({
		unitPlan,
		summary,
	})
}

export default function MyLessonPlanById() {
	const data = useLoaderData<typeof loader>()
	const { unitPlan, summary } = data

	const fetcher = useFetcher()

	useEffect(() => {
		if (summary === null) {
			fetcher.submit(
				{
					text: unitPlan.unitPlanResponse,
					lengthOfSummary: 10,
					modelToUpdate: 'unitPlan',
					instanceId: unitPlan.id,
				},
				{
					method: 'post',
					action: '/resources/summarizer',
					fetcherKey: 'summary',
					preventScrollReset: false,
				},
			)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<div className="prose prose-lg max-h-screen max-w-none overflow-auto  p-10 dark:prose-invert">
			<Markdown
				remarkPlugins={[remarkGfm]}
				children={unitPlan.unitPlanResponse}
			/>
		</div>
	)
}
