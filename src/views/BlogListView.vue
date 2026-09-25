<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ThemeBackground from '../components/ThemeBackground.vue'
import PageBar from '../components/PageBar.vue'
import PostCard from '../components/PostCard.vue'
import { posts } from '../lib/posts'
import { useTheme } from '../composables/useTheme'

// 主题生命周期跟随列表页：进入挂载（写 data-* + 走时），离开清除
const { mount, unmount } = useTheme()
onMounted(mount)
onUnmounted(unmount)

const router = useRouter()
const query = ref('')
const sort = ref('date-desc')

const sortOptions = [
  { value: 'date-desc', label: '最新' },
  { value: 'date-asc', label: '最早' },
  { value: 'title', label: '标题' },
]

const searched = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return posts
  return posts.filter((p) => p.searchText.includes(q))
})

const filtered = computed(() => {
  const arr = [...searched.value]
  if (sort.value === 'date-asc') {
    return arr.sort(
      (a, b) => (a.date || '').localeCompare(b.date || '') || a.mtime - b.mtime
    )
  }
  if (sort.value === 'title') {
    return arr.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'))
  }
  return arr
})

function open(post) {
  router.push({ name: 'post-detail', params: { id: post.id } })
}

function reset() {
  query.value = ''
  sort.value = 'date-desc'
}
</script>

<template>
  <div class="page">
    <ThemeBackground />

    <PageBar back-to="/" back-text="首页" icon="home">
      <h1 class="bar-title">博文列表</h1>
    </PageBar>

    <main class="container content">
      <div class="toolbar">
        <label class="search">
          <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
          <input
            v-model="query"
            type="search"
            placeholder="搜索标题、简介或标签…"
            aria-label="搜索博文"
          />
          <button
            v-if="query"
            type="button"
            class="clear"
            aria-label="清空搜索"
            @click="query = ''"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </label>

        <div class="sort" role="group" aria-label="排序方式">
          <button
            v-for="opt in sortOptions"
            :key="opt.value"
            type="button"
            class="sort-btn"
            :class="{ active: sort === opt.value }"
            :aria-pressed="sort === opt.value"
            @click="sort = opt.value"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path v-if="opt.value === 'date-desc'" d="M12 5v14M5 12l7 7 7-7" />
              <path v-else-if="opt.value === 'date-asc'" d="M12 19V5M5 12l7-7 7 7" />
              <path v-else d="M3 6h18M3 12h12M3 18h6" />
            </svg>
            <span>{{ opt.label }}</span>
          </button>
        </div>
      </div>

      <p class="count">
        <svg class="count-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 4h13l3 3v13H4z" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
        共 {{ filtered.length }} 篇
      </p>

      <div v-if="filtered.length" class="grid">
        <PostCard
          v-for="p in filtered"
          :key="p.id"
          :post="p"
          @open="open"
        />
      </div>

      <div v-else class="empty">
        <svg class="empty-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" />
          <line x1="9" y1="11" x2="13" y2="11" />
        </svg>
        <p>没有匹配的博文。</p>
        <button type="button" class="reset" @click="reset">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 2.6-6.3L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          重置筛选
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: 28px 20px 56px;
}

/* 列表页标题：渐变文字 + 季节色短线点缀，呼应首页标题样式 */
.bar-title {
  background: linear-gradient(
    90deg,
    var(--season-primary),
    var(--season-secondary)
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

/* 搜索框：玻璃胶囊 + 放大镜图标 */
.search {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 220px;
  padding: 10px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  box-shadow: var(--shadow-sm),
    inset 0 1px 0 color-mix(in srgb, var(--season-secondary) 26%, transparent);
  backdrop-filter: blur(var(--card-blur));
  -webkit-backdrop-filter: blur(var(--card-blur));
  transition: border-color 0.15s, box-shadow 0.15s;
}

.search:focus-within {
  border-color: var(--accent);
  box-shadow: var(--shadow-sm),
    0 0 0 3px color-mix(in srgb, var(--season-primary) 18%, transparent);
}

.search-icon {
  flex: none;
  width: 18px;
  height: 18px;
  fill: none;
  stroke: var(--text-muted);
  stroke-width: 2;
  stroke-linecap: round;
}

.search input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 0.95rem;
  outline: none;
}

.search input::placeholder {
  color: var(--text-muted);
}

.search input::-webkit-search-cancel-button {
  display: none;
}

.clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: color-mix(in srgb, var(--text-muted) 16%, transparent);
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.clear:hover {
  background: color-mix(in srgb, var(--text-muted) 28%, transparent);
  color: var(--text);
}

.clear svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

/* 排序：分段玻璃胶囊，图标化按钮 */
.sort {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  box-shadow: var(--shadow-sm),
    inset 0 1px 0 color-mix(in srgb, var(--season-secondary) 26%, transparent);
  backdrop-filter: blur(var(--card-blur));
  -webkit-backdrop-filter: blur(var(--card-blur));
}

.sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
}

.sort-btn svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sort-btn:hover {
  color: var(--text);
  background: color-mix(in srgb, var(--season-primary) 8%, transparent);
}

.sort-btn.active {
  color: #fff;
  background: linear-gradient(
    90deg,
    var(--season-primary),
    var(--season-secondary)
  );
  box-shadow: 0 3px 10px
    color-mix(in srgb, var(--season-primary) 45%, transparent);
}

.count {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 14px 0 16px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.count-icon {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 56px 0;
  color: var(--text-muted);
  text-align: center;
}

.empty-icon {
  width: 44px;
  height: 44px;
  fill: none;
  stroke: var(--text-muted);
  stroke-width: 1.6;
  stroke-linecap: round;
  opacity: 0.6;
}

.empty p {
  margin: 0;
}

.reset {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 22px;
  border: none;
  border-radius: 999px;
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(
    90deg,
    var(--season-primary),
    var(--season-secondary)
  );
  background-size: 150% 100%;
  transition: background-position 0.3s ease, transform 0.15s ease,
    box-shadow 0.15s ease;
}

.reset:hover {
  background-position: 100% 0;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px color-mix(in srgb, var(--season-primary) 70%, transparent);
}

.reset svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
