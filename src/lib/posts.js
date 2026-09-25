import rawPosts from 'virtual:posts'
import { extractMeta, renderMarkdown } from './markdown'

// 收集 posts/ 目录下的图片资源，建立「相对路径 -> 构建后 URL」的映射
// 支持 png / jpg / jpeg / gif（动图）/ webp / svg 等常见格式
const imageModules = import.meta.glob(
  '/posts/**/*.{png,jpg,jpeg,gif,webp,svg,bmp,ico,avif}',
  { eager: true, as: 'url' }
)

function dirOf(file) {
  const idx = file.lastIndexOf('/')
  return idx === -1 ? '' : file.slice(0, idx)
}

function resolveImage(dir, ref) {
  const stack = dir ? dir.split('/') : []
  for (const seg of ref.split('/')) {
    if (seg === '' || seg === '.') continue
    if (seg === '..') stack.pop()
    else stack.push(seg)
  }
  const key = '/posts/' + stack.join('/')
  return imageModules[key] || ref
}

export const posts = rawPosts
  .map((p) => {
    const meta = extractMeta(p.content, p.slug)
    const dir = dirOf(p.file)
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
      html: renderMarkdown(meta.body, { resolveImage: (ref) => resolveImage(dir, ref) }),
    }
  })
  .sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date)
    if (a.date) return -1
    if (b.date) return 1
    return b.mtime - a.mtime
  })
