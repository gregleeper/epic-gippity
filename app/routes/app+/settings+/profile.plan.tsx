import { type SEOHandle } from '@nasa-gcn/remix-seo'
import {
	json,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from '@remix-run/node'
import {
	Form,
	useLoaderData,
	useActionData,
	useNavigation,
} from '@remix-run/react'
import { useEffect, useState } from 'react'
import type Stripe from 'stripe'
import { z } from 'zod'
import { Button } from '#app/components/ui/button.tsx'
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardFooter,
} from '#app/components/ui/card.tsx'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '#app/components/ui/dialog.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import {
	getUserSubscription,
	stripe,
	cancelUserSubscription,
	resumeUserSubscription,
} from './profile.plan.server.ts'
import { type BreadcrumbHandle } from './profile.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'

export const handle: BreadcrumbHandle & SEOHandle = {
	breadcrumb: <Icon name="credit-card">Choose Plan</Icon>,
	getSitemapEntries: () => null,
}

const PlanSchema = z.object({
	intent: z.enum([
		'createSubscription',
		'cancelSubscription',
		'resumeSubscription',
	]),
	planId: z.string().optional(),
})

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			email: true,
			subscriptionTier: true,
			subscriptionStatus: true,
			cancelAtPeriodEnd: true,
			subscriptionEndDate: true,
		},
	})

	const subscription = await getUserSubscription(userId)

	if (subscription) {
		await prisma.user.update({
			where: { id: userId },
			data: {
				// subscriptionTier: subscription.plan.product.name as string,
				subscriptionStatus: subscription.status,
				cancelAtPeriodEnd: subscription.cancel_at_period_end,
				subscriptionEndDate: subscription.current_period_end
					? new Date(subscription.current_period_end * 1000)
					: null,
			},
		})
	} else {
		await prisma.user.update({
			where: { id: userId },
			data: {
				subscriptionTier: null,
				subscriptionStatus: null,
				cancelAtPeriodEnd: false,
				subscriptionEndDate: null,
			},
		})
	}

	const plans = await stripe.prices.list({
		expand: ['data.product'],
		active: true,
		type: 'recurring',
	})
	console.log('plans', plans)

	return json({ user, subscription, plans: plans.data })
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = PlanSchema.safeParse(Object.fromEntries(formData))

	if (!submission.success) {
		return json({ errors: submission.error.flatten() }, { status: 400 })
	}

	const { intent, planId } = submission.data

	if (intent === 'resumeSubscription') {
		try {
			await resumeUserSubscription(userId)
			return redirectWithToast('/app/settings/profile/plan', {
				type: 'success',
				title: 'Subscription resumed',
				description: 'Your subscription has been resumed successfully.',
			})
		} catch (error) {
			return json(
				{ errors: { form: ['Failed to resume subscription'] } },
				{ status: 500 },
			)
		}
	}

	if (intent === 'cancelSubscription') {
		try {
			await cancelUserSubscription(userId)
			return redirectWithToast('/app/settings/profile/plan', {
				type: 'success',
				title: 'Subscription cancelled',
				description: 'Your subscription has been cancelled successfully.',
			})
		} catch (error) {
			return json(
				{ errors: { form: ['Failed to cancel subscription'] } },
				{ status: 500 },
			)
		}
	}

	if (intent === 'createSubscription') {
		if (!planId) {
			return json(
				{ errors: { planId: ['Plan ID is required'] } },
				{ status: 400 },
			)
		}
		// Existing checkout session creation logic
		await prisma.user.findUniqueOrThrow({
			where: { id: userId },
			select: { email: true, stripeCustomerId: true },
		})

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: [
				{
					price: planId,
					quantity: 1,
				},
			],
			mode: 'subscription',
			success_url: `${process.env.BASE_URL}/app/settings/profile/plan-success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.BASE_URL}/app/settings/profile/plan`,
		})

		if (session.url) {
			return redirectWithToast(session.url, {
				type: 'message',
				title: 'Checkout started',
				description: 'You are being redirected to Stripe checkout.',
			})
		}
	}

	return json({ errors: { form: ['Invalid action'] } }, { status: 400 })
}

