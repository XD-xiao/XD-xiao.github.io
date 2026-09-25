import rawPosts from 'virtual:posts'
import { extractMeta, renderMarkdown } from './markdown'

// 收集 src/assets/img/ 目录下的博客配图，建立「引用路径 -> 构建后 URL」的映射
// 支持 png / jpg / jpeg / gif（动图）/ webp / svg 等常见格式
const imageModules = import.meta.glob(
  '/src/assets/img/**/*.{png,jpg,jpeg,gif,webp,svg,bmp,ico,avif}',
  { eager: true, as: 'url' }
)

// 把 @/ 别名或绝对路径统一成 import.meta.glob 的 key（/src/... 绝对路径）
function toAbsoluteKey(ref) {
  if (ref.startsWith('@/')) return `/src/${ref.slice(2)}`
  if (ref.startsWith('/')) return ref
  return ref
}

// 将相对于 Markdown 文件目录的路径解析为 /src/... 绝对路径
function resolveRelative(baseDir, ref) {
  const parts = baseDir.split('/').filter(Boolean)
  for (const seg of ref.split('/')) {
    if (seg === '' || seg === '.') continue
    if (seg === '..') parts.pop()
    else parts.push(seg)
  }
  return `/${parts.join('/')}`
}

// 为每篇文章生成专属的图片解析函数：相对引用基于该文章所在目录解析
function createResolveImage(baseDir) {
  return (ref) => {
    if (!ref) return ref
    const key =
      ref.startsWith('/') || ref.startsWith('@/')
        ? toAbsoluteKey(ref)
        : resolveRelative(baseDir, ref)
    return imageModules[key] || ref
  }
}

export const posts = rawPosts
  .map((p) => {
    const meta = extractMeta(p.content, p.slug)
    // 文章所在目录（/src/assets/posts/<子目录>/），用于解析相对图片引用
    const dir = p.file.includes('/') ? p.file.slice(0, p.file.lastIndexOf('/') + 1) : ''
    const baseDir = `/src/assets/posts/${dir}`
    return {
      id: p.slug,
      file: p.file,
      mtime: p.mtime,
      title: meta.title,
      date: meta.date,
      description: meta.description,
      tags: meta.tags,
      pinned: meta.pinned,
      searchText: `${meta.title} ${meta.description} ${meta.tags.join(' ')} ${meta.body}`.toLowerCase(),
      html: renderMarkdown(meta.body, { resolveImage: createResolveImage(baseDir) }),
    }
  })
  .sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date)
    if (a.date) return -1
    if (b.date) return 1
    return b.mtime - a.mtime
  })
