/**
 * Super Admin email list — update here to add/remove super admin accounts.
 */
const SUPER_ADMIN_EMAILS = [
  'sejanrandinu01@gmail.com'
]

/**
 * Returns true if the given email belongs to a super admin account.
 * @param {string|null|undefined} email
 * @returns {boolean}
 */
export function isSuperAdminEmail(email) {
  if (!email || typeof email !== 'string') return false
  return SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase())
}
