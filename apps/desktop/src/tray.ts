/** Native tray menu for reopening the Desktop window and navigating recent conversations. */

import { Menu, nativeImage, Tray } from 'electron'
import type { DesktopLocale } from './locale.ts'
import type { DesktopRecentConversation } from './ipc.ts'

/** Main-process actions exposed to the native tray menu. */
export interface DesktopTrayOptions {
  /** Platform icon asset packaged with the application. */
  readonly iconPath: string
  readonly locale: () => DesktopLocale
  /** Show and focus the primary window. */
  readonly open: () => void
  /** Request quit through the shared confirmation flow. */
  readonly quit: () => void
  /** Whether a primary click should open the context menu instead of the window. */
  readonly showMenuOnClick?: boolean
  /** Current recent conversation entries, newest first. */
  readonly recentConversations?: () => readonly DesktopRecentConversation[]
  /** Open the selected conversation in the Workspace. */
  readonly openConversation?: (sessionId: string) => void
  /** Start a new conversation. */
  readonly newChat?: () => void
  /** Open the full conversation list. */
  readonly moreConversations?: () => void
  /** Whether the Workspace renderer has published its session catalog. */
  readonly workspaceReady?: () => boolean
}

/** Tray icon present for the whole run, not only while the window is hidden. */
export class DesktopTray {
  private tray: Tray | undefined

  /** @param options - Icon path, locale reader, and native menu actions. */
  constructor(private readonly options: DesktopTrayOptions) {
    const tray = new Tray(nativeImage.createFromPath(options.iconPath))
    this.tray = tray
    // Linux shells show the assigned native menu when the tray item is activated.
    // Electron's popUpContextMenu() is only supported on macOS and Windows.
    if (options.showMenuOnClick !== true) tray.on('click', () => { options.open() })
    this.relabel()
  }

  /** Rebuild the tooltip and context menu in the current locale. */
  relabel(): void {
    const tray = this.tray
    if (tray === undefined) return
    const { messages } = this.options.locale()
    tray.setToolTip(messages.aboutProduct)
    const recentConversations = this.options.recentConversations?.() ?? []
    const workspaceReady = this.options.workspaceReady?.() ?? true
    const linuxMenu: Electron.MenuItemConstructorOptions[] = [
      { label: messages.recentConversations, enabled: false },
      ...(recentConversations.length === 0
        ? [{ label: messages.noRecentConversations, enabled: false }]
        : recentConversations.map(conversation => ({
          label: conversation.title,
          click: () => { this.options.openConversation?.(conversation.sessionId) },
        }))),
      { label: messages.moreConversations, enabled: workspaceReady, click: () => { this.options.moreConversations?.() } },
      { type: 'separator' },
      { label: messages.newChat, enabled: workspaceReady, click: () => { this.options.newChat?.() } },
      { type: 'separator' },
      { label: messages.openApplication, click: () => { this.options.open() } },
      { type: 'separator' },
      { label: messages.quitApplication, click: () => { this.options.quit() } },
    ]
    const windowsMenu: Electron.MenuItemConstructorOptions[] = [
      { label: messages.openApplication, click: () => { this.options.open() } },
      { type: 'separator' },
      { label: messages.quitApplication, click: () => { this.options.quit() } },
    ]
    tray.setContextMenu(Menu.buildFromTemplate(this.options.showMenuOnClick === true ? linuxMenu : windowsMenu))
  }

  /** Remove the icon after quit is confirmed so no dead icon outlives the process. */
  dispose(): void {
    const tray = this.tray
    this.tray = undefined
    tray?.destroy()
  }
}
