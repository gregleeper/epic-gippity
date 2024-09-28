import { Link } from '@remix-run/react'
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
} from '#app/components/ui/card.tsx'

export default function AppIndex() {
	return (
		<div className="container mx-auto p-4">
			<h1 className="mb-6 text-3xl font-bold">App Features</h1>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Link to="/app/assignment">
					<Card>
						<CardHeader>
							<CardTitle>Assignments</CardTitle>
							<CardDescription>Manage and create assignments</CardDescription>
						</CardHeader>
					</Card>
				</Link>
				<Link to="/app/dok">
					<Card>
						<CardHeader>
							<CardTitle>Depth of Knowledge</CardTitle>
							<CardDescription>Explore DOK questions</CardDescription>
						</CardHeader>
					</Card>
				</Link>
				<Link to="/app/feedback">
					<Card>
						<CardHeader>
							<CardTitle>Feedback</CardTitle>
							<CardDescription>Provide and manage feedback</CardDescription>
						</CardHeader>
					</Card>
				</Link>
				<Link to="/app/lesson-plan">
					<Card>
						<CardHeader>
							<CardTitle>Lesson Plans</CardTitle>
							<CardDescription>Create and manage lesson plans</CardDescription>
						</CardHeader>
					</Card>
				</Link>
				<Link to="/app/newsletter">
					<Card>
						<CardHeader>
							<CardTitle>Newsletters</CardTitle>
							<CardDescription>Manage class newsletters</CardDescription>
						</CardHeader>
					</Card>
				</Link>
			</div>
		</div>
	)
}
