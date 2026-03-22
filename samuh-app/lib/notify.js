// lib/notify.js

const MSG91_AUTH_KEY  = process.env.MSG91_AUTH_KEY
const SENDER_ID       = process.env.MSG91_SENDER_ID || 'SAMUH'

// Send SMS via MSG91
async function sendSMS(phone, templateId, variables) {
  if (!MSG91_AUTH_KEY) {
    console.warn('MSG91_AUTH_KEY not set — skipping SMS')
    return { skipped: true }
  }

  // MSG91 expects 10-digit Indian numbers with 91 prefix
  const formattedPhone = phone.replace(/\D/g, '')
  const fullPhone = formattedPhone.startsWith('91')
    ? formattedPhone
    : `91${formattedPhone}`

  const body = {
    template_id: templateId,
    short_url: '0',
    realTimeResponse: '1',
    recipients: [
      {
        mobiles: fullPhone,
        ...variables,
      }
    ],
  }

  try {
    const res = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: MSG91_AUTH_KEY,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return { success: true, data }
  } catch (err) {
    console.error('MSG91 error:', err)
    return { error: err.message }
  }
}

// Send deposit reminder to one member
export async function sendDepositReminder(member, amount, month) {
  return sendSMS(
    member.phone,
    process.env.MSG91_DEPOSIT_TEMPLATE_ID,
    {
      name: member.name,
      amount: amount.toString(),
      month,
    }
  )
}

// Send loan approved notification
export async function sendLoanApprovedNotification(member, amount, rate) {
  return sendSMS(
    member.phone,
    process.env.MSG91_LOAN_TEMPLATE_ID,
    {
      name: member.name,
      amount: amount.toString(),
      rate: rate.toString(),
    }
  )
}

// Send low balance alert to admin
export async function sendLowBalanceAlert(adminPhone, balance) {
  return sendSMS(
    adminPhone,
    process.env.MSG91_BALANCE_TEMPLATE_ID,
    {
      balance: balance.toLocaleString('en-IN'),
    }
  )
}