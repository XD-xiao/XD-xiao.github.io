<script setup>
import { onMounted, onUnmounted } from 'vue'
import ThemeBackground from '../components/ThemeBackground.vue'
import ProfileSection from '../components/ProfileSection.vue'
import ClockPanel from '../components/ClockPanel.vue'
import CalendarPanel from '../components/CalendarPanel.vue'
import ContributionHeatmap from '../components/ContributionHeatmap.vue'
import PostHighlight from '../components/PostHighlight.vue'
import { useTheme } from '../composables/useTheme'

// 主题生命周期跟随首页：进入挂载（写 data-* + 走时），离开清除
const { mount, unmount } = useTheme()
onMounted(mount)
onUnmounted(unmount)
</script>

<template>
  <div class="home">
    <ThemeBackground />

    <main class="container content">
      <!-- 第一行：时钟面板，顶部居中 -->
      <div class="clock-row">
        <ClockPanel />
      </div>

      <!-- 第二行：左侧个人资料 + 右侧月历 -->
      <div class="row-mid">
        <ProfileSection />
        <CalendarPanel />
      </div>

      <ContributionHeatmap />
      <PostHighlight />
    </main>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
}

.content {
  position: relative;
  z-index: 1;
  max-width: 1080px;
  padding: 16px 20px 48px;
}

/* 第一行：时钟面板，顶部居中 */
.clock-row {
  display: flex;
  justify-content: center;
  margin: 80px 0 30px;
}
.clock-row .clock {
  width: min(360px, 100%);
}

/* 第二行：左侧个人资料 + 右侧月历，作为一组居中 */
.row-mid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin: 12px 0;
}
.row-mid .calendar {
  width: min(360px, 100%);
}
</style>
