import { reactive, computed, watch } from 'vue'
import { siteConfig } from '../config'

// 单例主题状态：时间钟与日历共享同一份数据，共同驱动页面外观。
const state = reactive({
  manual: false, // 是否手动模式（手动调整后暂停走时）
  hours: new Date().getHours(),
  minutes: new Date().getMinutes(),
  seconds: new Date().getSeconds(),
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1, // 1-12
})

// 初始季节：跟随系统月份；若配置为手动，则使用 defaultSeason
const initialSeason = seasonOfMonth(state.month)

let timer = null
let stopWatch = null

function seasonOfMonth(m) {
  if (m >= 3 && m <= 5) return 'spring'
  if (m >= 6 && m <= 8) return 'summer'
  if (m >= 9 && m <= 11) return 'autumn'
  return 'winter'
}

function tick() {
  if (state.manual) return
  const d = new Date()
  state.hours = d.getHours()
  state.minutes = d.getMinutes()
  state.seconds = d.getSeconds()
}

function startTicker() {
  if (timer) return
  timer = setInterval(tick, 1000)
}

function stopTicker() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// 季节：由日历选中的月份决定
const season = computed(() => {
  if (!siteConfig.theme.autoSeason) return siteConfig.theme.defaultSeason
  return seasonOfMonth(state.month)
})

// 昼夜：07:00–18:59 为白昼
const mode = computed(() => {
  const h = state.hours
  return h >= 7 && h < 19 ? 'light' : 'dark'
})

// 时段：黎明 / 白天 / 黄昏 / 夜晚 / 深夜
const period = computed(() => {
  const h = state.hours
  if (h >= 5 && h < 7) return 'dawn'
  if (h >= 7 && h < 17) return 'day'
  if (h >= 17 && h < 19) return 'dusk'
  if (h >= 19 && h < 23) return 'night'
  return 'late'
})

// 太阳/月亮：各自独立的弧线位置，切换时交叉淡入淡出，避免位置瞬移
const celestial = computed(() => {
  const h = state.hours
  const m = state.minutes
  const isSun = h >= 5 && h < 19

  // 统一的弧线公式：t ∈ [0,1] → 东升(左)到西落(右)
  const pos = (t) => ({
    x: 6 + 88 * t,
    y: 76 - 58 * Math.sin(Math.PI * t),
  })

  // 太阳：05:00 升起(t=0) → 19:00 落下(t=1)
  const sunT = Math.min(1, Math.max(0, (h + m / 60 - 5) / 14))
  // 月亮：19:00 升起(t=0) → 次日 05:00 落下(t=1)
  const hh = h >= 19 ? h : h + 24
  const moonT = Math.min(1, Math.max(0, (hh + m / 60 - 19) / 10))

  return {
    isSun,
    sun: pos(sunT),
    moon: pos(moonT),
  }
})

const periodLabel = computed(
  () => ({ dawn: '黎明', day: '白天', dusk: '黄昏', night: '夜晚', late: '深夜' }[period.value])
)
const seasonLabel = computed(
  () => ({ spring: '春', summer: '夏', autumn: '秋', winter: '冬' }[season.value])
)

function applyAttrs() {
  const el = document.documentElement
  el.dataset.season = season.value
  el.dataset.mode = mode.value
  el.dataset.period = period.value
}

function clearAttrs() {
  const el = document.documentElement
  delete el.dataset.season
  delete el.dataset.mode
  delete el.dataset.period
}

// 启动主题：开始走时并把状态写入 <html> 的 data-* 属性（幂等）
function mount() {
  if (stopWatch) return
  tick()
  applyAttrs()
  startTicker()
  stopWatch = watch([season, mode, period], applyAttrs)
}

// 卸载主题：停止走时并清除 data-* 属性（离开首页时恢复默认外观）
function unmount() {
  stopTicker()
  if (stopWatch) {
    stopWatch()
    stopWatch = null
  }
  clearAttrs()
}

// 时间钟调整接口
function setHours(h) {
  state.manual = true
  state.hours = ((h % 24) + 24) % 24
}

function setMinutes(m) {
  state.manual = true
  state.minutes = ((m % 60) + 60) % 60
}

function restoreNow() {
  state.manual = false
  tick()
  startTicker()
}

// 日历调整接口
function setYearMonth(year, month) {
  state.year = year
  state.month = ((month - 1 + 12) % 12) + 1
}

export function useTheme() {
  return {
    state,
    season,
    mode,
    period,
    celestial,
    periodLabel,
    seasonLabel,
    initialSeason,
    mount,
    unmount,
    setHours,
    setMinutes,
    restoreNow,
    setYearMonth,
  }
}
