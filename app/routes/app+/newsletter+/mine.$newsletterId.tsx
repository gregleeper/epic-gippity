import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithPermission } from '#app/utils/permissions.ts'
import { CopyToClipboard } from '#app/components/CopyToClipboard.tsx'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await requireUserWithPermission(request, 'create:chat')
	const newsletter = await prisma.newsLetter.findUniqueOrThrow({
		where: {
			id: params.newsletterId,
			userId: userId,
		},
	})
	return json({
		newsletter,
	})
}

export default function MyNewsletterById() {
	const data = useLoaderData<typeof loader>()
	const { newsletter } = data

	return (
		<div className="prose prose-lg max-h-screen max-w-none overflow-auto p-10 dark:prose-invert">
			<h1>{newsletter.title}</h1>
			<CopyToClipboard>
				<Markdown remarkPlugins={[remarkGfm]}>{newsletter.content}</Markdown>
			</CopyToClipboard>
		</div>
	)
}
