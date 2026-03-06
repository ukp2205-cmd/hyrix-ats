/**
 * Generates a custom Job ID in the format: Job + 5 random alphanumeric characters
 * Example: Job12g6e, JobA3k9m, Job7b2x4
 */
export function generateJobId(): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
  let result = 'Job'
  
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}
