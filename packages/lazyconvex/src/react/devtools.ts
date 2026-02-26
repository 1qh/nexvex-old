'use client'
import { useEffect, useMemo, useState } from 'react'

import type { ConvexErrorData } from '../server/helpers'

import { extractErrorData, getErrorDetail, getErrorMessage } from '../server/helpers'

interface DevError {
  data?: ConvexErrorData
  detail: string
  id: number
  message: string
  timestamp: number
}

const MAX_ERRORS = 50,
  store: DevError[] = []

let nextId = 1,
  listeners: (() => void)[] = []

const notify = () => {
    for (const fn of listeners) fn()
  },
  pushError = (e: unknown) => {
    const data = extractErrorData(e),
      entry: DevError = {
        data,
        detail: getErrorDetail(e),
        id: nextId,
        message: getErrorMessage(e),
        timestamp: Date.now()
      }
    nextId += 1
    store.unshift(entry)
    if (store.length > MAX_ERRORS) store.length = MAX_ERRORS
    notify()
  },
  clearErrors = () => {
    store.length = 0
    notify()
  },
  useDevErrors = () => {
    const [, setTick] = useState(0)
    useEffect(() => {
      const fn = () => setTick(t => t + 1)
      listeners.push(fn)
      return () => {
        listeners = listeners.filter(l => l !== fn)
      }
    }, [])
    return useMemo(
      () => ({
        clear: clearErrors,
        errors: [...store],
        push: pushError
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [store.length]
    )
  }

export type { DevError }
export { clearErrors, pushError, useDevErrors }
