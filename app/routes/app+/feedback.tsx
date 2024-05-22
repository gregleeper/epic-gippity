import { type ActionFunctionArgs, json } from '@remix-run/node'
import { Outlet } from '@remix-run/react'
import { requireUserWithPermission } from '#app/utils/permissions.ts'

export async function loader({ request }: ActionFunctionArgs) {
	await requireUserWithPermission(request, 'create:chat')

	return json({
		message: 'ok',
	})
}

export default function FeedbackLayout() {
	return (
		<div className="w-full">
			<h1 className="ml-10  pb-4 text-center text-3xl font-thin">Feedback</h1>
			<Outlet />
		</div>
	)
}
