import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { ListOrderedIcon } from 'lucide-react'
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.tsx'
import { requireUserWithValidSubscription } from '#app/utils/permissions.ts'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithValidSubscription(request)

	return json({
		message: 'ok',
	})
}

export default function Submission() {
	return (
		<div className="mx-12 grid grid-cols-6 gap-6">
			<div className="h-48">
				<Link to="/app/submission/mine">
					<Card className="transition-colors ease-in-out hover:bg-slate-300/80  dark:hover:bg-slate-700/80">
						<CardHeader>
							<CardTitle>
								<div className="flex items-center justify-between space-x-4">
									<div>
										<ListOrderedIcon />{' '}
									</div>
									<div>My Submissions</div>
								</div>
							</CardTitle>
							<CardDescription>View my Submissions</CardDescription>
						</CardHeader>
					</Card>
				</Link>
			</div>
			{/* <div className="h-48">
				<Link to="/app/submission/create">
					<Card className="transition-colors  ease-in-out hover:bg-slate-300/80 dark:hover:bg-slate-700/80">
						<CardHeader>
							<CardTitle>
								<div className="flex items-center justify-between space-x-4">
									<div>
										<PlusIcon />
									</div>
									<div>Create New Submission</div>
								</div>
							</CardTitle>
							<CardDescription>Create a new submission</CardDescription>
						</CardHeader>
					</Card>
				</Link>
			</div> */}
		</div>
	)
}