import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import sql from 'highlight.js/lib/languages/sql'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('java', java)
hljs.registerLanguage('c', c)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('go', go)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: false,
})

// 代码块高亮：用自定义 fence 渲染器，兼容 markdown-it 各版本
const defaultFence =
  md.renderer.rules.fence ||
  ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options))

md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const code = token.content
  const lang = (token.info || '').trim().split(/\s+/)[0]

  if (lang && hljs.getLanguage(lang)) {
    try {
      const highlighted = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
      return `<pre class="hljs"><code class="language-${md.utils.escapeHtml(lang)}">${highlighted}</code></pre>`
    } catch {
      // 忽略高亮失败，回退到纯文本
    }
  }

  return `<pre class="hljs"><code>${md.utils.escapeHtml(code)}</code></pre>`
}

// 外链在新标签页打开
const defaultLinkOpen =
  md.renderer.rules.link_open ||
  ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options))

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = tokens[idx].attrGet('href') || ''
  if (/^https?:\/\//.test(href)) {
    tokens[idx].attrSet('target', '_blank')
    tokens[idx].attrSet('rel', 'noopener noreferrer')
  }
  return defaultLinkOpen(tokens, idx, options, env, self)
}

// 图片：将相对路径解析为构建后的资源 URL（支持相对引用与 @/ 别名的图片、动图）
const defaultImage =
  md.renderer.rules.image ||
  ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options))

md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const src = token.attrGet('src') || ''
  if (src && !/^(?:https?:|data:|#|\/)/.test(src) && typeof env.resolveImage === 'function') {
    token.attrSet('src', env.resolveImage(src))
  }
  return defaultImage(tokens, idx, options, env, self)
}

// 标题锚点：为正文 h1–h6 生成稳定 id，供详情页目录跳转
function stripInlineMarkdown(text) {
  return text
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/\*\*|__|~~|\*|_/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(text) {
  const t = stripInlineMarkdown(text).toLowerCase()
  return t.replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '') || 'section'
}

// 每次渲染重置，避免同一篇文章内重复标题的 id 冲突
let headingCounts = new Map()
function uniqueSlug(base) {
  const count = headingCounts.get(base) || 0
  headingCounts.set(base, count + 1)
  return count === 0 ? base : `${base}-${count}`
}

const defaultHeadingOpen =
  md.renderer.rules.heading_open ||
  ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options))

md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
  const inline = tokens[idx + 1]
  const raw = inline && inline.type === 'inline' ? inline.content : ''
  tokens[idx].attrSet('id', uniqueSlug(slugify(raw)))
  return defaultHeadingOpen(tokens, idx, options, env, self)
}

export function renderMarkdown(content, env = {}) {
  headingCounts = new Map()
  return md.render(content, env)
}

// 解析 YAML 风格的 frontmatter（仅支持简单的 key: value）
export function parseFrontmatter(content) {
  const match = /^---\s*\n([\s\S]*?)\n---\s*\n?/.exec(content)
  if (!match) return { data: {}, body: content }

  const data = {}
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }
    if (key) data[key] = value
  }

  return { data, body: content.slice(match[0].length) }
}

// 从 Markdown 内容提取标题、日期、简介、标签等元信息
export function extractMeta(content, fallbackSlug = '') {
  const { data, body } = parseFrontmatter(content)
  let title = data.title
  let description = data.description || ''

  if (!title) {
    const heading = /^#\s+(.+)$/m.exec(body)
    title = heading ? heading[1].trim() : fallbackSlug
  }
  if (!description) {
    const firstText = body
      .replace(/```[\s\S]*?```/g, '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/[#>*_`~-]/g, '')
      .split('\n')
      .map((l) => l.trim())
      .find(Boolean)
    description = firstText ? firstText.slice(0, 120) : ''
  }

  const tags = Array.isArray(data.tags) ? data.tags : []
  // 是否置顶：通过 tags 中的「置顶」标签判断
  const pinned = tags.includes('置顶')

  return {
    title,
    date: data.date || '',
    description,
    tags,
    pinned,
    body,
  }
}
