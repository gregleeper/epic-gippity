import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { prisma } from '#app/utils/db.server.ts'
import { Button } from '#app/components/ui/button.tsx'

export async function loader({ params }: LoaderFunctionArgs) {
	const rubric = await prisma.rubric.findUniqueOrThrow({
		where: {
			id: params.rubricId,
			isPublic: true,
		},
	})
	return json({
		rubric,
	})
}

export default function PublicRubric() {
	const data = useLoaderData<typeof loader>()
	const { rubric } = data
	return (
		<div className="prose prose-lg max-h-screen max-w-none overflow-auto p-10 dark:prose-invert">
			<Markdown remarkPlugins={[remarkGfm]} children={rubric.rubricResponse} />
		</div>
	)
}
