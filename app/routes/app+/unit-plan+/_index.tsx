import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { ListOrderedIcon, PlusIcon } from 'lucide-react'
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.tsx'
import { requireUserWithPermission } from '#app/utils/permissions.ts'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithPermission(request, 'create:chat')

	return json({
		message: 'ok',
	})
}

export default function Rubric() {
	return (
		<div className="mx-12 grid grid-cols-6 gap-6">
			<div className="h-48">
				<Link to="/app/unit-plan/mine">
					<Card className="transition-colors ease-in-out hover:bg-slate-300/80  dark:hover:bg-slate-700/80">
						<CardHeader>
							<CardTitle>
								<div className="flex items-center justify-between space-x-4">
									<div>
										<ListOrderedIcon />{' '}
									</div>
									<div>My Unit Plans</div>
								</div>
							</CardTitle>
							<CardDescription>
								View unit plans you have created
							</CardDescription>
						</CardHeader>
					</Card>
				</Link>
			</div>
			<div className="h-48">
				<Link to="/app/unit-plan/create">
					<Card className="transition-colors  ease-in-out hover:bg-slate-300/80 dark:hover:bg-slate-700/80">
						<CardHeader>
							<CardTitle>
								<div className="flex items-center justify-between space-x-4">
									<div>
										<PlusIcon />
									</div>
									<div> New Unit Plan</div>
								</div>
							</CardTitle>
							<CardDescription>Create a new unit plan</CardDescription>
						</CardHeader>
					</Card>
				</Link>
			</div>
		</div>
	)
}
