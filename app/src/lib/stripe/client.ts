import Stripe from 'stripe'

function getStripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY nao configurado.')
  return key
}

export function getStripeClient() {
  return new Stripe(getStripeSecretKey())
}

export function getStripeMembershipPriceId() {
  const priceId = process.env.STRIPE_MEMBERSHIP_PRICE_ID
  if (!priceId) throw new Error('STRIPE_MEMBERSHIP_PRICE_ID nao configurado.')
  return priceId
}

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null
}
