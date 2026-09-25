<script setup>
import { onMounted, ref } from 'vue'
import { siteConfig } from '../config'

const signature = siteConfig.signature || '保持好奇，保持热爱。'
const typed = ref('')
const done = ref(false)

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

onMounted(() => {
  if (prefersReducedMotion()) {
    typed.value = signature
    done.value = true
    return
  }
  let i = 0
  const timer = setInterval(() => {
    typed.value = signature.slice(0, ++i)
    if (i >= signature.length) {
      clearInterval(timer)
      done.value = true
    }
  }, 60)
})
</script>

<template>
  <p class="signature">
    <span class="text">{{ typed }}</span>
    <span v-if="!done" class="caret" aria-hidden="true"></span>
    <svg class="underline" viewBox="0 0 200 12" aria-hidden="true">
      <path
        d="M2 8 C 50 2, 150 2, 198 7"
        pathLength="100"
        fill="none"
        stroke="url(#sig-grad)"
        stroke-width="3"
        stroke-linecap="round"
      />
      <defs>
        <linearGradient id="sig-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="var(--season-primary)" />
          <stop offset="1" stop-color="var(--season-secondary)" />
        </linearGradient>
      </defs>
    </svg>
  </p>
</template>

<style scoped>
.signature {
  position: relative;
  display: inline-block;
  margin: 0;
  font-size: 1.05rem;
  line-height: 3;
  color: var(--text);
  cursor: default;
}

.text {
  font-style: italic;
  letter-spacing: 0.02em;
}

.caret {
  display: inline-block;
  width: 2px;
  height: 1.1em;
  margin-left: 3px;
  vertical-align: text-bottom;
  background: var(--season-primary);
  animation: blink 1s steps(1) infinite;
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}

.underline {
  position: absolute;
  left: 0;
  bottom: -4px;
  width: 100%;
  height: 12px;
  overflow: visible;
}
.underline path {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  transition: stroke-dashoffset 0.6s ease;
}
.signature:hover .underline path {
  stroke-dashoffset: 0;
}
</style>
