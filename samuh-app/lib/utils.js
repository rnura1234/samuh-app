// lib/utils.js

// Calculate late fee for an unpaid deposit
// Fee = late_fee_per_day × number of days since month ended
export function calculateLateFee(month, year, feePerDay = 10) {
  const today = new Date()
  const monthEnd = new Date(year, month, 0) // last day of that month

  if (today <= monthEnd) return 0 // month not over yet

  const daysLate = Math.floor((today - monthEnd) / (1000 * 60 * 60 * 24))
  return daysLate * feePerDay
}

// Get month name from number
export function getMonthName(month, year) {
  return new Date(year, month - 1).toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}
// lib/utils.js — add these to existing file

// Sanitize text input — strip dangerous characters
export function sanitize(str) {
  if (!str) return ''
  return String(str).trim().replace(/[<>]/g, '')
}

// Validate Indian phone number
export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))
}

// Validate positive amount
export function isValidAmount(amount) {
  const num = parseFloat(amount)
  return !isNaN(num) && num > 0
}


// Format currency
export function formatINR(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

