import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import BlogListView from '../views/BlogListView.vue'
import BlogDetailView from '../views/BlogDetailView.vue'

const router = createRouter({
  // 使用 hash 模式，静态托管（如 GitHub Pages）下刷新/直达也不会 404
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/posts', name: 'posts', component: BlogListView },
    { path: '/posts/:id', name: 'post-detail', component: BlogDetailView },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
