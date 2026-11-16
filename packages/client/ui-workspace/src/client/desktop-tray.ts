/** Desktop tray actions backed by the existing Workspace session catalog. */

import { brandString } from '@deepseek-ai/dsh-brand'
import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { UiWorkspace } from './navigation.ts'

/** One recent conversation displayed by the native Desktop menu. */
export interface DesktopRecentConversation {
  /** Durable Session identity. */
  readonly sessionId: string
  /** Human-facing title already projected by the Workspace session catalog. */
  readonly title: string
}

/** Action sent from the native tray to the Desktop Client. */
export type DesktopTrayAction =
  | { readonly kind: 'new' }
  | { readonly kind: 'more' }
  | { readonly kind: 'open-session'; readonly sessionId: string }

/** Preload capability used only by the Desktop document. */
export interface DesktopTrayBridge {
  /** Replace the native menu's recent conversation entries. */
  updateRecentConversations(conversations: readonly DesktopRecentConversation[]): void
  /** Listen for a native menu action. @returns Listener removal. */
  onAction(listener: (action: DesktopTrayAction) => void): () => void
}

/** Connect the native menu to existing session navigation and search actions.
 * @param bridge - Preload capability for publishing conversations and receiving native actions.
 * @param sessions - Workspace session list used to build recent conversations.
 * @param workspace - Existing navigation actions for opening or creating a conversation.
 * @param more - Existing action that opens conversation search.
 * @returns A disposer that removes the session and native-action subscriptions.
 */
export function connectDesktopTray(
  bridge: DesktopTrayBridge,
  sessions: ISessions['list'],
  workspace: Pick<UiWorkspace, 'openSession' | 'startSession'>,
  more: () => void,
): () => void {
  let lastPublished = ''
  const publish = (): void => {
    const state = sessions.getSnapshot()
    if (state.phase !== 'ready') return
    const conversations = state.ids.flatMap(sessionId => {
      const row = state.byId[sessionId]
      if (row === undefined || row.blank || row.origin === 'subagent') return []
      return [{ sessionId, title: row.title?.trim() || row.displayTitle }]
    }).slice(0, 7)
    const serialized = JSON.stringify(conversations)
    if (serialized === lastPublished) return
    lastPublished = serialized
    bridge.updateRecentConversations(conversations)
  }
  const stopList = sessions.subscribe(publish)
  const stopAction = bridge.onAction(action => {
    switch (action.kind) {
      case 'new':
        workspace.startSession()
        break
      case 'more':
        more()
        break
      case 'open-session':
        if (/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/iu.test(action.sessionId)) {
          workspace.openSession(brandString<SessionId>(action.sessionId))
        }
        break
      /* v8 ignore next -- closed tray-action union. */
      default:
        return assertNever(action)
    }
  })
  publish()
  return () => { stopList(); stopAction() }
}

function assertNever(value: never): never {
  throw new TypeError(`desktop tray: unsupported action ${String(value)}`)
}

declare global {
  interface Window {
    dshDesktop?: { readonly tray?: DesktopTrayBridge }
  }
}
