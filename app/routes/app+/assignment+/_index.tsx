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

export default function FeedbackIndexRoute() {
	return (
		<div className="mx-12 grid grid-cols-6 gap-6">
			<div className="h-48">
				<Link to="/app/feedback/mine">
					<Card className="transition-colors ease-in-out   hover:bg-stone-300/80 dark:hover:bg-stone-700/80">
						<CardHeader>
							<CardTitle>
								<div className="flex items-center justify-between space-x-4">
									<div>
										<ListOrderedIcon />{' '}
									</div>
									<div>My Feedbacks</div>
								</div>
							</CardTitle>
							<CardDescription>View all previous Feedbacks</CardDescription>
						</CardHeader>
					</Card>
				</Link>
			</div>
			<div className="h-48">
				<Link to="/app/feedback/create">
					<Card className="transition-colors  ease-in-out hover:bg-stone-300/80 dark:hover:bg-stone-700/80">
						<CardHeader>
							<CardTitle>
								<div className="flex items-center justify-between space-x-4">
									<div>
										<PlusIcon />
									</div>
									<div> New Feedback</div>
								</div>
							</CardTitle>
							<CardDescription>Create a new Feedback</CardDescription>
						</CardHeader>
					</Card>
				</Link>
			</div>
		</div>
	)
}
