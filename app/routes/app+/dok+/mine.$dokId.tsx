import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithPermission } from '#app/utils/permissions.ts'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await requireUserWithPermission(request, 'create:chat')
	const dok = await prisma.dOK.findUniqueOrThrow({
		where: {
			id: params.dokId,
			userId: userId,
		},
		include: {
			summary: true,
		},
	})
	return json({
		dok,
	})
}

export default function MyLessonPlanById() {
	const data = useLoaderData<typeof loader>()
	const { dok } = data

	return (
		<div className="prose prose-lg max-h-screen max-w-none overflow-auto  p-10 dark:prose-invert">
			<Markdown
				remarkPlugins={[remarkGfm]}
				children={dok.dokResponse}
			/>
		</div>
	)
}
