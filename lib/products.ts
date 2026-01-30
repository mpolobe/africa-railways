export interface NotificationPlan {
  id: string
  name: string
  description: string
  priceInCents: number
  interval: 'month' | 'year'
  features: string[]
}

// Notification subscription plans
export const NOTIFICATION_PLANS: NotificationPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Basic notifications for casual travelers',
    priceInCents: 0,
    interval: 'month',
    features: [
      'In-app notifications',
      'Delay alerts (30 min before)',
      'Booking confirmations',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Real-time alerts for regular commuters',
    priceInCents: 200, // $2.00/month
    interval: 'month',
    features: [
      'In-app notifications',
      'Real-time delay alerts',
      'Email notifications',
      'Push notifications',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Full notification suite for power users',
    priceInCents: 500, // $5.00/month
    interval: 'month',
    features: [
      'All Standard features',
      'SMS alerts',
      'WhatsApp notifications',
      'Custom station alerts',
      'Priority boarding alerts',
      'Price drop notifications',
    ],
  },
]

export function getPlanById(planId: string): NotificationPlan | undefined {
  return NOTIFICATION_PLANS.find((p) => p.id === planId)
}
