'use client'
import { useState } from 'react'

import type { DevError } from './devtools'

import { useDevErrors } from './devtools'

const formatTime = (ts: number) => {
    const d = new Date(ts),
      h = String(d.getHours()).padStart(2, '0'),
      m = String(d.getMinutes()).padStart(2, '0'),
      s = String(d.getSeconds()).padStart(2, '0')
    return `${h}:${m}:${s}`
  },
  MAX_BADGE = 99,
  ErrorRow = ({ error }: { error: DevError }) => {
    const [expanded, setExpanded] = useState(false),
      code = error.data?.code,
      table = error.data?.table,
      op = error.data?.op
    return (
      <li className='border-b border-red-900/30 last:border-b-0'>
        <button
          className='flex w-full items-start gap-2 px-3 py-2 text-left text-xs hover:bg-red-950/30'
          onClick={() => setExpanded(v => !v)}
          type='button'>
          <span className='shrink-0 pt-px font-mono text-red-400/60'>{formatTime(error.timestamp)}</span>
          {code ? <span className='shrink-0 rounded-sm bg-red-900/50 px-1 font-mono text-red-300'>{code}</span> : null}
          <span className='min-w-0 flex-1 truncate text-red-200'>{error.message}</span>
          <span className='shrink-0 text-red-400/40'>{expanded ? '\u25B2' : '\u25BC'}</span>
        </button>
        {expanded ? (
          <div className='space-y-1 bg-red-950/20 px-3 py-2 text-xs'>
            {table || op ? (
              <p className='font-mono text-red-400/80'>
                {table ? `table: ${table}` : ''}
                {table && op ? ' \u00B7 ' : ''}
                {op ? `op: ${op}` : ''}
              </p>
            ) : null}
            <p className='break-all whitespace-pre-wrap text-red-300/90'>{error.detail}</p>
          </div>
        ) : null}
      </li>
    )
  },
  LazyConvexDevtools = () => {
    const { clear, errors } = useDevErrors(),
      [open, setOpen] = useState(false)

    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') return null

    const count = errors.length

    if (!open)
      return (
        <button
          className={`fixed right-4 bottom-4 z-9999 flex size-10 items-center justify-center rounded-full shadow-lg transition-colors ${count > 0 ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          onClick={() => setOpen(v => !v)}
          title='LazyConvex DevTools'
          type='button'>
          {count > 0 ? (
            <span className='text-sm font-bold'>{count > MAX_BADGE ? `${MAX_BADGE}+` : count}</span>
          ) : (
            <span className='text-base'>⚡</span>
          )}
        </button>
      )

    return (
      <div className='fixed right-4 bottom-4 z-9999 flex w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border border-red-900/50 bg-zinc-950 shadow-2xl'>
        <div className='flex items-center justify-between border-b border-red-900/30 bg-zinc-900 px-3 py-2'>
          <span className='text-xs font-semibold text-red-400'>LazyConvex DevTools</span>
          <div className='flex gap-1'>
            {count > 0 ? (
              <button
                className='rounded-sm px-2 py-0.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                onClick={clear}
                type='button'>
                Clear
              </button>
            ) : null}
            <button
              className='rounded-sm px-2 py-0.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              onClick={() => setOpen(v => !v)}
              type='button'>
              ✕
            </button>
          </div>
        </div>
        {count === 0 ? (
          <p className='px-3 py-6 text-center text-xs text-zinc-500'>No errors</p>
        ) : (
          <ul className='max-h-80 overflow-y-auto'>
            {errors.map(e => (
              <ErrorRow error={e} key={e.id} />
            ))}
          </ul>
        )}
      </div>
    )
  }

export default LazyConvexDevtools
