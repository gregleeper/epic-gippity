import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithValidSubscription } from '#app/utils/permissions.ts'
import { useEffect } from 'react'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await requireUserWithValidSubscription(request)
	const dok = await prisma.dOK.findUniqueOrThrow({
		where: {
			id: params.dokId,
			userId: userId,
		},
		include: {
			summary: true,
		},
	})
	const summary = await prisma.summary.findFirst({
		where: {
			userId: userId,
			instanceId: dok.id,
			model: 'dok'
		},
	})
	return json({
		dok,
		summary,
	})
}

export default function MyDokById() {
	const data = useLoaderData<typeof loader>()
	const { dok, summary } = data
	const fetcher = useFetcher()

	useEffect(() => {
		if (!summary) {
			fetcher.submit({
				text: dok.dokResponse,
				lengthOfSummary: 10,
				modelToUpdate: 'dok',
				instanceId: dok.id,
			}, {
				method: 'POST',
				action: '/resources/summarizer',
				fetcherKey: 'summary',
				preventScrollReset: false,
			})
		}
	}, [])
	return (
		<div className="prose prose-lg max-h-screen max-w-none overflow-auto  p-10 dark:prose-invert">
			<Markdown remarkPlugins={[remarkGfm]} children={dok.dokResponse} />
		</div>
	)
}
