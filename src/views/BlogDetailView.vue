<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import ThemeBackground from '../components/ThemeBackground.vue'
import PageBar from '../components/PageBar.vue'
import { posts } from '../lib/posts'
import { useTheme } from '../composables/useTheme'

// 主题生命周期跟随详情页：进入挂载（写 data-* + 走时），离开清除
const { mount, unmount } = useTheme()
onMounted(mount)
onUnmounted(unmount)

const route = useRoute()
const post = computed(() => posts.find((p) => p.id === route.params.id))

// 目录：从渲染后的正文提取 h1–h3（仅最高三层），并读取标题锚点 id
const headings = computed(() => {
  if (!post.value) return []
  const doc = new DOMParser().parseFromString(post.value.html, 'text/html')
  return Array.from(doc.querySelectorAll('h1, h2, h3')).map((h) => ({
    id: h.id,
    level: Number(h.tagName[1]),
    text: h.textContent.trim(),
  }))
})

// 目录开关（窄屏悬浮按钮控制）、回到顶部可见性、当前激活标题
const tocOpen = ref(false)
const showTop = ref(false)
const activeId = ref('')

function onScroll() {
  showTop.value = window.scrollY > 320

  const hs = headings.value
  if (!hs.length) {
    activeId.value = ''
    return
  }
  let current = hs[0].id
  for (const h of hs) {
    const el = document.getElementById(h.id)
    if (!el) continue
    if (el.getBoundingClientRect().top <= 110) current = h.id
    else break
  }
  activeId.value = current
}

function scrollToHeading(id) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - 80
  window.scrollTo({ top, behavior: 'smooth' })
  tocOpen.value = false
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="page">
    <ThemeBackground />

    <PageBar back-to="/posts" back-text="返回列表" />

    <main class="container article">
      <template v-if="post">
        <h1 class="title">{{ post.title }}</h1>
        <div class="meta">
          <span v-if="post.date" class="meta-item">
            <svg class="meta-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 2v4M16 2v4M3 8h18" />
              <rect x="4" y="4" width="16" height="17" rx="2" />
            </svg>
            <time class="date">{{ post.date }}</time>
          </span>
          <span v-if="post.tags.length" class="meta-item">
            <svg class="meta-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.59 13.41 12 22l-9-9V4h9l8.59 8.59z" />
              <circle cx="8.5" cy="8.5" r="1.5" />
            </svg>
            <span v-for="t in post.tags" :key="t" class="tag">{{ t }}</span>
          </span>
        </div>
        <article class="markdown-body" v-html="post.html"></article>
      </template>

      <div v-else class="empty">
        <p>未找到该博文。</p>
        <RouterLink class="btn" to="/posts">
          <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          返回列表
        </RouterLink>
      </div>
    </main>

    <!-- 悬浮目录：宽屏常驻，窄屏通过悬浮按钮滑出 -->
    <aside
      v-if="post && headings.length"
      class="toc"
      :class="{ open: tocOpen }"
      aria-label="文章目录"
    >
      <div class="toc-head">
        <svg class="toc-head-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h12" />
        </svg>
        <span>目录</span>
      </div>
      <ul class="toc-list">
        <li
          v-for="h in headings"
          :key="h.id"
          :class="['level-' + h.level, { active: activeId === h.id }]"
        >
          <button type="button" class="toc-link" @click="scrollToHeading(h.id)">
            {{ h.text }}
          </button>
        </li>
      </ul>
    </aside>

    <button
      v-if="post && headings.length"
      type="button"
      class="toc-fab"
      :class="{ hidden: tocOpen }"
      aria-label="打开目录"
      @click="tocOpen = !tocOpen"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 6h18M3 12h18M3 18h12" />
      </svg>
    </button>

    <button
      type="button"
      class="to-top"
      :class="{ visible: showTop }"
      aria-label="回到顶部"
      @click="scrollToTop"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.article {
  flex: 1;
  padding: 28px 20px 140px;
}

.title {
  margin: 0 0 12px;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.3;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.date {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.meta-icon {
  width: 15px;
  height: 15px;
  flex: none;
  fill: none;
  stroke: var(--text-muted);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.btn-icon {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.tag {
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.75rem;
}

.empty {
  padding: 60px 0;
  text-align: center;
  color: var(--text-muted);
}

.empty .btn {
  margin-top: 16px;
}

/* ===== 悬浮目录 ===== */
.toc {
  position: fixed;
  top: 50%;
  right: 20px;
  z-index: 30;
  width: 236px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  transform: translateY(-50%);
  padding: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow),
    inset 0 1px 0 color-mix(in srgb, var(--season-secondary) 26%, transparent);
  backdrop-filter: blur(var(--card-blur));
  -webkit-backdrop-filter: blur(var(--card-blur));
}

.toc-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.toc-head-icon {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: var(--accent);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.toc-link {
  display: block;
  width: 100%;
  padding: 6px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: 0.85rem;
  line-height: 1.5;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}

.toc-link:hover {
  background: color-mix(in srgb, var(--season-primary) 8%, transparent);
  color: var(--text);
}

.toc li.level-2 .toc-link {
  padding-left: 22px;
}

.toc li.level-3 .toc-link {
  padding-left: 34px;
}

.toc li.active .toc-link {
  color: var(--season-primary);
  background: color-mix(in srgb, var(--season-primary) 12%, transparent);
  font-weight: 600;
}

/* 窄屏：目录默认滑出屏幕，靠悬浮按钮唤出 */
.toc-fab {
  position: fixed;
  right: 20px;
  bottom: 96px;
  z-index: 30;
  display: none;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  box-shadow: var(--shadow);
  backdrop-filter: blur(var(--card-blur));
  -webkit-backdrop-filter: blur(var(--card-blur));
  transition: opacity 0.2s, transform 0.2s;
}

.toc-fab.hidden {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.8);
}

.toc-fab svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@media (max-width: 1279px) {
  .toc {
    transform: translateY(-50%) translateX(calc(100% + 40px));
    transition: transform 0.25s ease;
  }

  .toc.open {
    transform: translateY(-50%) translateX(0);
  }

  .toc-fab {
    display: flex;
  }
}

/* ===== 回到顶部 ===== */
.to-top {
  position: fixed;
  right: 20px;
  bottom: 28px;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(
    135deg,
    var(--season-primary),
    var(--season-secondary)
  );
  box-shadow: 0 6px 18px color-mix(in srgb, var(--season-primary) 45%, transparent);
  opacity: 0;
  pointer-events: none;
  transform: translateY(12px);
  transition: opacity 0.25s, transform 0.25s, box-shadow 0.2s;
}

.to-top.visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.to-top:hover {
  box-shadow: 0 10px 24px
    color-mix(in srgb, var(--season-primary) 60%, transparent);
}

.to-top svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
