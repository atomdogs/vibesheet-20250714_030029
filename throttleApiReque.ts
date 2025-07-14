import { Throttle, ThrottleOptions } from './throttle'

const defaultThrottle = new Throttle({
  maxRequests: 5,
  perMilliseconds: 1000,
  concurrency: 2,
})

export default defaultThrottle

export function throttleApiRequests<T>(fn: () => Promise<T>): Promise<T> {
  return defaultThrottle.schedule(fn)
}

export function createThrottle(options: ThrottleOptions): Throttle {
  return new Throttle(options)
}