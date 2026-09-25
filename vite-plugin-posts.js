import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { watch } from 'chokidar'

const MODULE_ID = 'virtual:posts'
const RESOLVED_ID = '\0' + MODULE_ID

// 博文 Markdown 源文件的专属文件夹（位于项目根目录下的 posts/）
const postsDir = fileURLToPath(new URL('./posts', import.meta.url))

function walk(dir) {
  const result = []
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return result
  }
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      result.push(...walk(path))
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      result.push(path)
    }
  }
  return result
}

function loadPosts() {
  return walk(postsDir)
    .map((file) => ({
      file: relative(postsDir, file).split(sep).join('/'),
      slug: relative(postsDir, file).split(sep).join('/').replace(/\.md$/i, ''),
      content: readFileSync(file, 'utf8'),
      mtime: statSync(file).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime)
}

export default function vitePluginPosts() {
  let posts = loadPosts()

  return {
    name: 'vite-plugin-posts',
    resolveId(id) {
      if (id === MODULE_ID) return RESOLVED_ID
      return null
    },
    load(id) {
      if (id === RESOLVED_ID) {
        return `export default ${JSON.stringify(posts)}\n`
      }
      return null
    },
    configureServer(server) {
      // 监听 posts/ 文件夹：新增、删除、修改都会触发浏览器刷新
      const watcher = watch(postsDir, { ignoreInitial: true })

      const refresh = () => {
        posts = loadPosts()
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
          server.ws.send({ type: 'full-reload' })
        }
      }

      watcher.on('add', refresh)
      watcher.on('change', refresh)
      watcher.on('unlink', refresh)

      server.httpServer?.once('close', () => {
        watcher.close()
      })
    },
  }
}
