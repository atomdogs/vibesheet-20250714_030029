import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export function authenticateAndAttachUser(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const parts = authHeader.split(' ')
    const token = parts[1]
    if (!token || typeof token !== 'string') {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const secret = process.env.JWT_SECRET
    if (!secret) {
      console.error('JWT_SECRET not configured')
      return res.status(500).json({ error: 'Internal server error' })
    }

    try {
      const payload = jwt.verify(token, secret)
      if (typeof payload !== 'object' || payload === null || typeof (payload as any).userId !== 'string') {
        return res.status(401).json({ error: 'Invalid token payload' })
      }

      const { userId } = payload as { userId: string }
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) {
        return res.status(401).json({ error: 'User not found' })
      }

      ;(req as any).user = user
      return handler(req as any, res)
    } catch (err) {
      if (err instanceof TokenExpiredError || err instanceof JsonWebTokenError) {
        return res.status(401).json({ error: 'Invalid or expired token' })
      }
      console.error('Authentication middleware error:', err)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}