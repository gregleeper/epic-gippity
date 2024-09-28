import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Outlet } from '@remix-run/react'
import { requireUserWithPermission } from '#app/utils/permissions.ts'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithPermission(request, 'update:user')

	return json({
		message: 'ok',
	})
}

export default function SettingsLayout() {
	return (
		<div className="w-full">
			<h1 className="ml-10 pb-4 text-center text-3xl font-thin">Settings</h1>
			<Outlet />
		</div>
	)
}
