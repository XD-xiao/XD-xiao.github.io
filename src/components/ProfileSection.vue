<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { siteConfig } from '../config'
import { useTheme } from '../composables/useTheme'
import ThemeSignature from './ThemeSignature.vue'
import bilibiliIcon from '../assets/bilibili.svg'
import avatarUrl from '../assets/Avatar.jpg'

const { name, links } = siteConfig
const avatar = avatarUrl
const { season } = useTheme()

const tilt = ref({ x: 0, y: 0 })
const tilting = ref(false)
const loaded = ref(false)
const blinking = ref(false)
const burst = ref([])
const copied = ref(false)
let rafId = null
let burstId = 0
let blinkTimer = null
let copyTimer = null

const tiltStyle = computed(
  () =>
    `transform: perspective(600px) rotateX(${tilt.value.x}deg) rotateY(${tilt.value.y}deg)`
)

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function onMove(e) {
  if (rafId) return
  // 在进入 rAF 前同步捕获元素引用，避免 currentTarget 在异步回调中失效
  const target = e.currentTarget
  const clientX = e.clientX
  const clientY = e.clientY
  // 加上 tilting：关闭过渡，让倾斜实时跟随指针
  tilting.value = true
  rafId = requestAnimationFrame(() => {
    const rect = target.getBoundingClientRect()
    const dx = (clientX - rect.left - rect.width / 2) / (rect.width / 2)
    const dy = (clientY - rect.top - rect.height / 2) / (rect.height / 2)
    tilt.value = { x: dy * -7, y: dx * 7 }
    rafId = null
  })
}

function onLeave() {
  // 移除 tilting：过渡重新生效，元素平滑回正
  tilting.value = false
  tilt.value = { x: 0, y: 0 }
}

function onAvatarClick() {
  if (prefersReducedMotion()) return

  const colors = {
    spring: '#f4a6c0',
    summer: '#ffe08a',
    autumn: '#e08a4a',
    winter: '#ffffff',
  }
  const color = colors[season.value] || '#f4a6c0'
  const count = 14
  const list = []
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
    const dist = 60 + Math.random() * 60
    list.push({
      id: burstId++,
      style: {
        '--dx': `${Math.cos(angle) * dist}px`,
        '--dy': `${Math.sin(angle) * dist}px`,
        background: color,
      },
    })
  }
  burst.value = list
  setTimeout(() => (burst.value = []), 1200)
}

async function copyEmail() {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(links.email)
    } else {
      // 非安全上下文（如局域网 http 访问）下没有 Clipboard API，退化为临时输入框复制
      const ta = document.createElement('textarea')
      ta.value = links.email
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => (copied.value = false), 1500)
  } catch (e) {
    console.warn('复制邮箱失败：', e)
  }
}

onMounted(() => {
  if (prefersReducedMotion()) return
  const schedule = () => {
    blinkTimer = setTimeout(() => {
      blinking.value = true
      setTimeout(() => {
        blinking.value = false
        schedule()
      }, 120)
    }, 4000 + Math.random() * 2000)
  }
  schedule()
})

onUnmounted(() => {
  if (blinkTimer) clearTimeout(blinkTimer)
  if (copyTimer) clearTimeout(copyTimer)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <section class="profile">
    <div
      class="avatar-wrap"
      @mousemove="onMove"
      @mouseleave="onLeave"
      @click="onAvatarClick"
    >
      <span class="ring" aria-hidden="true"></span>
      <div
        class="avatar-tilt"
        :class="{ tilting, blinking }"
        :style="tiltStyle"
      >
        <div v-if="!loaded" class="avatar-skeleton" aria-hidden="true"></div>
        <img
          class="avatar"
          :class="{ loaded }"
          :src="avatar"
          :alt="name"
          @load="loaded = true"
        />
      </div>

      <span
        v-for="p in burst"
        :key="p.id"
        class="burst-p"
        :style="p.style"
      ></span>
    </div>

    <h1 class="name gradient-text">{{ name }}</h1>
    <ThemeSignature />

    <div class="links">
      <a
        class="link"
        :href="links.github"
        target="_blank"
        rel="noopener noreferrer"
        title="GitHub"
        aria-label="GitHub"
      >
        <svg class="icon" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
          />
        </svg>
        <span>GitHub</span>
      </a>

      <button
        class="link"
        type="button"
        :class="{ copied }"
        :title="copied ? '已复制' : `点击复制邮箱：${links.email}`"
        :aria-label="`复制邮箱：${links.email}`"
        @click="copyEmail"
      >
        <svg class="icon" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2zm13 2.383-4.758 2.855L15 11.114v-5.73zm-.034 6.878-3.225-1.935-1.17.702a.75.75 0 0 1-.802 0l-1.17-.702L5.034 11.26a1 1 0 0 0 .966.74h8a1 1 0 0 0 .966-.74zM1 11.114l4.758-2.876L1 5.383v5.73z"
          />
        </svg>
        <span>{{ copied ? '已复制' : links.email }}</span>
      </button>

      <a
        class="link"
        :href="links.bilibili"
        target="_blank"
        rel="noopener noreferrer"
        title="哔哩哔哩"
        aria-label="哔哩哔哩"
      >
        <img class="icon icon-img" :src="bilibiliIcon" alt="" aria-hidden="true" />
        <span>哔哩哔哩</span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 12px 20px 4px;
}

.avatar-wrap {
  position: relative;
  width: 124px;
  height: 124px;
  cursor: pointer;
}

.ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: conic-gradient(
    var(--season-primary),
    var(--season-secondary),
    var(--season-accent),
    var(--season-primary)
  );
  animation: spin 12s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.avatar-tilt {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  transition: transform 0.4s ease;
}
/* 悬停跟随期间关闭过渡，使倾斜与指针位置同步；离开时移除该类，恢复平滑回正 */
.avatar-tilt.tilting {
  transition: none;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid var(--surface);
  object-fit: cover;
  box-shadow: var(--shadow);
  opacity: 0;
  transition: opacity 0.4s ease;
}
.avatar.loaded {
  opacity: 1;
}

.avatar-skeleton {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid var(--surface);
  background: color-mix(in srgb, var(--text-muted) 22%, transparent);
  overflow: hidden;
}
.avatar-skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.55),
    transparent
  );
  transform: translateX(-100%);
  animation: shimmer 1.3s ease-in-out infinite;
}
@keyframes shimmer {
  to {
    transform: translateX(100%);
  }
}

.avatar-tilt.blinking .avatar {
  animation: blink-eye 0.12s ease-in-out;
}
@keyframes blink-eye {
  50% {
    transform: scaleY(0.08);
  }
}

.burst-p {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  pointer-events: none;
  animation: burst 1.2s ease-out forwards;
}
@keyframes burst {
  to {
    transform: translate(var(--dx), var(--dy)) scale(0);
    opacity: 0;
  }
}

.name {
  margin: 14px 0 4px;
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 7px;
  justify-content: center;
}

.link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
  font-size: 0.9rem;
  text-decoration: none;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}
.link:hover {
  border-color: var(--season-primary);
  box-shadow: 0 0 12px var(--season-primary);
  transform: translateY(-2px);
}
.link:active {
  transform: scale(0.97);
}
.link:focus-visible {
  outline: 2px solid var(--season-primary);
  outline-offset: 2px;
}

.icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
  flex: none;
}

.icon-img {
  border-radius: 3px;
}

@media (max-width: 480px) {
  .link span {
    display: none;
  }
  /* 小屏只显示图标，复制后仍需让“已复制”可见 */
  .link.copied span {
    display: inline;
  }
}
</style>
