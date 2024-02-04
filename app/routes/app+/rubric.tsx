import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Outlet } from '@remix-run/react'

import { requireUserWithPermission } from '#app/utils/permissions.ts'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithPermission(request, 'create:chat')

	return json({
		message: 'ok',
	})
}

export default function Rubric() {
	return (
		<div>
			<h1 className="mb-4 ml-24 text-2xl font-semibold">Rubric</h1>

			<Outlet />
		</div>
	)
}