export default function ChoosePlanRoute() {
	const { user, subscription, plans } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
	console.log('plans', plans)
	console.log('user', user)
	console.log('subscription', subscription)
	const navigation = useNavigation()

	useEffect(() => {
		if (actionData?.errors) {
			// Handle errors, e.g., show a toast or update UI
		}
	}, [actionData])

	function hasPlan(subscription: Stripe.Subscription) {
		if (
			typeof subscription?.plan === 'object' &&
			'product' in subscription.plan
		) {
			return true
		}
		return false
	}

	if (
		subscription &&
		subscription.status === 'active' &&
		!subscription.cancel_at_period_end
	) {
		return (
			<div className="space-y-6">
				<h1 className="text-h1">Your Current Plan</h1>
				<Card className="mx-auto w-full max-w-md">
					<CardHeader>
						<CardTitle>
							{hasPlan(subscription)
								? subscription.plan.product.name
								: 'No plan'}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{hasPlan(subscription) && (
								<>
									<p className="text-2xl font-semibold">
										${(subscription.plan.amount! / 100).toFixed(2)} /{' '}
										{subscription.plan.interval}
									</p>
									<p className="text-sm text-muted-foreground">
										Status:{' '}
										<span className="font-medium">{subscription.status}</span>
									</p>
									<p className="text-sm text-muted-foreground">
										Next billing date:{' '}
										<span className="font-medium">
											{new Date(
												subscription.current_period_end * 1000,
											).toLocaleDateString()}
										</span>
									</p>
								</>
							)}
						</div>
					</CardContent>
				</Card>
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="destructive">Cancel Subscription</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Cancel Subscription</DialogTitle>
							<DialogDescription>
								Are you sure you want to cancel your subscription? This action
								cannot be undone.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Form method="POST">
								<input type="hidden" name="intent" value="cancelSubscription" />
								<Button
									type="submit"
									variant="destructive"
									disabled={navigation.state !== 'idle'}
								>
									Yes, Cancel Subscription
								</Button>
							</Form>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		)
	}
	if (subscription?.cancel_at_period_end && subscription?.status === 'active') {
		return (
			<div className="space-y-6">
				<h1 className="text-xl font-semibold">Your Subscription</h1>
				<Card>
					<CardContent className="pt-6">
						<div className="space-y-2">
							<p className="text-lg font-medium">
								Current Plan: {subscription.plan.nickname}
							</p>
							<p className="text-2xl font-semibold">
								${(subscription.plan.amount! / 100).toFixed(2)} /{' '}
								{subscription.plan.interval}
							</p>
							<p className="text-sm text-muted-foreground">
								Status:{' '}
								<span className="font-medium">Canceling at end of period</span>
							</p>
							<p className="text-sm text-muted-foreground">
								Subscription ends on:{' '}
								<span className="font-medium">
									{new Date(
										subscription.current_period_end * 1000,
									).toLocaleDateString()}
								</span>
							</p>
						</div>
					</CardContent>
					<CardFooter>
						<Form method="POST">
							<input type="hidden" name="intent" value="resumeSubscription" />
							<Button type="submit" variant="secondary">
								Resume Subscription
							</Button>
						</Form>
					</CardFooter>
				</Card>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<h1 className="text-xl font-semibold">Choose Your Plan</h1>
			<p>Select a plan that fits your needs:</p>
			<Form method="POST">
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{plans.map(plan => (
						<Card
							key={plan.id}
							className={`${
								selectedPlan === plan.id
									? 'border-amber-500 bg-accent shadow-md shadow-amber-200/50'
									: ''
							}`}
						>
							<CardHeader>
								<CardTitle>{plan.product?.name}</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-2xl font-semibold">
									${(plan.unit_amount! / 100).toFixed(2)} /{' '}
									{plan.recurring?.interval}
								</p>
							</CardContent>
							<CardFooter>
								<Button
									type="button"
									onClick={() => setSelectedPlan(plan.id)}
									className="w-full"
								>
									{selectedPlan === plan.id ? 'Selected' : 'Select'}
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
				<input type="hidden" name="intent" value="createSubscription" />
				<input type="hidden" name="planId" value={selectedPlan ?? ''} />
				<Button
					type="submit"
					className="mt-6"
					disabled={navigation.state !== 'idle'}
				>
					Proceed to Checkout
				</Button>
			</Form>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
