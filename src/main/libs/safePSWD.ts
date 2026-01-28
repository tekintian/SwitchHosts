/**
 * safe-pswd
 * @author oldj
 * @blog https://oldj.net
 */

/**
 * Safely escape password for shell command execution
 * This prevents command injection by properly escaping special shell characters
 */
export default (pswd: string): string => {
  // Use single quote wrapping and escape single quotes with '\'\''
  // This is the safest method for shell parameter passing
  const escaped = pswd.replace(/'/g, "'\\''")
  return `'${escaped}'`
}
