// 临时校验脚本：抽取文章里的 ```mermaid 代码块并交给 mermaid 解析（仅校验语法，不渲染）
// 校验完即可删除。
import { readFileSync } from 'node:fs'

// mermaid 的 parse 在 Node 下需要最小的 DOM 垫片
if (typeof globalThis.window === 'undefined') {
  globalThis.window = globalThis
  globalThis.addEventListener = () => {}
  globalThis.removeEventListener = () => {}
  globalThis.document = {
    readyState: 'complete',
    documentElement: { style: {}, setAttribute() {}, getAttribute() { return null } },
    body: { appendChild() {}, removeChild() {} },
    createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, remove() {} }),
    createElementNS: () => ({ style: {}, setAttribute() {}, appendChild() {}, remove() {} }),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
  }
}

const file = process.argv[2]
const text = readFileSync(file, 'utf8')
const blocks = [...text.matchAll(/```mermaid\r?\n([\s\S]*?)```/g)].map((m) => m[1])

console.log('mermaid blocks found:', blocks.length)

const mermaid = (await import('mermaid')).default

// 必须先 initialize：mermaid v11+ 的图类型是按需注册的，未初始化时 detectType 认不出 flowchart。
// 用 loose 跳过 DOMPurify（Node 下没有真实 DOM）；这里只校验语法，与 sanitize 行为无关。
mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'base' })

for (const [i, code] of blocks.entries()) {
  const label = `block ${i + 1} (${code.split('\n')[0].trim()})`
  let type = '?'
  try {
    type = await mermaid.detectType(code)
  } catch (error) {
    console.log(`${label}: detectType failed -> ${error?.message?.split('\n')[0]}`)
  }
  try {
    await mermaid.parse(code)
    console.log(`${label}: parse OK  type=${type}`)
  } catch (error) {
    console.log(`${label}: parse FAIL -> ${error?.message?.split('\n')[0]}`)
    process.exitCode = 1
  }
}
