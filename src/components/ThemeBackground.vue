<script setup>
import { computed } from 'vue'
import { useTheme } from '../composables/useTheme'
import { siteConfig } from '../config'

const { season, celestial } = useTheme()

// 星点：一次性生成随机位置，避免每次重渲染跳动
const stars = Array.from({ length: 24 }, () => ({
  left: Math.random() * 100,
  top: Math.random() * 55,
  size: Math.random() < 0.3 ? 3 : 2,
  delay: (Math.random() * 4).toFixed(2),
}))

// 云朵配方：以圆叠加出蓬松积云（私有 viewBox 180×76，底边约 y=72）
const CLOUD_SHAPES = [
  {
    base: [92, 58, 76, 13],
    dots: [
      [34, 48, 26],
      [64, 34, 38],
      [104, 42, 32],
      [138, 50, 24],
      [158, 54, 17],
      [88, 26, 26],
    ],
  },
  {
    base: [84, 56, 62, 11],
    dots: [
      [40, 44, 24],
      [72, 34, 30],
      [104, 42, 26],
      [130, 50, 17],
    ],
  },
  {
    base: [92, 58, 76, 11],
    dots: [
      [30, 50, 20],
      [62, 40, 28],
      [96, 34, 26],
      [128, 44, 23],
      [154, 52, 16],
    ],
  },
]

// 三层云：位置只写一份图案（0–50%），再复制到 50–100%，
// 轨道整体左移 50% 即无缝循环，形成极慢的视差漂移。
const CLOUD_LAYERS = [
  { shape: 0, size: 1, items: [[4, 46], [17, 16], [30, 62], [41, 32]] },
  { shape: 1, size: 2, items: [[11, 28], [26, 66], [38, 10]] },
  { shape: 2, size: 3, items: [[7, 56], [22, 22], [36, 70], [46, 36]] },
]

const cloudLayers = CLOUD_LAYERS.map((layer) => ({
  shape: CLOUD_SHAPES[layer.shape],
  clouds: layer.items.flatMap(([left, top]) => [
    { left, top, size: layer.size },
    { left: left + 50, top, size: layer.size },
  ]),
}))

// 远处雪山雪顶：与远景山脉的峰位一一对应
const snowCaps = [
  '238,200 262,168 288,198 276,192 264,204 250,190',
  '450,234 470,208 492,234 482,228 472,238 460,226',
  '616,210 640,178 666,208 654,202 642,214 628,200',
  '812,248 836,224 856,248 846,242 838,252 826,240',
  '1012,240 1032,214 1054,240 1044,234 1034,244 1022,232',
]

// 远景树线：草甸上的小树剪影，增强纵深
const treeLine = [
  { x: 128, y: 452, s: 1 },
  { x: 196, y: 446, s: 0.8 },
  { x: 676, y: 448, s: 0.9 },
  { x: 732, y: 456, s: 1.1 },
  { x: 786, y: 450, s: 0.7 },
  { x: 1086, y: 462, s: 0.95 },
]

// 前景花海：位置随机、颜色按四色轮转；冬季稀疏并转为冷色
const flowers = computed(() => {
  const count = season.value === 'winter' ? 26 : 54
  return Array.from({ length: count }, (_, i) => ({
    x: Math.random() * 1220 - 10,
    y: 486 + Math.random() * 62,
    r: 3 + Math.random() * 4.6,
    h: 10 + Math.random() * 18,
    c: i % 4,
  }))
})

// 草叶：轻微弯曲的细叶，衬在花海底部
const grass = Array.from({ length: 44 }, () => {
  const x = Math.random() * 1240 - 20
  const y = 508 + Math.random() * 50
  const h = 14 + Math.random() * 24
  const bend = (Math.random() - 0.5) * 18
  return {
    d: `M${x.toFixed(1)} ${y.toFixed(1)} Q ${(x + bend).toFixed(1)} ${(
      y -
      h * 0.6
    ).toFixed(1)} ${(x + bend * 1.7).toFixed(1)} ${(y - h).toFixed(1)}`,
  }
})

