'use client'

import type { FunctionReference } from 'convex/server'

import { useMutation, useQuery } from 'convex/react'
import { useCallback, useEffect, useRef } from 'react'

import { HEARTBEAT_INTERVAL_MS } from '../server/presence'

interface PresenceRefs {
  heartbeat: FunctionReference<'mutation'>
  leave: FunctionReference<'mutation'>
  list: FunctionReference<'query'>
}
interface PresenceUser {
  data: unknown
  lastSeen: number
  userId: string
}

interface UsePresenceOptions {
  data?: Record<string, unknown>
  enabled?: boolean
}

interface UsePresenceResult {
  leave: () => void
  updatePresence: (data: Record<string, unknown>) => void
  users: PresenceUser[]
}

const usePresence = (refs: PresenceRefs, roomId: string, options?: UsePresenceOptions): UsePresenceResult => {
  const enabled = options?.enabled !== false,
    heartbeatMut = useMutation(refs.heartbeat),
    leaveMut = useMutation(refs.leave),
    users = useQuery(refs.list, enabled ? { roomId } : 'skip') as PresenceUser[] | undefined,
    dataRef = useRef(options?.data),
    roomIdRef = useRef(roomId)

  useEffect(() => {
    dataRef.current = options?.data
    roomIdRef.current = roomId
  })

  useEffect(() => {
    if (!enabled) return
    const sendHeartbeat = () => {
      const args: Record<string, unknown> = { roomId: roomIdRef.current }
      if (dataRef.current !== undefined) args.data = dataRef.current
      heartbeatMut(args)
    }
    sendHeartbeat()
    const id = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)
    return () => {
      clearInterval(id)
      leaveMut({ roomId: roomIdRef.current })
    }
  }, [enabled, heartbeatMut, leaveMut])

  const updatePresence = useCallback(
      (data: Record<string, unknown>) => {
        dataRef.current = data
        heartbeatMut({ data, roomId: roomIdRef.current })
      },
      [heartbeatMut]
    ),
    leave = useCallback(() => {
      leaveMut({ roomId: roomIdRef.current })
    }, [leaveMut])

  return {
    leave,
    updatePresence,
    users: users ?? []
  }
}

export type { PresenceRefs, PresenceUser, UsePresenceOptions, UsePresenceResult }
export { usePresence }
