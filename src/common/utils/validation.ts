/**
 * Input validation utilities
 * @author: oldj
 * @homepage: https://oldj.net
 */

/**
 * Validate a URL string
 */
export const isValidUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' }
  }

  try {
    const urlObj = new URL(url)

    // Only allow http or https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' }
    }

    // Block localhost and private IPs for security
    const hostname = urlObj.hostname
    const privatePatterns = [
      /^localhost$/,
      /^127\./,
      /^0\.0\.0\.0$/,
      /^::1$/,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
    ]

    if (privatePatterns.some((pattern) => pattern.test(hostname))) {
      return { valid: false, error: 'Private IP addresses and localhost are not allowed' }
    }

    return { valid: true }
  } catch (e) {
    return { valid: false, error: `Invalid URL: ${e}` }
  }
}

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return ''
  }

  return input.replace(/[&<>"'/]/g, (char) => {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    }
    return escapeMap[char]
  })
}

/**
 * Validate hosts content
 */
export const validateHostsContent = (content: string): { valid: boolean; error?: string } => {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Content is required' }
  }

  // Check for suspicious patterns
  const dangerousPatterns = [
    /javascript:/i,
    /<script/i,
    /on\w+\s*=/i, // event handlers like onclick=
    /data:text\/html/i,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      return { valid: false, error: 'Content contains dangerous patterns' }
    }
  }

  // Check content size (prevent DoS)
  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  if (content.length > MAX_SIZE) {
    return { valid: false, error: 'Content is too large' }
  }

  return { valid: true }
}

/**
 * Validate IP address format
 */
export const isValidIP = (ip: string): boolean => {
  const ipv4Pattern =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const ipv6Pattern =
    /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$|^(?:[0-9a-fA-F]{1,4}:){0,7}::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}$/

  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip)
}

/**
 * Validate hostname format
 */
export const isValidHostname = (hostname: string): boolean => {
  if (!hostname || typeof hostname !== 'string') {
    return false
  }

  // RFC 1123 hostname pattern
  const hostnamePattern =
    /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/

  // Check length (max 253 characters per RFC)
  if (hostname.length > 253) {
    return false
  }

  return hostnamePattern.test(hostname)
}
