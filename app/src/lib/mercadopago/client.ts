import { MercadoPagoConfig, Payment, PreApproval, PreApprovalPlan, Preference } from 'mercadopago'

function getMercadoPagoAccessToken() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error('MERCADO_PAGO_ACCESS_TOKEN nao configurado.')
  }

  return accessToken
}

export function getMercadoPagoClient() {
  return new MercadoPagoConfig({
    accessToken: getMercadoPagoAccessToken(),
    options: {
      timeout: 5000,
    },
  })
}

export function getMercadoPagoPreferenceClient() {
  return new Preference(getMercadoPagoClient())
}

export function getMercadoPagoPaymentClient() {
  return new Payment(getMercadoPagoClient())
}

export function getMercadoPagoPreApprovalClient() {
  return new PreApproval(getMercadoPagoClient())
}

export function getMercadoPagoPreApprovalPlanClient() {
  return new PreApprovalPlan(getMercadoPagoClient())
}

export function getMercadoPagoWebhookSecret() {
  return process.env.MERCADO_PAGO_WEBHOOK_SECRET ?? null
}