// 科技层：数据节点与连线，像一张悬在天空的星图
const techNodes = [
  { x: 148, y: 92 },
  { x: 330, y: 184 },
  { x: 524, y: 96 },
  { x: 706, y: 198 },
  { x: 884, y: 112 },
  { x: 1052, y: 212 },
  { x: 252, y: 302 },
  { x: 620, y: 322 },
  { x: 962, y: 332 },
]
const techEdges = [
  [0, 2],
  [2, 4],
  [4, 5],
  [0, 1],
  [1, 3],
  [3, 5],
  [1, 6],
  [3, 6],
  [3, 7],
  [5, 8],
  [7, 8],
  [2, 3],
].map(([a, b]) => ({ a: techNodes[a], b: techNodes[b] }))

// 粒子：按季节决定数量与样式（花瓣/光斑/落叶/飘雪）
const particleCount = computed(() => {
  if (siteConfig.theme.particles === false) return 0
  return { spring: 8, summer: 10, autumn: 7, winter: 14 }[season.value] ?? 8
})

const particles = computed(() =>
  Array.from({ length: particleCount.value }, () => ({
    left: Math.random() * 100,
    size: 6 + Math.random() * 8,
    delay: (Math.random() * 12).toFixed(2),
    duration: (8 + Math.random() * 8).toFixed(2),
  }))
)

// 太阳/月亮各自的弧线位置（vw/vh 相对视口）
const sunStyle = computed(() => ({
  transform: `translate3d(${celestial.value.sun.x}vw, ${celestial.value.sun.y}vh, 0) translate(-50%, -50%)`,
}))
const moonStyle = computed(() => ({
  transform: `translate3d(${celestial.value.moon.x}vw, ${celestial.value.moon.y}vh, 0) translate(-50%, -50%)`,
}))
</script>

