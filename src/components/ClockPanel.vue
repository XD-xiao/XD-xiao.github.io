<script setup>
import { computed, ref } from 'vue'
import { useTheme } from '../composables/useTheme'

const { state, setHours, setMinutes, restoreNow } = useTheme()

const hourStr = computed(() => String(state.hours).padStart(2, '0'))
const minuteStr = computed(() => String(state.minutes).padStart(2, '0'))

// 拖拽调整：累计纵向位移，每超过阈值触发一次 ±1
const dragging = ref(false)
let dragStartY = 0
let dragAcc = 0

function nudge(field, delta) {
  if (field === 'h') setHours(state.hours + delta)
  else setMinutes(state.minutes + delta)
}

// 仅小时支持鼠标滚轮
function onHourWheel(e) {
  nudge('h', e.deltaY < 0 ? 1 : -1)
}

function onKey(field, e) {
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    nudge(field, e.shiftKey ? 5 : 1)
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    nudge(field, e.shiftKey ? -5 : -1)
  }
}

function onDragStart(e) {
  dragging.value = true
  dragStartY = e.clientY
  dragAcc = 0
  e.currentTarget.setPointerCapture?.(e.pointerId)
}

function onDragMove(field, e) {
  if (!dragging.value) return
  const dy = e.clientY - dragStartY
  dragStartY = e.clientY
  dragAcc += dy
  const STEP = 14
  while (dragAcc <= -STEP) {
    nudge(field, 1)
    dragAcc += STEP
  }
  while (dragAcc >= STEP) {
    nudge(field, -1)
    dragAcc -= STEP
  }
}

function onDragEnd() {
  dragging.value = false
  dragAcc = 0
}
</script>

<template>
  <section class="clock">
    <div class="display" role="timer" aria-live="polite">
      <span
        class="digit hoverable"
        role="spinbutton"
        tabindex="0"
        :aria-label="`小时，当前 ${state.hours}，可用上下方向键调整`"
        :aria-valuenow="state.hours"
        aria-valuemin="0"
        aria-valuemax="23"
        @wheel.prevent="onHourWheel"
        @keydown="onKey('h', $event)"
        @pointerdown="onDragStart"
        @pointermove="onDragMove('h', $event)"
        @pointerup="onDragEnd"
        @pointercancel="onDragEnd"
      >
        <Transition name="roll" mode="out-in">
          <span :key="hourStr" class="num">{{ hourStr }}</span>
        </Transition>
      </span>

      <span class="colon" aria-hidden="true">:</span>

      <span
        class="digit"
        role="spinbutton"
        tabindex="0"
        :aria-label="`分钟，当前 ${state.minutes}，可用上下方向键调整`"
        :aria-valuenow="state.minutes"
        aria-valuemin="0"
        aria-valuemax="59"
        @keydown="onKey('m', $event)"
        @pointerdown="onDragStart"
        @pointermove="onDragMove('m', $event)"
        @pointerup="onDragEnd"
        @pointercancel="onDragEnd"
      >
        <Transition name="roll" mode="out-in">
          <span :key="minuteStr" class="num">{{ minuteStr }}</span>
        </Transition>
      </span>

      <Transition name="restore">
        <button
          v-if="state.manual"
          class="restore"
          type="button"
          title="恢复实时时间"
          aria-label="恢复实时时间"
          @click="restoreNow"
        >
          <svg
            class="restore-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.9"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </Transition>
    </div>
  </section>
</template>

<style scoped>
.clock {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 数字后方的季节色柔光，营造低调的科技光感（不占布局） */
.clock::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 240px;
  height: 120px;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    closest-side,
    color-mix(in srgb, var(--season-primary) 28%, transparent),
    transparent
  );
  filter: blur(16px);
  opacity: 0.45;
  pointer-events: none;
  transition: background 0.8s ease, opacity 0.8s ease;
}

.display {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-family: var(--mono);
  font-size: clamp(2.6rem, 8vw, 4.6rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: var(--text);
  user-select: none;
}

/* 数字底部的一道细光，像屏幕的承托线 */
.display::after {
  content: '';
  position: absolute;
  left: 6%;
  right: 6%;
  bottom: -12px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--season-primary) 55%, transparent),
    transparent
  );
  pointer-events: none;
}

.digit {
  position: relative;
  display: inline-block;
  min-width: 1.6ch;
  text-align: center;
  overflow: hidden;
  border-radius: 8px;
  transition: transform 0.18s ease, filter 0.18s ease;
}

/* 仅小时可调整：悬停给出纵向拖拽的提示 */
.digit.hoverable {
  cursor: ns-resize;
}

.digit.hoverable:hover {
  transform: scale(1.04);
  filter: drop-shadow(
    0 0 12px color-mix(in srgb, var(--season-primary) 45%, transparent)
  );
}

.digit:focus-visible {
  outline: 2px solid var(--season-primary);
  outline-offset: 4px;
}

.num {
  display: inline-block;
  background: linear-gradient(
    180deg,
    var(--text),
    color-mix(in srgb, var(--text) 66%, var(--season-primary))
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.colon {
  animation: breathe 2.4s ease-in-out infinite;
  color: color-mix(in srgb, var(--season-primary) 38%, var(--text-muted));
  transition: color 0.8s ease;
}

@keyframes breathe {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

/* 数字滚动切换 */
.roll-enter-active,
.roll-leave-active {
  transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.18s cubic-bezier(0.22, 1, 0.36, 1);
}
.roll-enter-from {
  transform: translateY(55%);
  opacity: 0;
}
.roll-leave-to {
  transform: translateY(-55%);
  opacity: 0;
}

/* 恢复实时：固定在右侧的图标按钮，脱离文档流，出现/隐藏都不影响面板尺寸 */
.restore {
  position: absolute;
  left: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%);
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.25s ease, border-color 0.25s ease,
    background 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
}
.restore:hover {
  color: var(--season-primary);
  border-color: var(--season-primary);
  transform: translateY(-50%) scale(1.06);
  box-shadow: 0 0 12px color-mix(in srgb, var(--season-primary) 35%, transparent);
}
.restore:focus-visible {
  outline: 2px solid var(--season-primary);
  outline-offset: 2px;
}

.restore-icon {
  width: 16px;
  height: 16px;
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.restore:hover .restore-icon {
  transform: rotate(-180deg);
}

.restore-enter-active,
.restore-leave-active {
  transition: opacity 0.25s ease;
}
.restore-enter-from,
.restore-leave-to {
  opacity: 0;
}
</style>
