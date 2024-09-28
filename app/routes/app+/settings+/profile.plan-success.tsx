import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { Icon } from '#app/components/ui/icon.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { stripe } from './profile.plan.server.ts'
import { type BreadcrumbHandle } from './profile.tsx'

export const handle: BreadcrumbHandle = {
	breadcrumb: <Icon name="check">Subscription Success</Icon>,
}

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const url = new URL(request.url)
	const sessionId = url.searchParams.get('session_id')

	if (!sessionId) {
		throw new Response('Missing session_id', { status: 400 })
	}

	const session = await stripe.checkout.sessions.retrieve(sessionId)
	const subscriptionId = session.subscription as string

	if (session.status !== 'complete') {
		throw new Response('Payment not completed', { status: 400 })
	}

	// Update user's subscription in the database
	const updatedUser = await prisma.user.update({
		where: { id: userId },
		data: {
			stripeCustomerId: session.customer as string,
			subscriptionId: subscriptionId,
			subscriptionStatus: 'active',
			subscriptionEndDate:
				session.subscription && typeof session.subscription === 'string'
					? await stripe.subscriptions
							.retrieve(session.subscription)
							.then(sub => new Date(sub.current_period_end))
					: undefined,
			subscriptionTier:
				session.subscription && typeof session.subscription === 'string'
					? await stripe.subscriptions
							.retrieve(session.subscription)
							.then(sub => sub.items.data[0]?.price.nickname || 'Unknown')
					: undefined,
		},
	})

	return json({ user: updatedUser })
}

export default function SubscriptionSuccessRoute() {
	const { user } = useLoaderData<typeof loader>()

	return (
		<div className="space-y-6">
			<h1 className="text-h1">Subscription Successful!</h1>
			<p>Thank you for subscribing. Your new plan is now active.</p>
			<p>Subscription ID: {user.stripeCustomerId}</p>
			<p>Status: {user.subscriptionStatus}</p>
			{/* Add more details or next steps as needed */}
		</div>
	)
}
