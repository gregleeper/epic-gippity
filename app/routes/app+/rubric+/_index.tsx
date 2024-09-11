import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link } from '@remix-run/react'
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.tsx'
import { requireUserWithValidSubscription } from '#app/utils/permissions.ts'
import { ListOrderedIcon, PlusIcon } from 'lucide-react'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithValidSubscription(request)

	return json({
		message: 'ok',
	})
}

export default function Rubric() {
	return (
		<div className="mx-12 grid grid-cols-6 gap-6">
			<div className="h-48">
				<Link to="/app/rubric/mine">
					<Card className="transition-colors ease-in-out hover:bg-slate-300/80  dark:hover:bg-slate-700/80">
						<CardHeader>
							<CardTitle>
								<div className="flex items-center justify-between space-x-4">
									<div>
										<ListOrderedIcon />{' '}
									</div>
									<div>My Rubrics</div>
								</div>
							</CardTitle>
							<CardDescription>View Rubrics I've created </CardDescription>
						</CardHeader>
					</Card>
				</Link>
			</div>
			<div className="h-48">
				<Link to="/app/rubric/create">
					<Card className="transition-colors  ease-in-out hover:bg-slate-300/80 dark:hover:bg-slate-700/80">
						<CardHeader>
							<CardTitle>
								<div className="flex items-center justify-between space-x-4">
									<div>
										<PlusIcon />
									</div>
									<div>Generte New Rubrics</div>
								</div>
							</CardTitle>
							<CardDescription>Create new rubrics</CardDescription>
						</CardHeader>
					</Card>
				</Link>
			</div>
			<div className="h-48">
				<Link to="/app/rubric/add">
					<Card className="transition-colors  ease-in-out hover:bg-slate-300/80 dark:hover:bg-slate-700/80">
						<CardHeader>
							<CardTitle>
								<div className="flex items-center justify-between space-x-4">
									<div>
										<PlusIcon />
									</div>
									<div>Add New Rubrics</div>
									<div className="text-xs"></div>
								</div>
							</CardTitle>
							<CardDescription>Add your own rubric</CardDescription>
						</CardHeader>
					</Card>
				</Link>
			</div>
		</div>
	)
}
