import Stripe from 'stripe'
import { prisma } from '#app/utils/db.server.ts'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2024-06-20',
})
export async function getUserSubscription(
	userId: string,
): Promise<Stripe.Subscription | null> {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { subscriptionId: true },
	})

	if (!user?.subscriptionId) return null

	const subscription = (await stripe.subscriptions.retrieve(
		user.subscriptionId,
		{
			expand: ['plan.product'],
		},
	)) as Stripe.Subscription

	return subscription
}

export async function cancelUserSubscription(userId: string): Promise<void> {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { subscriptionId: true },
	})

	if (!user?.subscriptionId) {
		throw new Error('User has no active subscription')
	}

	const subscription = await stripe.subscriptions.update(user.subscriptionId, {
		cancel_at_period_end: true,
	})
	console.log(subscription)

	// Update user's subscription status in the database
	await prisma.user.update({
		where: { id: userId },
		data: {
			cancelAtPeriodEnd: true,
			subscriptionEndDate: new Date(subscription.current_period_end * 1000),
		},
	})
}

export async function resumeUserSubscription(userId: string): Promise<void> {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { subscriptionId: true },
	})

	if (!user?.subscriptionId) {
		throw new Error('User has no active subscription')
	}

	await stripe.subscriptions.update(user.subscriptionId, {
		cancel_at_period_end: false,
	})
}
