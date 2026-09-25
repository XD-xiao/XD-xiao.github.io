// 依据 config.js 中的 theme.colors 生成主题色 CSS 并注入 <head>。
// 通过 <html> 上的 data-season / data-mode / data-period 属性驱动换肤，
// 选择器结构与原样式保持一致，保证换季/换时段过渡与级联行为不变。
import { siteConfig } from '../config'

const SEASONS = ['spring', 'summer', 'autumn', 'winter']
const PERIODS = ['dawn', 'day', 'dusk', 'night', 'late']

function toDeclaration(obj) {
  return Object.entries(obj)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ')
}

function toRule(selector, obj) {
  return `${selector} { ${toDeclaration(obj)} }\n`
}

export function buildThemeColorsCss() {
  const c = siteConfig.theme.colors
  let css = ''

  // 基础（默认四季为春季，与 <html> 无属性时的兜底一致）
  css += toRule(':root', { ...c.base, ...c.seasons.spring })
  css += toRule("html[data-mode='light']", c.light)
  for (const season of SEASONS) {
    css += toRule(`html[data-season='${season}']`, c.seasons[season])
  }
  css += toRule("html[data-mode='dark']", c.dark)
  for (const season of SEASONS) {
    css += toRule(
      `html[data-mode='dark'][data-season='${season}']`,
      c.darkSeasons[season]
    )
  }
  for (const period of PERIODS) {
    css += toRule(`html[data-period='${period}']`, c.periods[period])
  }

  return css
}

export function injectThemeColors() {
  let style = document.getElementById('theme-colors')
  if (!style) {
    style = document.createElement('style')
    style.id = 'theme-colors'
    document.head.appendChild(style)
  }
  style.textContent = buildThemeColorsCss()
}
