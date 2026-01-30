import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getPlanById } from '@/lib/products'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const planId = searchParams.get('plan')
  const userId = searchParams.get('user_id')

  if (!planId || !userId) {
    return NextResponse.redirect(new URL('/user-dashboard.html?error=missing_params', request.url))
  }

  const plan = getPlanById(planId)
  if (!plan) {
    return NextResponse.redirect(new URL('/user-dashboard.html?error=invalid_plan', request.url))
  }

  if (plan.priceInCents === 0) {
    return NextResponse.redirect(new URL('/user-dashboard.html?error=free_plan', request.url))
  }

  try {
    // Create a Stripe Checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.name} Notification Plan`,
              description: plan.description,
            },
            unit_amount: plan.priceInCents,
            recurring: {
              interval: plan.interval,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: userId,
        plan_id: planId,
      },
      success_url: `${request.nextUrl.origin}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/user-dashboard.html?tab=notifications&cancelled=true`,
    })

    // Redirect to Stripe Checkout
    return NextResponse.redirect(session.url!)
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.redirect(new URL('/user-dashboard.html?error=checkout_failed', request.url))
  }
}
