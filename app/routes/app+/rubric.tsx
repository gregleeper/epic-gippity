import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link, Outlet } from '@remix-run/react'
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.tsx'
import { requireUserWithPermission } from '#app/utils/permissions.ts'

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserWithPermission(request, 'create:chat')

	return json({
		message: 'ok',
	})
}

export default function Rubric() {
	return (
		<div>
			<h1 className="text-2xl font-semibold">Rubric</h1>
			
			<Outlet />
		</div>
	)
}
