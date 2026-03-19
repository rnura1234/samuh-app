// lib/types.js

/**
 * @typedef {Object} Member
 * @property {string} id
 * @property {string} name
 * @property {string} phone
 * @property {string} address
 * @property {string} join_date
 * @property {'active'|'inactive'} status
 * @property {'admin'|'member'|'auditor'} role
 * @property {string} created_at
 */

/**
 * @typedef {Object} Deposit
 * @property {string} id
 * @property {string} member_id
 * @property {number} amount
 * @property {number} month
 * @property {number} year
 * @property {boolean} is_paid
 * @property {string|null} paid_at
 * @property {number} late_fee
 */

/**
 * @typedef {Object} Loan
 * @property {string} id
 * @property {string} member_id
 * @property {number} amount
 * @property {number} interest_rate
 * @property {'pending'|'active'|'closed'|'rejected'} status
 * @property {string|null} issued_at
 * @property {string|null} due_date
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} member_id
 * @property {string} type
 * @property {number} amount
 * @property {'credit'|'debit'} direction
 * @property {string} created_at
 */