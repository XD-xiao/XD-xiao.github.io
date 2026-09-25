<script setup>
import { computed, ref } from 'vue'
import { useTheme } from '../composables/useTheme'
import { posts } from '../lib/posts'

const { state, setYearMonth } = useTheme()

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const MONTHS = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
]

function localDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const today = new Date()
const isToday = (d) =>
  d.getFullYear() === today.getFullYear() &&
  d.getMonth() === today.getMonth() &&
  d.getDate() === today.getDate()

// 博文日期 -> 博文列表 的映射（用于圆点标记与跳转）
const postMap = computed(() => {
  const map = {}
  for (const p of posts) {
    if (!p.date) continue
    ;(map[p.date] ||= []).push(p)
  }
  return map
})

// 月历网格：固定 6 行 × 7 列，周一为一周起始
const grid = computed(() => {
  const first = new Date(state.year, state.month - 1, 1)
  const offset = (first.getDay() + 6) % 7 // 周一为 0
  const start = new Date(state.year, state.month - 1, 1 - offset)
  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const dateStr = localDateStr(d)
    cells.push({
      day: d.getDate(),
      inMonth: d.getMonth() + 1 === state.month && d.getFullYear() === state.year,
      isToday: isToday(d),
      dateStr,
      posts: postMap.value[dateStr] || [],
    })
  }
  return cells
})

// 今天在网格中的索引，作为默认焦点
const todayIndex = computed(() => {
  const idx = grid.value.findIndex((c) => c.isToday)
  return idx === -1 ? 0 : idx
})

const focusedIndex = ref(-1)
const cellRefs = ref([])
function focusCell(i) {
  focusedIndex.value = i
  cellRefs.value[i]?.focus()
}

function moveFocus(delta) {
  const i = focusedIndex.value === -1 ? todayIndex.value : focusedIndex.value
  const next = Math.min(41, Math.max(0, i + delta))
  focusCell(next)
}

const showPicker = ref(false)
const years = computed(() => {
  const y = today.getFullYear()
  return Array.from({ length: 11 }, (_, i) => y - 5 + i)
})

function prevMonth() {
  setYearMonth(state.year, state.month - 1)
}
function nextMonth() {
  setYearMonth(state.year, state.month + 1)
}
function pickMonth(m) {
  setYearMonth(state.year, m)
  showPicker.value = false
}
function pickYear(y) {
  setYearMonth(y, state.month)
}

function onCellClick(cell) {
  // 仅支持切换到非本月日期对应的月份，不再跳转博文
  if (!cell.inMonth) {
    setYearMonth(cell.year || state.year, cell.month || state.month)
  }
}

function onCellKeydown(e, index, cell) {
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    moveFocus(-1)
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    moveFocus(1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    moveFocus(-7)
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    moveFocus(7)
  } else if (e.key === 'PageUp') {
    e.preventDefault()
    prevMonth()
  } else if (e.key === 'PageDown') {
    e.preventDefault()
    nextMonth()
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    onCellClick(cell)
  }
}
</script>

<template>
  <section class="calendar panel">
    <header class="head">
      <button class="nav" type="button" aria-label="上一月" @click="prevMonth">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14.5 6L8.5 12l6 6" />
        </svg>
      </button>

      <div class="ym">
        <button class="ym-title" type="button" @click="showPicker = !showPicker">
          {{ state.year }} 年 {{ state.month }} 月
        </button>

        <div v-if="showPicker" class="picker">
          <div class="picker-years">
            <button
              v-for="y in years"
              :key="y"
              type="button"
              :class="{ active: y === state.year }"
              @click="pickYear(y)"
            >
              {{ y }}
            </button>
          </div>
          <div class="picker-months">
            <button
              v-for="(m, i) in MONTHS"
              :key="i"
              type="button"
              :class="{ active: i + 1 === state.month }"
              @click="pickMonth(i + 1)"
            >
              {{ m }}
            </button>
          </div>
        </div>
      </div>

      <button class="nav" type="button" aria-label="下一月" @click="nextMonth">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9.5 6l6 6-6 6" />
        </svg>
      </button>
    </header>

    <div class="weekdays">
      <span v-for="w in WEEKDAYS" :key="w">{{ w }}</span>
    </div>

    <div class="days" role="grid" aria-label="月历">
      <button
        v-for="(cell, i) in grid"
        :key="i"
        :ref="(el) => (cellRefs[i] = el)"
        type="button"
        role="gridcell"
        class="day"
        :class="{
          dim: !cell.inMonth,
          today: cell.isToday,
          hasPost: cell.posts.length,
        }"
        :tabindex="i === todayIndex ? 0 : -1"
        :aria-current="cell.isToday ? 'date' : undefined"
        :title="cell.posts.map((p) => p.title).join('、')"
        @click="onCellClick(cell)"
        @keydown="onCellKeydown($event, i, cell)"
        @focus="focusedIndex = i"
      >
        <span class="num">{{ cell.day }}</span>
        <span v-if="cell.posts.length" class="dot" aria-hidden="true"></span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.calendar {
  padding: 12px;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.nav {
  display: inline-grid;
  place-items: center;
  flex: none;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface-2);
  color: var(--text-muted);
  cursor: pointer;
  transition: border-color 0.18s ease, color 0.18s ease,
    background 0.18s ease, box-shadow 0.18s ease, transform 0.12s ease;
}
.nav svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.nav:hover {
  color: var(--season-primary);
  border-color: var(--season-primary);
  background: color-mix(in srgb, var(--season-primary) 10%, var(--surface-2));
  box-shadow: 0 0 10px color-mix(in srgb, var(--season-primary) 30%, transparent);
}
.nav:active {
  transform: scale(0.92);
}
.nav:focus-visible {
  outline: 2px solid var(--season-primary);
  outline-offset: 2px;
}

.ym {
  position: relative;
}
.ym-title {
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 0.95rem;
  font-weight: 650;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
}
.ym-title:hover {
  background: var(--surface-2);
}

.picker {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  width: 240px;
  padding: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(12px);
}
.picker-years,
.picker-months {
  display: grid;
  gap: 4px;
}
.picker-years {
  grid-template-columns: repeat(4, 1fr);
  margin-bottom: 8px;
}
.picker-months {
  grid-template-columns: repeat(3, 1fr);
}
.picker button {
  padding: 6px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--text);
  font-size: 0.85rem;
  cursor: pointer;
}
.picker button:hover {
  background: var(--surface-2);
}
.picker button.active {
  border-color: var(--season-primary);
  color: var(--season-primary);
  font-weight: 600;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
  max-width: 300px;
  margin: 0 auto 4px;
  color: var(--text-muted);
  font-size: 0.72rem;
  text-align: center;
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
  max-width: 300px;
  margin: 0 auto;
}

.day {
  position: relative;
  aspect-ratio: 1;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--text);
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.day:hover {
  background: var(--surface-2);
  border-color: var(--season-primary);
}
.day:focus-visible {
  outline: 2px solid var(--season-primary);
  outline-offset: 1px;
}
.day.dim {
  color: var(--text-muted);
  opacity: 0.6;
}

.day .num {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  line-height: 1;
}

.day.today .num {
  padding: 2px 7px;
  border-radius: 6px;
  color: var(--season-primary);
  font-weight: 700;
}

.dot {
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--season-accent);
}
</style>
