import { afterEach, expect, it, vi } from 'vitest'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { connectDesktopTray, type DesktopTrayAction, type DesktopTrayBridge } from '../src/client/desktop-tray.ts'

function sessionId(value: string): SessionId { return value as SessionId }

function setup() {
  const rows = createSnapshotStore({
    ids: [sessionId('123e4567-e89b-42d3-a456-426614174000'), sessionId('223e4567-e89b-42d3-a456-426614174000')],
    byId: {
      '123e4567-e89b-42d3-a456-426614174000': { id: sessionId('123e4567-e89b-42d3-a456-426614174000'), title: 'Recent title', displayTitle: 'Recent title', blank: false, origin: undefined },
      '223e4567-e89b-42d3-a456-426614174000': { id: sessionId('223e4567-e89b-42d3-a456-426614174000'), title: undefined, displayTitle: 'Unnamed', blank: true, origin: undefined },
    },
    phase: 'ready', projectionsBySession: {},
  } as never)
  const sessions = { getSnapshot: rows.getSnapshot, subscribe: rows.subscribe } as ISessions['list']
  let actionListener: ((action: DesktopTrayAction) => void) | undefined
  const bridge: DesktopTrayBridge = {
    updateRecentConversations: vi.fn(),
    onAction: listener => { actionListener = listener; return () => { actionListener = undefined } },
  }
  const workspace = { openSession: vi.fn(), startSession: vi.fn() }
  const more = vi.fn()
  const dispose = connectDesktopTray(bridge, sessions, workspace, more)
  return { rows, bridge, workspace, more, dispatch: (action: DesktopTrayAction) => actionListener?.(action), dispose }
}

afterEach(() => { vi.restoreAllMocks() })

it('publishes recent nonblank conversations and routes tray actions through Workspace navigation', () => {
  const f = setup()
  expect(f.bridge.updateRecentConversations).toHaveBeenCalledExactlyOnceWith([
    { sessionId: '123e4567-e89b-42d3-a456-426614174000', title: 'Recent title' },
  ])
  f.dispatch({ kind: 'open-session', sessionId: '123e4567-e89b-42d3-a456-426614174000' })
  f.dispatch({ kind: 'new' })
  f.dispatch({ kind: 'more' })
  expect(f.workspace.openSession).toHaveBeenCalledExactlyOnceWith(sessionId('123e4567-e89b-42d3-a456-426614174000'))
  expect(f.workspace.startSession).toHaveBeenCalledOnce()
  expect(f.more).toHaveBeenCalledOnce()
  f.dispose()
})

it('does not open an unvalidated Session id from a native menu action', () => {
  const f = setup()
  f.dispatch({ kind: 'open-session', sessionId: 'not-an-id' })
  expect(f.workspace.openSession).not.toHaveBeenCalled()
  f.dispose()
})
