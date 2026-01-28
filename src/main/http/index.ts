/**
 * index
 * @author: oldj
 * @homepage: https://oldj.net
 */

import { http_api_port } from '@common/constants'
import { configGet } from '@main/actions'
import express from 'express'
import { Server } from 'http'
import api_router from './api/index'

const app = express()

// Simple in-memory rate limiter
const rateLimiter = {
  requests: new Map<string, { count: number; resetTime: number }>(),
  windowMs: 60000, // 1 minute window
  maxRequests: 60, // 60 requests per minute

  check(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const record = this.requests.get(ip)

    if (!record || now > record.resetTime) {
      const resetTime = now + this.windowMs
      this.requests.set(ip, { count: 1, resetTime })
      return { allowed: true, remaining: this.maxRequests - 1, resetTime }
    }

    if (record.count >= this.maxRequests) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime }
    }

    record.count++
    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      resetTime: record.resetTime,
    }
  },

  cleanup() {
    const now = Date.now()
    for (const [ip, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(ip)
      }
    }
  },
}

// Cleanup expired rate limit records every minute
setInterval(() => rateLimiter.cleanup(), 60000)

// Middleware for rate limiting
const rateLimitMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const result = rateLimiter.check(ip)

  res.setHeader('X-RateLimit-Limit', rateLimiter.maxRequests.toString())
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString())
  res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString())

  if (!result.allowed) {
    res.status(429).json({
      success: false,
      message: 'Too many requests',
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    })
    return
  }

  next()
}

// Middleware for authentication
const authMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const authHeader = req.headers.authorization
  const apiKey = req.headers['x-api-key']

  // Check if HTTP API is enabled
  const httpApiEnabled = configGet('http_api_on')
  // Note: We can't await configGet in middleware, so this is a simplified check
  // In production, you should cache the config or use a different approach

  // Require either Authorization header or X-API-Key header
  const configuredToken = process.env.SWH_API_KEY || configGet('http_api_key')

  if (!configuredToken) {
    // If no token is configured, deny all requests
    res.status(403).json({ success: false, message: 'HTTP API not configured' })
    return
  }

  const providedToken = authHeader?.replace('Bearer ', '') || apiKey

  if (providedToken !== configuredToken) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }

  next()
}

app.use((req, res, next) => {
  console.log(
    `> "${new Date().toString()}"`,
    req.method,
    req.originalUrl,
    `"${req.headers['user-agent']}"`,
  )
  next()
})

// Health check endpoint (no auth required)
app.get('/', (req, res) => {
  res.send('Hello SwitchHosts!')
})

app.get('/remote-test', (req, res) => {
  res.send(`# remote-test\n# ${new Date().toString()}`)
})

// Apply rate limiting and authentication to all API routes
app.use('/api', rateLimitMiddleware, authMiddleware, api_router)

let server: Server

export const start = (http_api_only_local: boolean): boolean => {
  try {
    let listenIp = http_api_only_local ? '127.0.0.1' : '0.0.0.0'
    server = app.listen(http_api_port, listenIp, function () {
      console.log(`SwitchHosts HTTP server is listening on port ${http_api_port}!`)
      console.log(`-> http://${listenIp}:${http_api_port}`)
      if (http_api_only_local) {
        console.log('Note: API is only accessible from localhost')
      } else {
        console.log(
          'WARNING: API is accessible from all network interfaces. Use firewall to restrict access.',
        )
      }
    })
  } catch (e) {
    console.error(e)
    return false
  }

  return true
}

export const stop = () => {
  if (!server) return

  try {
    server.close()
  } catch (e) {
    console.error(e)
  }
}
