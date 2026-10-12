// Mermaid 图渲染：把正文里的 ```mermaid 代码块画成图。
//
// 两个刻意的设计：
//   1. 动态 import：mermaid 体积不小，只有含图的文章才会加载它，不影响首页/列表页。
//   2. 跟随主题：图的配色从当前生效的 CSS 变量里读，所以明暗与四季换肤后重绘一次即可同步。
//
// 渲染失败时不会破坏文章：容器保留原始源码，配合 style.css 里的
// `.mermaid:not([data-processed])` 回退成代码块样式。

let mermaidPromise = null

// 已按哪个主题初始化过；主题没变就不重复 initialize
let initializedTheme = ''

// 渲染前保存源码（WeakMap 不进 DOM，避免把定义重复写一遍）
const sources = new WeakMap()

function readVar(name, fallback) {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

// 从站点主题变量推导 mermaid 主题，避免图与页面配色脱节
function themeVariables(dark) {
  const surface = readVar('--surface', dark ? '#161c26' : '#ffffff')
  const surface2 = readVar('--surface-2', dark ? '#1c2430' : '#f6f8fa')
  const text = readVar('--text', dark ? '#e8eff6' : '#1f2328')
  const muted = readVar('--text-muted', dark ? '#9fb0c0' : '#59636e')
  const border = readVar('--border', dark ? 'rgba(255,255,255,0.14)' : '#d1d9e0')
  const primary = readVar('--season-primary', '#0969da')

  return {
    background: 'transparent',
    fontFamily: readVar('--font', 'sans-serif'),
    fontSize: '14px',
    primaryColor: surface2,
    primaryTextColor: text,
    primaryBorderColor: primary,
    secondaryColor: surface,
    secondaryTextColor: text,
    secondaryBorderColor: border,
    tertiaryColor: surface2,
    tertiaryTextColor: text,
    tertiaryBorderColor: border,
    mainBkg: surface2,
    nodeBorder: primary,
    nodeTextColor: text,
    lineColor: muted,
    textColor: text,
    titleColor: text,
    edgeLabelBackground: readVar('--bg', dark ? '#0e1520' : '#f6f8fa'),
    clusterBkg: surface,
    clusterBorder: border,
    // 时序图
    actorBkg: surface2,
    actorBorder: primary,
    actorTextColor: text,
    actorLineColor: muted,
    signalColor: text,
    signalTextColor: text,
    labelBoxBkgColor: surface,
    labelBoxBorderColor: primary,
    labelTextColor: text,
    noteBkgColor: surface,
    noteBorderColor: border,
    noteTextColor: text,
  }
}

function loadMermaid() {
  mermaidPromise ??= import('mermaid').then((mod) => mod.default)
  return mermaidPromise
}

async function ensureInitialized(themeKey) {
  const mermaid = await loadMermaid()
  if (initializedTheme === themeKey) return mermaid

  const dark = themeKey.startsWith('dark')
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    themeVariables: themeVariables(dark),
    flowchart: { curve: 'basis', htmlLabels: true, useMaxWidth: true },
    sequence: { useMaxWidth: true },
  })
  initializedTheme = themeKey

  return mermaid
}

/**
 * 渲染 root 内所有还没画过的 mermaid 图。
 * @param {HTMLElement | null} root 文章正文容器
 * @param {string} themeKey 主题指纹（如 dark-autumn），用于判断是否需要重新初始化
 * @returns {Promise<boolean>} 是否执行了渲染
 */
export async function renderMermaid(root, themeKey = '') {
  if (!root) return false

  const nodes = Array.from(root.querySelectorAll('.mermaid'))
  if (!nodes.length) return false

  for (const node of nodes) {
    if (!sources.has(node)) sources.set(node, node.textContent)
  }

  const pending = nodes.filter((node) => !node.hasAttribute('data-processed'))
  if (!pending.length) return false

  try {
    const mermaid = await ensureInitialized(themeKey)
    await mermaid.run({ nodes: pending })
  } catch (error) {
    // 语法错误或加载失败：保留源码，交给 CSS 回退成代码块
    console.error('[mermaid] 渲染失败，已回退为源码显示：', error)
  }

  return true
}

/**
 * 主题（明暗 / 季节）变化后重绘：清掉上一次的产物与 processed 标记，再画一次。
 * @param {HTMLElement | null} root 文章正文容器
 * @param {string} themeKey 新的主题指纹
 */
export async function rerenderMermaid(root, themeKey = '') {
  if (!root) return

  const nodes = Array.from(root.querySelectorAll('.mermaid'))
  if (!nodes.length) return

  for (const node of nodes) {
    // 没渲染过的节点源码本来就在 DOM 里，不要用 WeakMap 里的空值把它清掉
    if (!sources.has(node)) continue
    node.removeAttribute('data-processed')
    node.textContent = sources.get(node)
  }

  initializedTheme = ''
  await renderMermaid(root, themeKey)
}
