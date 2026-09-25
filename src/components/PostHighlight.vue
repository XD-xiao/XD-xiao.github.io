<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import PostCard from './PostCard.vue'
import { posts } from '../lib/posts'

const router = useRouter()

// 置顶：tags 包含「置顶」标签，且日期最新的一篇
const pinnedPost = computed(() => posts.find((p) => p.pinned && p.date) || null)

// 无置顶时退化为最新一篇
const pinnedCard = computed(() => pinnedPost.value || posts[0] || null)

// 最新博文：排除已作为置顶展示的那篇
const latestCard = computed(() => {
  const exclude = pinnedCard.value?.id
  return posts.find((p) => p.id !== exclude) || null
})

function open(post) {
  router.push({ name: 'post-detail', params: { id: post.id } })
}
</script>

<template>
  <section v-if="pinnedCard || latestCard" class="posts">
    <h2 class="title">精选博文</h2>

    <div class="cards">
      <PostCard
        v-if="pinnedCard"
        :post="pinnedCard"
        @open="open"
      />
      <PostCard
        v-if="latestCard"
        :post="latestCard"
        @open="open"
      />
    </div>

    <div class="cta">
      <RouterLink class="btn-all" to="/posts">查看全部博文</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.posts {
  margin: 8px 0;
}

.title {
  margin: 0 0 16px;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-align: center;
}

/* 标题前的一小段季节色短线：简约的点缀 */
.title::before {
  content: '';
  display: inline-block;
  width: 16px;
  height: 2px;
  margin-right: 8px;
  border-radius: 2px;
  vertical-align: middle;
  background: linear-gradient(
    90deg,
    var(--season-primary),
    var(--season-secondary)
  );
}
.title::after {
  content: '';
  display: inline-block;
  width: 16px;
  height: 2px;
  margin-left: 8px;
  border-radius: 2px;
  vertical-align: middle;
  background: linear-gradient(
      90deg,
      var(--season-primary),
      var(--season-secondary)
  );
}

.cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
  max-width: 900px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .cards {
    grid-template-columns: 1.1fr 1fr;
  }
}

.cta {
  display: flex;
  justify-content: center;
  margin-top: 22px;
}

.btn-all {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 26px;
  border-radius: 999px;
  color: #fff;
  font-weight: 600;
  text-decoration: none;
  background: linear-gradient(
    90deg,
    var(--season-primary),
    var(--season-secondary)
  );
  background-size: 150% 100%;
  transition: background-position 0.3s ease, transform 0.15s ease,
    box-shadow 0.15s ease;
}
.btn-all:hover {
  background-position: 100% 0;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px var(--season-primary);
}
.btn-all:focus-visible {
  outline: 2px solid var(--season-accent);
  outline-offset: 2px;
}
</style>
