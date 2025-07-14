import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import cookie from 'cookie'
import axios from 'axios'
import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const requiredEnvs = [
  'ENCRYPTION_KEY',
  'JWT_SECRET',
  'LINKEDIN_CLIENT_ID',
  'LINKEDIN_CLIENT_SECRET',
  'APP_BASE_URL'
] as const

for (const name of requiredEnvs) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!
if (!/^[0-9a-fA-F]{64}$/.test(ENCRYPTION_KEY)) {
  throw new Error('ENCRYPTION_KEY must be a 32-byte hex string (64 hex characters)')
}

const JWT_SECRET = process.env.JWT_SECRET!
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!
const APP_BASE_URL = process.env.APP_BASE_URL!

// PrismaClient singleton for serverless environments
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}
const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma

const SCOPES = ['r_liteprofile', 'r_emailaddress', 'w_member_social'].join(' ')
const STATE_COOKIE_NAME = 'lnkd_oauth_state'
const SESSION_COOKIE_NAME = 'session'

function encrypt(text: string) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    iv: iv.toString('hex'),
    data: encrypted.toString('hex'),
    tag: tag.toString('hex')
  }
}

function decrypt(encrypted: { iv: string; data: string; tag: string }) {
  const iv = Buffer.from(encrypted.iv, 'hex')
  const tag = Buffer.from(encrypted.tag, 'hex')
  const encryptedText = Buffer.from(encrypted.data, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()])
  return decrypted.toString('utf8')
}

function generateState() {
  return crypto.randomBytes(16).toString('hex')
}

function getSession(req: NextApiRequest) {
  const raw = req.cookies[SESSION_COOKIE_NAME]
  if (!raw) return null
  try {
    const payload = jwt.verify(raw, JWT_SECRET) as { userId: string }
    return payload
  } catch {
    return null
  }
}

export async function initiateLinkedInOAuth(req: NextApiRequest, res: NextApiResponse) {
  try {
    const state = generateState()
    const redirectUri = `${APP_BASE_URL}/api/auth/linkedin/callback`
    res.setHeader('Set-Cookie', cookie.serialize(STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/linkedin/callback',
      maxAge: 300
    }))
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: LINKEDIN_CLIENT_ID,
      redirect_uri: redirectUri,
      state,
      scope: SCOPES
    })
    res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`)
  } catch (error) {
    console.error('initiateLinkedInOAuth error:', error)
    res.status(500).send('Internal server error')
  }
}

export async function handleLinkedInCallback(req: NextApiRequest, res: NextApiResponse) {
  const { code, state } = req.query
  const storedState = req.cookies[STATE_COOKIE_NAME]
  if (!state || state !== storedState || !code) {
    return res.status(400).send('Invalid state or missing code')
  }
  res.setHeader('Set-Cookie', cookie.serialize(STATE_COOKIE_NAME, '', {
    maxAge: -1,
    path: '/api/auth/linkedin/callback'
  }))
  let tokenResponse
  try {
    tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', new URLSearchParams({
      grant_type: 'authorization_code',
      code: String(code),
      redirect_uri: `${APP_BASE_URL}/api/auth/linkedin/callback`,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
  } catch (error) {
    console.error('LinkedIn accessToken request failed:', error)
    return res.status(502).send('Failed to retrieve access token')
  }
  const { access_token, expires_in } = tokenResponse.data
  const session = getSession(req)
  if (!session) return res.status(401).send('Unauthorized')
  const encrypted = encrypt(access_token)
  const expiresAt = new Date(Date.now() + expires_in * 1000)
  try {
    await prisma.linkedInToken.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        token: encrypted.data,
        iv: encrypted.iv,
        tag: encrypted.tag,
        expiresAt
      },
      update: {
        token: encrypted.data,
        iv: encrypted.iv,
        tag: encrypted.tag,
        expiresAt
      }
    })
  } catch (error) {
    console.error('Prisma upsert failed:', error)
    return res.status(500).send('Internal server error')
  }
  res.redirect(`${APP_BASE_URL}/dashboard`)
}

export async function revokeLinkedInToken(req: NextApiRequest, res: NextApiResponse) {
  const session = getSession(req)
  if (!session) return res.status(401).send('Unauthorized')
  let record
  try {
    record = await prisma.linkedInToken.findUnique({ where: { userId: session.userId } })
  } catch (error) {
    console.error('Prisma findUnique failed:', error)
    return res.status(500).send('Internal server error')
  }
  if (!record) return res.status(404).send('No token found')
  let accessToken: string
  try {
    accessToken = decrypt({ iv: record.iv, data: record.token, tag: record.tag })
  } catch (error) {
    console.error('Token decryption failed:', error)
    return res.status(500).send('Internal server error')
  }
  try {
    await axios.post('https://www.linkedin.com/oauth/v2/revoke', new URLSearchParams({
      token: accessToken,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
  } catch (error) {
    console.error('LinkedIn revoke request failed:', error)
    return res.status(502).send('Failed to revoke token')
  }
  try {
    await prisma.linkedInToken.delete({ where: { userId: session.userId } })
  } catch (error) {
    console.error('Prisma delete failed:', error)
    return res.status(500).send('Internal server error')
  }
  res.status(200).send({ success: true })
}