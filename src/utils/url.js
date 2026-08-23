/**
 * Helper to generate the student portal URL.
 * Uses the custom subdomain `https://student.classmastertms.com` on production environments,
 * and falls back to `${window.location.origin}/student-portal` in local dev/preview environments.
 * 
 * @param {string} studentId - Unique Student ID (e.g. ST001)
 * @returns {string} Fully qualified student portal URL
 */
export const getStudentPortalUrl = (studentId) => {
  if (!studentId) return ''
  const hostname = window.location.hostname
  const isProduction = hostname.includes('classmastertms.com')
  const baseUrl = isProduction ? 'https://student.classmastertms.com' : `${window.location.origin}/student-portal`
  return `${baseUrl}?id=${studentId}`
}
