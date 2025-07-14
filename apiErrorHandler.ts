import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import ApiError from 'your-api-error-class';

export function withApiErrorHandler(handler: NextApiHandler): NextApiHandler {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    try {
      await handler(req, res)
    } catch (error: unknown) {
      await handleError(error, res)
    }
  }
}

async function handleError(error: unknown, res: NextApiResponse) {
  if (res.headersSent) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Response headers already sent, error:', error)
    }
    return
  }

  let statusCode = 500
  let message = 'Internal Server Error'
  let errorCode: string | undefined
  let details: unknown

  if (error instanceof ApiError) {
    statusCode = error.statusCode
    message = error.message
    errorCode = error.errorCode
    details = error.details
  } else if (error instanceof ZodError) {
    statusCode = 400
    message = 'Validation Error'
    details = error.errors
  } else if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      statusCode = 409
      message = 'Duplicate resource'
      details = error.meta
    } else {
      statusCode = 400
      message = error.message
    }
  } else if (isErrorObject(error) && typeof (error as any).statusCode === 'number') {
    statusCode = (error as any).statusCode
    if (typeof (error as any).message === 'string') {
      message = (error as any).message
    }
    if ('details' in (error as any)) {
      details = (error as any).details
    }
  } else if (isErrorObject(error) && typeof (error as any).message === 'string') {
    message = (error as any).message
  }

  if (process.env.NODE_ENV === 'production') {
    console.error(`[API Error] ${message}`)
  } else {
    console.error(error)
  }

  const errorPayload: Record<string, unknown> = { message }
  if (errorCode) errorPayload.code = errorCode
  if (details !== undefined) errorPayload.details = details

  res.status(statusCode).json({ success: false, error: errorPayload })
}

function isErrorObject(error: unknown): error is Record<string, unknown> {
  return typeof error === 'object' && error !== null
}