<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { siteConfig } from '../config'

const loading = ref(true)
const error = ref('')
const contributions = ref([])
const total = ref(0)
const selected = ref(null) // 选中日期（dateStr）
const dayRefs = reactive({})

function localDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(
      siteConfig.heatmapUrl.replace('{username}', siteConfig.githubUsername)
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()

    // 只保留最近一年（365 天），并按日期升序（旧→新，左→右）显式排序
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 364)
    const cutoffStr = localDateStr(cutoff)
    const todayStr = localDateStr(new Date())
    const list = (data.contributions || [])
      .filter((c) => c.date >= cutoffStr && c.date <= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))

    contributions.value = list
    total.value = list.reduce((sum, c) => sum + c.count, 0)
  } catch (e) {
    error.value = '贡献数据加载失败：' + e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)

// 按周分列；用首个日期对应的星期做对齐，保证网格形状接近 GitHub 热力图
const weeks = computed(() => {
  const arr = contributions.value
  if (!arr.length) return []

  const offset = new Date(arr[0].date + 'T00:00:00').getDay() // 0=周日
  const padded = [...new Array(offset).fill(null), ...arr]

  const result = []
  for (let i = 0; i < padded.length; i += 7) {
    const week = padded.slice(i, i + 7)
    while (week.length < 7) week.push(null)
    result.push(week)
  }
  return result
})

function titleFor(day) {
  return day ? `${day.date} · ${day.count} 次提交` : ''
}

function toggleSelect(day) {
  selected.value = selected.value === day.date ? null : day.date
}

function onKey(e, wi, di) {
  let nw = wi
  let nd = di
  if (e.key === 'ArrowLeft') nw = wi - 1
  else if (e.key === 'ArrowRight') nw = wi + 1
  else if (e.key === 'ArrowUp') nd = di - 1
  else if (e.key === 'ArrowDown') nd = di + 1
  else return
  e.preventDefault()
  dayRefs[`${nw}-${nd}`]?.focus()
}
</script>

<template>
  <section class="heatmap panel">
    <div v-if="loading" class="state">正在加载贡献数据…</div>
    <div v-else-if="error" class="state error">{{ error }}</div>

    <template v-else>
      <div class="scroll">
        <div class="grid" role="grid" aria-label="GitHub 贡献热力图">
          <div
            v-for="(week, wi) in weeks"
            :key="wi"
            class="week"
            :style="{ animationDelay: `${wi * 8}ms` }"
          >
            <div
              v-for="(day, di) in week"
              :key="di"
              :ref="(el) => (dayRefs[`${wi}-${di}`] = el)"
              role="gridcell"
              tabindex="0"
              class="day"
              :class="{
                empty: !day,
                ['lv' + (day ? day.level : 0)]: !!day,
                selected: day && selected === day.date,
              }"
              :title="titleFor(day)"
              :aria-label="day ? `${day.date}，${day.count} 次提交` : ''"
              @click="day && toggleSelect(day)"
              @keydown="day && onKey($event, wi, di)"
              @keydown.enter="day && toggleSelect(day)"
              @keydown.space.prevent="day && toggleSelect(day)"
            ></div>
          </div>
        </div>
      </div>

      <div class="meta">
        <div class="legend">
          <span>少</span>
          <span v-for="i in 5" :key="i" class="legend-cell" :class="'lv' + (i - 1)"></span>
          <span>多</span>
        </div>
        <p class="total">
          过去一年共 <strong>{{ total }}</strong> 次提交<template v-if="selected">
            · <strong>{{ selected }}</strong> 已选中</template
          >
        </p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.heatmap {
  padding: 20px;
  margin: 16px auto;
  width: min(900px, 100%);
}

.state {
  padding: 24px 0;
  color: var(--text-muted);
  text-align: center;
}

.state.error {
  color: #d1242f;
}

.scroll {
  overflow-x: auto;
  /* 预留四周空间，避免 hover 放大（scale 1.3 + 阴影）时格子被裁剪 */
  padding: 8px 8px 12px;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--season-primary) 42%, transparent)
    transparent;
}

.scroll::-webkit-scrollbar {
  height: 8px;
}
.scroll::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 999px;
}
.scroll::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--season-primary) 42%, transparent);
  border-radius: 999px;
}
.scroll::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--season-primary) 62%, transparent);
}

.grid {
  display: flex;
  gap: 3px;
  width: max-content;
  margin-inline: auto;
}

.week {
  display: flex;
  flex-direction: column;
  gap: 3px;
  animation: fadeIn 0.4s ease both;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.day {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: var(--surface-2);
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  outline: none;
}

.day.empty {
  background: transparent;
  cursor: default;
}

/* 色阶：基于季节主色通过 color-mix 生成 5 档，随季节/昼夜联动（含图例色块） */
.lv0 {
  background: color-mix(in srgb, var(--season-primary) 12%, var(--surface-2));
}
.lv1 {
  background: color-mix(in srgb, var(--season-primary) 32%, var(--surface-2));
}
.lv2 {
  background: color-mix(in srgb, var(--season-primary) 55%, var(--surface-2));
}
.lv3 {
  background: color-mix(in srgb, var(--season-primary) 80%, var(--surface-2));
}
.lv4 {
  background: var(--season-primary);
}

.day:not(.empty):hover {
  transform: scale(1.3);
  box-shadow: 0 0 6px var(--season-primary);
}

.day:focus-visible {
  outline: 2px solid var(--season-accent);
  outline-offset: 1px;
}

.day.selected {
  outline: 2px solid var(--season-accent);
  outline-offset: 1px;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
}

.legend {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.legend-cell {
  width: 11px;
  height: 11px;
  border-radius: 2px;
}

.total {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.total strong {
  color: var(--text);
}
</style>
