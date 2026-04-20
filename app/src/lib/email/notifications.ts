type EmailPayload = {
  to: string
  subject: string
  html: string
  text: string
}

function getEmailConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM_EMAIL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  }
}

async function sendEmail(payload: EmailPayload) {
  const config = getEmailConfig()

  if (!config.apiKey || !config.from) {
    console.warn('[email] RESEND_API_KEY ou RESEND_FROM_EMAIL nao configurados. E-mail nao enviado.')
    return { sent: false, skipped: true }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Falha ao enviar e-mail: ${body}`)
  }

  return { sent: true, skipped: false }
}

export async function sendInstructorDocsApprovedEmail(params: {
  to: string
  name: string
}) {
  const config = getEmailConfig()
  const loginUrl = `${config.appUrl}/login/instrutor`

  return sendEmail({
    to: params.to,
    subject: 'Seus documentos foram aprovados no CNH Simples',
    text: `Ola, ${params.name}. Seus documentos foram aprovados com sucesso no CNH Simples. Entre na sua conta para acompanhar as proximas etapas: ${loginUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0F172A; line-height: 1.6;">
        <h1 style="margin-bottom: 12px;">Documentos aprovados com sucesso</h1>
        <p>Ola, ${params.name}.</p>
        <p>Seu cadastro documental no <strong>CNH Simples</strong> foi analisado e aprovado pelo administrador.</p>
        <p>Agora voce pode entrar na sua conta para acompanhar as proximas etapas do cadastro.</p>
        <p style="margin: 24px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: #3ECF8E; color: #0F172A; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600;">
            Acessar minha conta
          </a>
        </p>
        <p>Se voce nao reconhece esta mensagem, pode ignorar este e-mail.</p>
      </div>
    `,
  })
}

export async function sendInstructorActivatedEmail(params: {
  to: string
  name: string
}) {
  const config = getEmailConfig()
  const dashboardUrl = `${config.appUrl}/painel`

  return sendEmail({
    to: params.to,
    subject: 'Seu cadastro foi ativado no CNH Simples',
    text: `Ola, ${params.name}. Seu cadastro foi ativado com sucesso no CNH Simples. Acesse o painel: ${dashboardUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0F172A; line-height: 1.6;">
        <h1 style="margin-bottom: 12px;">Cadastro ativado com sucesso</h1>
        <p>Ola, ${params.name}.</p>
        <p>Seu cadastro de instrutor esta ativo no <strong>CNH Simples</strong>.</p>
        <p>Voce ja pode acessar o painel e acompanhar sua operacao na plataforma.</p>
        <p style="margin: 24px 0;">
          <a href="${dashboardUrl}" style="display: inline-block; background: #3ECF8E; color: #0F172A; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600;">
            Abrir painel
          </a>
        </p>
        <p>Se voce nao reconhece esta mensagem, pode ignorar este e-mail.</p>
      </div>
    `,
  })
}