<template>
  <div class="scene" aria-hidden="true">
    <!-- L0 天空渐变 -->
    <div class="sky"></div>
    <!-- L0 柔光色斑：治愈系空气感 -->
    <div class="aurora a1"></div>
    <div class="aurora a2"></div>
    <!-- L0 日晕：跟随太阳位置的暖光 -->
    <div
      class="sun-bloom"
      :class="{ visible: celestial.isSun }"
      :style="sunStyle"
    ></div>

    <!-- L2 星点（夜间淡入） -->
    <div class="stars">
      <span
        v-for="(s, i) in stars"
        :key="i"
        :style="{
          left: s.left + '%',
          top: s.top + '%',
          width: s.size + 'px',
          height: s.size + 'px',
          animationDelay: s.delay + 's',
        }"
      ></span>
    </div>

    <!-- L1.5 云层：三层积云，缓慢漂移 -->
    <div
      v-for="(layer, li) in cloudLayers"
      :key="'cloud-' + li"
      class="cloud-layer"
      :class="'cl-' + (li + 1)"
    >
      <div class="cloud-track">
        <svg
          v-for="(c, ci) in layer.clouds"
          :key="ci"
          class="cloud"
          :class="'s' + c.size"
          :style="{ left: c.left + '%', top: c.top + '%' }"
          viewBox="0 0 180 76"
        >
          <ellipse
            class="cloud-base"
            :cx="layer.shape.base[0]"
            :cy="layer.shape.base[1]"
            :rx="layer.shape.base[2]"
            :ry="layer.shape.base[3]"
          />
          <circle
            v-for="(d, di) in layer.shape.dots"
            :key="di"
            :cx="d[0]"
            :cy="d[1]"
            :r="d[2]"
          />
        </svg>
      </div>
    </div>

    <!-- L1 天体：太阳与月亮各自独立位置，交叉淡入淡出 -->
    <div class="celestial sun" :class="{ visible: celestial.isSun }" :style="sunStyle">
      <span class="glow"></span>
      <span class="ring"></span>
      <span class="body"></span>
    </div>
    <div
      class="celestial moon"
      :class="{ visible: !celestial.isSun }"
      :style="moonStyle"
    >
      <span class="glow"></span>
      <span class="ring"></span>
      <span class="body"></span>
    </div>

    <!-- L3/L4/L5 远景山峦 + 季节中景 + 花海 -->
    <svg
      class="landscape"
      viewBox="0 0 1200 560"
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <linearGradient id="tb-haze" x1="0" y1="0" x2="0" y2="1">
          <stop class="haze-top" offset="0.1" />
          <stop class="haze-bottom" offset="1" />
        </linearGradient>
      </defs>

      <!-- 远山：带雪线的最高一层 -->
      <g class="range-far">
        <path
          d="M0 348 L96 236 L168 296 L262 168 L372 292 L470 208 L560 268 L640 178 L742 288 L836 224 L930 292 L1032 214 L1120 286 L1200 240 L1200 560 L0 560 Z"
        />
        <polygon v-for="(cap, i) in snowCaps" :key="i" class="snow" :points="cap" />
      </g>

      <!-- 中景山脊 -->
      <path
        class="range-mid"
        d="M0 404 L118 322 L232 388 L356 306 L470 380 L590 318 L700 392 L828 330 L940 396 L1064 336 L1200 400 L1200 560 L0 560 Z"
      />

      <!-- 山脚薄雾：拉开山与草甸的空气层 -->
      <rect
        class="haze"
        x="0"
        y="300"
        width="1200"
        height="180"
        fill="url(#tb-haze)"
      />

      <!-- 草甸：远、中两层起伏 + 近景地面 -->
      <path
        class="hill-far"
        d="M0 452 C 150 414, 320 470, 520 442 C 720 414, 920 472, 1200 436 L1200 560 L0 560 Z"
      />
      <path
        class="hill-mid"
        d="M0 484 C 170 448, 340 508, 560 478 C 760 450, 980 508, 1200 472 L1200 560 L0 560 Z"
      />

      <!-- 远处树线与小木屋 -->
      <g class="tree-line">
        <g
          v-for="(t, i) in treeLine"
          :key="i"
          :transform="`translate(${t.x} ${t.y}) scale(${t.s})`"
        >
          <path d="M0 0 L-8 16 L8 16 Z" />
          <path d="M0 -11 L-6 5 L6 5 Z" />
          <rect x="-1.4" y="16" width="2.8" height="6" />
        </g>
      </g>
      <g class="cabin" transform="translate(886 452)">
        <rect class="wall" x="-17" y="-13" width="34" height="15" />
        <polygon class="roof" points="-21,-13 0,-25 21,-13" />
        <rect class="window" x="-5" y="-8" width="10" height="7" />
      </g>

      <!-- 季节中景元素 -->
      <g v-if="season === 'spring'">
        <!-- 樱花树：树干 + 粉色树冠 -->
        <g id="tb-spring-tree">
          <path
            d="M220 470 C218 420 224 400 220 372 M300 470 C302 430 296 408 300 384"
            stroke="#8a5a44"
            stroke-width="12"
            stroke-linecap="round"
            fill="none"
          />
          <g fill="#f4a6c0">
            <circle cx="188" cy="352" r="40" />
            <circle cx="252" cy="346" r="38" />
            <circle cx="220" cy="322" r="44" />
            <circle cx="270" cy="380" r="34" />
            <circle cx="330" cy="380" r="32" />
            <circle cx="300" cy="352" r="40" />
          </g>
        </g>
        <use href="#tb-spring-tree" transform="translate(402 140) scale(0.7)" />
      </g>

      <g v-else-if="season === 'summer'">
        <!-- 棕榈树：弯曲树干 + 叶片 -->
        <g id="tb-summer-palm">
          <path
            d="M260 470 C270 430 258 400 232 380"
            stroke="#7a5a44"
            stroke-width="14"
            stroke-linecap="round"
            fill="none"
          />
          <g stroke="#4f8a4f" stroke-width="8" stroke-linecap="round" fill="none">
            <path d="M232 380 C200 372 176 384 160 400" />
            <path d="M232 380 C216 356 216 336 228 316" />
            <path d="M232 380 C256 356 276 356 292 368" />
            <path d="M232 380 C248 372 264 380 276 396" />
          </g>
        </g>
        <use href="#tb-summer-palm" transform="translate(392 143) scale(0.7)" />
        <!-- 飞鸟 -->
        <g class="birds">
          <path d="M560 200 C572 190 584 190 596 200" />
          <path d="M640 180 C650 172 660 172 670 180" />
          <path d="M760 214 C769 207 778 207 787 214" />
        </g>
      </g>

      <g v-else-if="season === 'autumn'">
        <!-- 枫树：树干 + 暖色树冠 -->
        <g id="tb-autumn-tree">
          <path
            d="M260 470 C258 424 264 404 260 380"
            stroke="#7a4a34"
            stroke-width="13"
            stroke-linecap="round"
            fill="none"
          />
          <g fill="var(--season-accent)">
            <circle cx="220" cy="356" r="42" />
            <circle cx="300" cy="352" r="40" />
            <circle cx="260" cy="326" r="46" />
            <circle cx="208" cy="380" r="30" />
            <circle cx="312" cy="380" r="30" />
          </g>
        </g>
        <use href="#tb-autumn-tree" transform="translate(422 152) scale(0.68)" />
        <!-- 落叶点缀 -->
        <g fill="var(--season-secondary)">
          <circle cx="180" cy="404" r="6" />
          <circle cx="340" cy="398" r="5" />
          <circle cx="520" cy="430" r="5" />
          <circle cx="700" cy="420" r="4" />
        </g>
      </g>

      <g v-else>
        <!-- 松树：三角层叠 -->
        <g id="tb-winter-pine">
          <path d="M220 380 L160 470 L280 470 Z" fill="#3f6b52" />
          <path d="M228 330 L176 408 L280 408 Z" fill="#3f6b52" />
          <path d="M236 282 L190 348 L282 348 Z" fill="#3f6b52" />
          <rect x="232" y="470" width="12" height="24" fill="#7a5a44" />
        </g>
        <use href="#tb-winter-pine" transform="translate(560 132) scale(0.7)" />
        <g fill="#4c7d60">
          <path d="M420 400 L372 470 L468 470 Z" />
          <path d="M426 360 L382 428 L470 428 Z" />
          <path d="M432 322 L392 382 L472 382 Z" />
          <rect x="416" y="470" width="10" height="20" fill="#7a5a44" />
        </g>
      </g>

      <!-- 近景地面 -->
      <path
        class="ground"
        d="M0 516 C 200 480, 400 544, 620 518 C 840 492, 1020 540, 1200 510 L1200 560 L0 560 Z"
      />

      <!-- 前景：草叶与花海 -->
      <g class="grass">
        <path v-for="(g, i) in grass" :key="i" :d="g.d" />
      </g>
      <g class="flowers">
        <g v-for="(f, i) in flowers" :key="i">
          <line
            class="stem"
            :x1="f.x"
            :y1="f.y"
            :x2="f.x"
            :y2="f.y + f.h"
          />
          <circle
            :cx="f.x"
            :cy="f.y"
            :r="f.r"
            :style="{ fill: `var(--bloom-${f.c + 1})` }"
          />
        </g>
      </g>
    </svg>

    <!-- L4.5 科技层：数据星图 -->
    <svg
      class="tech-net"
      viewBox="0 0 1200 420"
      preserveAspectRatio="xMidYMid slice"
    >
      <g class="tech-links">
        <line
          v-for="(e, i) in techEdges"
          :key="i"
          :x1="e.a.x"
          :y1="e.a.y"
          :x2="e.b.x"
          :y2="e.b.y"
        />
      </g>
      <g class="tech-nodes">
        <g
          v-for="(n, i) in techNodes"
          :key="i"
          :style="{ animationDelay: (i * 0.7).toFixed(1) + 's' }"
        >
          <circle class="halo" :cx="n.x" :cy="n.y" r="9" />
          <circle class="core" :cx="n.x" :cy="n.y" r="2.6" />
        </g>
      </g>
    </svg>

    <!-- L4.6 科技层：地面透视网格 + 缓慢扫描光带 -->
    <div class="tech-grid"></div>
    <div class="scan"></div>

    <!-- L6 天气粒子 -->
    <div v-if="particleCount" class="particles" :class="'p-' + season">
      <span
        v-for="(p, i) in particles"
        :key="i"
        :style="{
          left: p.left + '%',
          width: p.size + 'px',
          height: p.size + 'px',
          animationDelay: p.delay + 's',
          animationDuration: p.duration + 's',
        }"
      ></span>
    </div>

    <!-- L7 色温叠加 + 四角暗角 -->
    <div class="overlay"></div>
    <div class="vignette"></div>
  </div>
