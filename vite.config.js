import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import vitePluginPosts from './vite-plugin-posts.js'

/**
 * 推导部署用的 base 路径，使同一份代码在三种场景下都能正确加载资源：
 *
 *  1. 本地开发 / 本地 preview        -> '/'
 *  2. GitHub Pages 用户站点          -> '/'
 *     (仓库名形如 <用户名>.github.io，站点位于域名根目录)
 *  3. GitHub Pages 项目站点          -> '/<仓库名>/'
 *     (仓库名任意，站点位于 https://<用户名>.github.io/<仓库名>/)
 *
 * GitHub Actions 会自动注入 GITHUB_REPOSITORY="<owner>/<repo>"，
 * 因此无需手工改代码即可适配上面两种线上形态。
 *
 * 优先级：CLI 显式指定 (--base, Vite 自行处理) > VITE_BASE > GITHUB_REPOSITORY 推导 > '/'
 */
function resolveBase() {
  if (process.env.VITE_BASE) return process.env.VITE_BASE

  const slug = process.env.GITHUB_REPOSITORY // 例如 "XD-xiao/XD-xiao.github.io"
  if (!slug) return '/'

  const repo = slug.split('/')[1]
  // 用户站点：仓库名等于 "<owner>.github.io"，站点在根目录
  if (repo && repo.toLowerCase().endsWith('.github.io')) return '/'

  // 项目站点：站点挂在 /<repo>/ 子路径下
  return repo ? `/${repo}/` : '/'
}

// https://vite.dev/config/
export default defineConfig({
  base: resolveBase(),
  plugins: [vue(), vueDevTools(), vitePluginPosts()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
