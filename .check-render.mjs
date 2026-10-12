// 临时校验：确认 markdown 渲染管线把 ```mermaid 输出成 mermaid 容器，其余代码块不受影响
import { readFileSync } from 'node:fs'
import { renderMarkdown, extractMeta } from './src/lib/markdown.js'

const file = 'src/assets/posts/staticworld-user-system.md'
const raw = readFileSync(file, 'utf8')
const { body } = extractMeta(raw, 'staticworld-user-system')
const html = renderMarkdown(body, { resolveImage: (ref) => ref })

const count = (re) => (html.match(re) || []).length
console.log('mermaid-block containers :', count(/class="mermaid-block"/g))
console.log('mermaid inner divs       :', count(/class="mermaid"/g))
console.log('leftover ``` fences      :', count(/```/g))
console.log('hljs code blocks         :', count(/class="hljs"/g))
console.log('tables                   :', count(/<table>/g))
console.log('images                   :', count(/<img /g))

// 容器里必须是「已转义的源码」，这样浏览器 textContent 还原后才等于原始定义
const m = /<div class="mermaid">([\s\S]*?)<\/div>/.exec(html)
if (!m) {
  console.log('RESULT: no mermaid container found -> FAIL')
  process.exitCode = 1
} else {
  const inner = m[1]
  console.log('escaped <br/> present   :', inner.includes('&lt;br/&gt;'))
  console.log('unescaped <br/> present :', inner.includes('<br/>'))
  console.log('first line              :', JSON.stringify(inner.split('\n')[0]))
  console.log('starts with flowchart   :', inner.trimStart().startsWith('flowchart TB'))
}