</template>

<style scoped>
.scene {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  contain: strict;
  filter: brightness(var(--scene-brightness));
  transition: filter 1s ease;
}

/* 天空：多层渐变 + 顶部高光，换季换时段平滑过渡 */
.sky {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    var(--sky-top) 0%,
    color-mix(in srgb, var(--sky-top) 52%, var(--sky-mid)) 24%,
    var(--sky-mid) 50%,
    color-mix(in srgb, var(--sky-mid) 42%, var(--sky-horizon)) 74%,
    var(--sky-horizon) 100%
  );
}

/* 柔光色斑：随季节主色的空气感光晕 */
.aurora {
  position: absolute;
  border-radius: 50%;
  opacity: 0.32;
  transition: background 1s ease;
}
.a1 {
  width: 62vw;
  height: 62vw;
  left: -14vw;
  top: -26vw;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--season-secondary) 60%, transparent),
    transparent 66%
  );
  animation: drift-a 46s ease-in-out infinite;
}
.a2 {
  width: 52vw;
  height: 52vw;
  right: -12vw;
  top: -14vw;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--tech-line) 45%, transparent),
    transparent 68%
  );
  animation: drift-b 58s ease-in-out infinite;
}
@keyframes drift-a {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(4vw, 3vh, 0) scale(1.08);
  }
}
@keyframes drift-b {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1.05);
  }
  50% {
    transform: translate3d(-4vw, 4vh, 0) scale(1);
  }
}

