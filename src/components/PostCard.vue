<script setup>
defineProps({
  post: { type: Object, required: true },
})

defineEmits(['open'])
</script>

<template>
  <article
    class="card"
    tabindex="0"
    role="button"
    @click="$emit('open', post)"
    @keydown.enter="$emit('open', post)"
    @keydown.space.prevent="$emit('open', post)"
  >
    <div class="head">
      <h3 class="title">{{ post.title }}</h3>
      <time v-if="post.date" class="date">{{ post.date }}</time>
    </div>

    <p v-if="post.description" class="desc">{{ post.description }}</p>

    <div v-if="post.tags.length" class="tags">
      <span v-for="t in post.tags" :key="t" class="tag">{{ t }}</span>
    </div>

    <span class="arrow" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </span>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 22px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm),
    inset 0 1px 0 color-mix(in srgb, var(--season-secondary) 26%, transparent);
  cursor: pointer;
  transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
}

.card:hover,
.card:focus-visible {
  transform: translateY(-4px);
  border-color: var(--accent);
  box-shadow: var(--shadow),
    inset 0 1px 0 color-mix(in srgb, var(--season-secondary) 45%, transparent);
  outline: none;
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.title {
  margin: 0;
  font-size: 1.12rem;
  font-weight: 650;
  line-height: 1.4;
}

.date {
  flex: none;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.desc {
  margin: 10px 0 0;
  color: var(--text-muted);
  font-size: 0.92rem;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
  padding-right: 40px;
}

.tag {
  padding: 3px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--season-primary) 8%, var(--surface-2));
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.75rem;
}

/* 右下角悬停箭头：用图标提示卡片可点击进入详情 */
.arrow {
  position: absolute;
  right: 16px;
  bottom: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: #fff;
  background: linear-gradient(
    135deg,
    var(--season-primary),
    var(--season-secondary)
  );
  box-shadow: 0 4px 12px
    color-mix(in srgb, var(--season-primary) 40%, transparent);
  opacity: 0;
  transform: translate(-4px, 4px);
  transition: opacity 0.18s, transform 0.18s;
}

.arrow svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.card:hover .arrow,
.card:focus-visible .arrow {
  opacity: 1;
  transform: translate(0, 0);
}
</style>
