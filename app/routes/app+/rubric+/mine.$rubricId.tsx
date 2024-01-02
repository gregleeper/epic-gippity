import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import Markdown from 'react-markdown'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithPermission } from '#app/utils/permissions.ts'
import remarkGfm from 'remark-gfm'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await requireUserWithPermission(request, 'create:chat')
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

export default function MyRubric() {
	const data = useLoaderData<typeof loader>()
	const { rubric } = data
	return (
		<div className="prose prose-lg max-h-screen max-w-none  overflow-auto p-10">
			<Markdown remarkPlugins={[remarkGfm]} children={rubric.rubricResponse} />
		</div>
	)
}
