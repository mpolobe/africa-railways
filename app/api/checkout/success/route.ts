import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.redirect(new URL('/user-dashboard.html?error=no_session', request.url))
  }

  try {
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.redirect(new URL('/user-dashboard.html?error=payment_incomplete', request.url))
    }

    const userId = session.metadata?.user_id
    const planId = session.metadata?.plan_id

    if (!userId || !planId) {
      return NextResponse.redirect(new URL('/user-dashboard.html?error=invalid_metadata', request.url))
    }

    // Update user's notification tier in the database
    const { error } = await supabase
      .from('users')
      .update({
        notification_tier: planId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
      })
      .eq('id', userId)

    if (error) {
      console.error('Database update error:', error)
      return NextResponse.redirect(new URL('/user-dashboard.html?error=update_failed', request.url))
    }

    // Log the subscription in subscription_history
    await supabase.from('subscription_history').insert({
      user_id: userId,
      plan_id: planId,
      stripe_session_id: sessionId,
      amount_cents: session.amount_total,
      status: 'active',
    })

    // Redirect to dashboard with success message
    return NextResponse.redirect(
      new URL(`/user-dashboard.html?tab=notifications&upgraded=${planId}`, request.url)
    )
  } catch (error) {
    console.error('Checkout success handler error:', error)
    return NextResponse.redirect(new URL('/user-dashboard.html?error=verification_failed', request.url))
  }
}
