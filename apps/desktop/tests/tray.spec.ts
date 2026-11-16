import type { MenuItemConstructorOptions } from 'electron'
import { afterEach, expect, it, vi } from 'vitest'
import { resolveDesktopLocale } from '../src/locale.ts'
import { DesktopTray } from '../src/tray.ts'

const native = await vi.hoisted(async () => {
  const { EventEmitter } = await import('node:events')
  const trays: FakeTray[] = []
  class FakeTray extends EventEmitter {
    readonly setToolTip = vi.fn()
    readonly setContextMenu = vi.fn()
    readonly popUpContextMenu = vi.fn()
    readonly destroy = vi.fn()
    constructor(readonly image: unknown) { super(); trays.push(this) }
  }
  const menus: MenuItemConstructorOptions[][] = []
  return {
    trays, FakeTray, menus,
    createFromPath: vi.fn((path: string) => ({ path })),
    buildFromTemplate: vi.fn((template: MenuItemConstructorOptions[]) => { menus.push(template); return { template } }),
  }
})
vi.mock('electron', () => ({
  Tray: native.FakeTray,
  nativeImage: { createFromPath: native.createFromPath },
  Menu: { buildFromTemplate: native.buildFromTemplate },
}))

afterEach(() => { native.trays.length = 0; native.menus.length = 0; vi.clearAllMocks() })

function setup(locale = 'en') {
  let current = resolveDesktopLocale(locale)
  const open = vi.fn()
  const quit = vi.fn()
  const tray = new DesktopTray({ iconPath: 'C:/app/resources/tray.ico', locale: () => current, open, quit })
  return { tray, open, quit, native: native.trays[0]!, setLocale: (next: string) => { current = resolveDesktopLocale(next) } }
}

function labels(menu: MenuItemConstructorOptions[]): (string | undefined)[] {
  return menu.map(item => item.type === 'separator' ? 'separator' : item.label)
}

it('shows the application icon with its name as the tooltip and an Open / Quit menu', () => {
  const f = setup()
  expect(native.createFromPath).toHaveBeenCalledWith('C:/app/resources/tray.ico')
  expect(f.native.image).toEqual({ path: 'C:/app/resources/tray.ico' })
  expect(f.native.setToolTip).toHaveBeenCalledWith('DeepSeek Harness')
  expect(labels(native.menus[0]!)).toEqual(['Open DeepSeek Harness', 'separator', 'Quit DeepSeek Harness'])
  expect(f.native.setContextMenu).toHaveBeenCalledWith({ template: native.menus[0] })
})

it('opens the window on a single click and routes menu entries to the open and quit actions', () => {
  const f = setup()
  f.native.emit('click')
  expect(f.open).toHaveBeenCalledOnce()
  const menu = native.menus[0]!
  ;(menu[0] as { click: () => void }).click()
  ;(menu[2] as { click: () => void }).click()
  expect(f.open).toHaveBeenCalledTimes(2)
  expect(f.quit).toHaveBeenCalledOnce()
})

it('relabels the menu in the current locale and ignores relabel after disposal', () => {
  const f = setup()
  f.setLocale('zh')
  f.tray.relabel()
  expect(labels(native.menus[1]!)).toEqual(['打开 DeepSeek Harness', 'separator', '退出 DeepSeek Harness'])
  f.tray.dispose()
  f.tray.dispose()
  expect(f.native.destroy).toHaveBeenCalledOnce()
  f.tray.relabel()
  expect(native.menus).toHaveLength(2)
})

it('builds the Linux recent-conversation menu for native tray activation', () => {
  let conversations = [{ sessionId: 'session-1', title: 'Recent chat' }]
  const openConversation = vi.fn()
  const newChat = vi.fn()
  const moreConversations = vi.fn()
  const f = setup()
  const tray = new DesktopTray({ iconPath: '/app/tray.png', locale: () => resolveDesktopLocale('en'),
    open: f.open, quit: f.quit, showMenuOnClick: true,
    recentConversations: () => conversations,
    openConversation, newChat, moreConversations,
  })
  const nativeTray = native.trays.at(-1)!
  expect(labels(native.menus.at(-1)!)).toEqual([
    'Recent conversations', 'Recent chat', 'More conversations…', 'separator', 'New Chat', 'separator',
    'Open DeepSeek Harness', 'separator', 'Quit DeepSeek Harness',
  ])
  ;(native.menus.at(-1)![1] as { click: () => void }).click()
  ;(native.menus.at(-1)![2] as { click: () => void }).click()
  ;(native.menus.at(-1)![4] as { click: () => void }).click()
  expect(openConversation).toHaveBeenCalledExactlyOnceWith('session-1')
  expect(moreConversations).toHaveBeenCalledOnce()
  expect(newChat).toHaveBeenCalledOnce()
  nativeTray.emit('click')
  expect(nativeTray.popUpContextMenu).not.toHaveBeenCalled()
  expect(f.open).not.toHaveBeenCalled()
  conversations = []
  tray.relabel()
  expect(labels(native.menus.at(-1)!)).toContain('No recent conversations')
  tray.dispose()
})
