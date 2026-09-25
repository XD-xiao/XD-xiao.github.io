<script setup>
defineProps({
  backTo: { type: String, required: true },
  backText: { type: String, default: '返回' },
  // 图标类型：'home' 返回首页 / 'arrow' 返回上一级
  icon: { type: String, default: 'arrow' },
})
</script>

<template>
  <header class="bar">
    <div class="bar-inner">
      <RouterLink
        class="back"
        :to="backTo"
        :aria-label="backText"
        :title="backText"
      >
        <svg class="back-icon" viewBox="0 0 24 24" aria-hidden="true">
          <template v-if="icon === 'home'">
            <path d="M3 11.5 12 4l9 7.5" />
            <path d="M5.5 10.5V20h13v-9.5" />
          </template>
          <template v-else>
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </template>
        </svg>
      </RouterLink>
      <slot />
    </div>
  </header>
</template>

<style scoped>
.back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  color: var(--text);
  text-decoration: none;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  transition: color 0.15s, border-color 0.15s, background 0.15s,
    transform 0.15s;
}

.back:hover {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(
    90deg,
    var(--season-primary),
    var(--season-secondary)
  );
  transform: translateX(-2px);
  text-decoration: none;
}

.back-icon {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