/* 日晕 */
.sun-bloom {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  opacity: 0;
  transition: transform 0.6s linear, opacity 1s ease;
}
.sun-bloom.visible {
  opacity: 0.75;
}
.sun-bloom::after {
  content: '';
  position: absolute;
  width: min(90vw, 1100px);
  height: min(90vw, 1100px);
  left: calc(min(90vw, 1100px) / -2);
  top: calc(min(90vw, 1100px) / -2);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 226, 170, 0.34),
    rgba(255, 210, 140, 0.14) 38%,
    transparent 66%
  );
}

/* 星点 */
.stars {
  position: absolute;
  inset: 0;
  opacity: var(--stars-opacity);
  transition: opacity 1s ease;
}
.stars span {
  position: absolute;
  border-radius: 50%;
  background: #fff;
  animation: twinkle 3s ease-in-out infinite;
}
@keyframes twinkle {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

/* 云层：宽度 200%，轨道左移 50% 无缝循环 */
.cloud-layer {
  position: absolute;
  left: 0;
  width: 200%;
  pointer-events: none;
}
.cl-1 {
  top: 2%;
  height: 170px;
  opacity: 0.6;
}
.cl-2 {
  top: 7%;
  height: 210px;
  opacity: 0.78;
}
.cl-3 {
  top: 14%;
  height: 250px;
  opacity: 0.9;
}
.cloud-track {
  position: relative;
  width: 100%;
  height: 100%;
  will-change: transform;
  animation-name: cloud-drift;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
.cl-1 .cloud-track {
  animation-duration: 220s;
}
.cl-2 .cloud-track {
  animation-duration: 150s;
}
.cl-3 .cloud-track {
  animation-duration: 110s;
}
@keyframes cloud-drift {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
.cloud {
  position: absolute;
  aspect-ratio: 180 / 76;
  height: auto;
  overflow: visible;
}
.cloud circle {
  fill: var(--cloud-top);
  transition: fill 1s ease;
}
.cloud .cloud-base {
  fill: var(--cloud-bottom);
  transition: fill 1s ease;
}
.s1 {
  width: clamp(90px, 9vw, 150px);
}
.s2 {
  width: clamp(130px, 14vw, 230px);
}
.s3 {
  width: clamp(190px, 21vw, 340px);
}
/* 远处云层与天空混合，形成空气透视 */
.cl-1 .cloud circle {
  fill: color-mix(in srgb, var(--cloud-top) 66%, var(--sky-mid));
}
.cl-1 .cloud .cloud-base {
  fill: color-mix(in srgb, var(--cloud-bottom) 66%, var(--sky-mid));
}

/* 天体 */
.celestial {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  opacity: 0;
  transition: transform 0.6s linear, opacity 1s ease;
}
.celestial.visible {
  opacity: 1;
}
.celestial .body {
  position: absolute;
  width: clamp(56px, 8vw, 96px);
  height: clamp(56px, 8vw, 96px);
  left: calc(clamp(56px, 8vw, 96px) / -2);
  top: calc(clamp(56px, 8vw, 96px) / -2);
  border-radius: 50%;
}
.celestial .glow {
  position: absolute;
  width: calc(clamp(56px, 8vw, 96px) * 2.2);
  height: calc(clamp(56px, 8vw, 96px) * 2.2);
  left: calc(clamp(56px, 8vw, 96px) * -1.1);
  top: calc(clamp(56px, 8vw, 96px) * -1.1);
  border-radius: 50%;
}
.celestial.sun .body {
  background: radial-gradient(circle at 40% 35%, #fff3c4, #ffd66b 55%, #ffb347);
}
.celestial.sun .glow {
  background: radial-gradient(
    circle,
    rgba(255, 200, 100, 0.55),
    rgba(255, 180, 80, 0) 70%
  );
}
.celestial.moon .body {
  background: radial-gradient(circle at 40% 35%, #ffffff, #d7e2ee 70%, #b7c6d8);
  box-shadow: 0 0 20px rgba(220, 235, 255, 0.7);
}
.celestial.moon .glow {
  background: radial-gradient(
    circle,
    rgba(200, 220, 255, 0.28),
    rgba(200, 220, 255, 0) 70%
  );
}
/* 天体轨道细环：一点克制的科技感 */
.celestial .ring {
  position: absolute;
  width: calc(clamp(56px, 8vw, 96px) * 3);
  height: calc(clamp(56px, 8vw, 96px) * 1.15);
  left: calc(clamp(56px, 8vw, 96px) * -1.5);
  top: calc(clamp(56px, 8vw, 96px) * -0.58);
  border-radius: 50%;
  border: 1px dashed color-mix(in srgb, var(--tech-line) 70%, transparent);
  opacity: var(--tech-opacity);
  animation: ring-spin 46s linear infinite;
}
@keyframes ring-spin {
  from {
    transform: rotate(-16deg);
  }
  to {
    transform: rotate(344deg);
  }
}

/* 景观 SVG */
.landscape {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.range-far path {
  fill: color-mix(in srgb, var(--scene-silhouette) 40%, var(--sky-horizon));
  transition: fill 1s ease;
}
.range-mid {
  fill: color-mix(in srgb, var(--scene-silhouette) 72%, var(--sky-horizon));
  transition: fill 1s ease;
}
.snow {
  fill: #ffffff;
  opacity: 0.82;
}
.haze-top {
  stop-color: color-mix(in srgb, var(--sky-horizon) 72%, transparent);
}
.haze-bottom {
  stop-color: transparent;
}
.hill-far {
  fill: var(--hill-far);
  transition: fill 1s ease;
}
.hill-mid {
  fill: var(--hill-mid);
  transition: fill 1s ease;
}
.ground {
  fill: var(--season-ground);
  transition: fill 1s ease;
}
.tree-line path {
  fill: color-mix(in srgb, var(--scene-silhouette) 82%, var(--hill-mid));
}
.tree-line rect {
  fill: color-mix(in srgb, var(--scene-silhouette) 92%, #5a4230);
}
.cabin .wall {
  fill: #ecdfc9;
}
.cabin .roof {
  fill: #a8563a;
}
.cabin .window {
  fill: var(--season-secondary);
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--season-secondary) 70%, transparent));
}
.birds {
  stroke: var(--scene-silhouette);
  stroke-width: 5;
  stroke-linecap: round;
  fill: none;
}
.grass path {
  fill: none;
  stroke: color-mix(in srgb, var(--hill-near) 70%, #6f9e63);
  stroke-width: 2;
  opacity: 0.5;
}
.flowers .stem {
  stroke: color-mix(in srgb, var(--season-primary) 55%, #24331f);
  stroke-width: 1.6;
  opacity: 0.55;
}

/* 科技层：数据星图 */
.tech-net {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 58%;
  width: 100%;
  opacity: var(--tech-opacity);
  transition: opacity 1s ease;
}
.tech-links line {
  stroke: var(--tech-line);
  stroke-width: 1;
  opacity: 0.45;
}
.tech-nodes g {
  animation: node-pulse 6.4s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}
.tech-nodes .core {
  fill: var(--tech-line);
}
.tech-nodes .halo {
  fill: color-mix(in srgb, var(--tech-line) 40%, transparent);
}
@keyframes node-pulse {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(0.86);
  }
  50% {
    opacity: 1;
    transform: scale(1.12);
  }
}

/* 科技层：地面透视网格 */
.tech-grid {
  position: absolute;
  left: -12%;
  right: -12%;
  bottom: 0;
  height: 48%;
  background-image: repeating-linear-gradient(
      to right,
      var(--tech-line) 0 1px,
      transparent 1px 7%
    ),
    repeating-linear-gradient(to bottom, var(--tech-line) 0 1px, transparent 1px 34px);
  opacity: calc(var(--tech-opacity) * 0.85);
  transform: perspective(620px) rotateX(60deg);
  transform-origin: bottom center;
  mask-image: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent 80%);
  -webkit-mask-image: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent 80%);
  animation: grid-breathe 9s ease-in-out infinite;
  transition: opacity 1s ease;
}
@keyframes grid-breathe {
  0%,
  100% {
    filter: opacity(1);
  }
  50% {
    filter: opacity(0.68);
  }
}

/* 科技层：缓慢扫描光带 */
.scan {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 24%;
  background: linear-gradient(
    to bottom,
    transparent,
    color-mix(in srgb, var(--tech-line) 32%, transparent),
    transparent
  );
  opacity: calc(var(--tech-opacity) * 0.7);
  animation: scan-sweep 30s linear infinite;
  transition: opacity 1s ease;
}
@keyframes scan-sweep {
  from {
    transform: translateY(130%);
  }
  to {
    transform: translateY(-150%);
  }
}

/* 粒子 */
.particles span {
  position: absolute;
  top: -6%;
  animation-name: fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
@keyframes fall {
  to {
    transform: translateY(112vh) rotate(360deg);
  }
}
.p-spring span {
  background: #f4a6c0;
  border-radius: 50% 0 50% 50%;
  opacity: 0.85;
}
.p-summer span {
  background: #ffe08a;
  border-radius: 50%;
  opacity: 0.7;
  box-shadow: 0 0 8px rgba(255, 220, 120, 0.9);
}
.p-autumn span {
  background: #e08a4a;
  border-radius: 0 50% 0 50%;
  opacity: 0.85;
}
.p-winter span {
  background: #ffffff;
  border-radius: 50%;
  opacity: 0.9;
}

/* 色温叠加层 */
.overlay {
  position: absolute;
  inset: 0;
  background: var(--overlay-color);
  opacity: var(--overlay-opacity);
  transition: background 1s ease, opacity 1s ease;
}

/* 四角暗角 */
.vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 55%,
    rgba(0, 0, 0, 0.22) 100%
  );
}
</style>
