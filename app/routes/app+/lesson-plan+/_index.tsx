import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link } from '@remix-run/react'
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.tsx'
import { requireUserWithPermission } from '#app/utils/permissions.ts'
import { ListOrderedIcon, PlusIcon } from 'lucide-react'

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
				<Link to="/app/lesson-plan/mine">
					<Card className="transition-colors ease-in-out  hover:bg-stone-300/80">
						<CardHeader>
							<CardTitle>
								<div className="flex items-center justify-between space-x-4">
									<div>
										<ListOrderedIcon />{' '}
									</div>
									<div>My Lesson Plans</div>
								</div>
							</CardTitle>
							<CardDescription>View rubrics you have created</CardDescription>
						</CardHeader>
					</Card>
				</Link>
			</div>
			<div className="h-48">
				<Link to="/app/lesson-plan/create">
					<Card className="transition-colors  ease-in-out hover:bg-stone-300/80">
						<CardHeader>
							<CardTitle>
								<div className="flex items-center justify-between space-x-4">
									<div>
										<PlusIcon />
									</div>
									<div> New Lesson Plan</div>
								</div>
							</CardTitle>
							<CardDescription>View rubrics you have created</CardDescription>
						</CardHeader>
					</Card>
				</Link>
			</div>
		</div>
	)
}
