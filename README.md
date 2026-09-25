# Static_ · 个人博客

一个基于 **Vue 3 + Vite** 的纯静态个人博客，支持用 Markdown 写文章、自动生成文章列表与详情页，并可通过 **GitHub Actions 一键自动部署到 GitHub Pages**。

## 功能特性

- 📝 使用 Markdown 写作，放入 `posts/` 目录即自动成为一篇博文
- 🎨 明暗 × 四季 × 时段（黎明/白天/黄昏/夜晚/深夜）动态换肤，带粒子背景
- 📊 展示 GitHub 提交热力图
- 🕐 可交互的时间钟与日历，联动驱动页面季节与昼夜外观
- 🔗 头像、签名、GitHub / 邮箱 / 哔哩哔哩链接集中配置
- 🚀 GitHub Actions 自动构建并部署到 GitHub Pages

## 技术栈

| 工具 | 用途 |
| --- | --- |
| Vue 3 | 前端框架 |
| Vite | 构建工具 |
| vue-router | 路由（Hash 模式，静态托管下刷新不 404） |
| markdown-it | Markdown 解析 |
| highlight.js | 代码高亮 |
| chokidar | 开发时监听 `posts/` 文件变化 |

## 项目结构

```
StaticBlog/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml       # GitHub Actions 自动部署工作流
├── posts/                          # 博客文章（Markdown），增删改会实时生效
│   ├── images/                     # 文章内引用的图片（如 avatar.png）
│   ├── hello-world.md
│   └── ...
├── public/
│   └── favicon.ico                 # 站点图标
├── src/
│   ├── assets/                     # 头像、bilibili 图标等静态资源
│   │   ├── Avatar.jpg              # 首页个人头像
│   │   └── bilibili.svg
│   ├── components/                 # 页面组件（资料卡、日历、热力图、卡片等）
│   ├── composables/
│   │   └── useTheme.js             # 主题状态（季节/昼夜/时段）逻辑
│   ├── lib/
│   │   ├── markdown.js             # Markdown 渲染与 frontmatter 解析
│   │   ├── posts.js                # 汇总 posts/ 目录为博文数据
│   │   └── themeColors.js          # 依据 config 生成主题色 CSS 并注入 <head>
│   ├── router/
│   │   └── index.js                # 路由（hash 模式）
│   ├── views/                      # 首页 / 文章列表 / 文章详情
│   ├── App.vue
│   ├── config.js                   # 站点与个人信息集中配置（核心）
│   ├── main.js                     # 应用入口
│   └── style.css                   # 全局样式
├── index.html                      # HTML 模板（含 <title> 硬编码标题）
├── vite.config.js                  # Vite 配置（自动推导 base 路径）
├── vite-plugin-posts.js            # 自定义插件：读取并监听 posts/ 目录
└── package.json
```

## 快速开始（本地开发）

> 需要 Node.js `^22.18.0` 或 `>=24.12.0`（见 `package.json` 的 `engines`）。

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 构建生产产物到 dist/
npm run build

# 本地预览构建产物
npm run preview
```

开发时，在 `posts/` 目录新增、修改或删除 `.md` 文件，页面会自动刷新。

## 配置文件：`src/config.js`

站点与个人信息全部集中在 [src/config.js](src/config.js)，改这一处即可更新首页展示内容。

### 顶层字段

```js
export const siteConfig = {
  name: 'Static_',                    // 显示在首页的名字
  bio: '……',                          // 个人简介
  githubUsername: 'XD-xiao',          // GitHub 用户名，用于热力图接口
  signature: '保持好奇，保持热爱。',  // 首页打字机 + 手写下划线签名
  heatmapUrl: 'https://github-contributions-api.jogruber.de/v4/{username}', // 热力图接口，{username} 会自动替换
  links: {
    github: 'https://github.com/XD-xiao',
    email: '2822334610@qq.com',       // 首页点击可复制
    bilibili: 'https://space.bilibili.com/508591743',
  },
  theme: { /* 见下方 */ },
}
```

### `theme` 字段

```js
theme: {
  autoSeason: true,       // 是否跟随系统月份自动判定季节；关闭则使用 defaultSeason
  defaultSeason: 'autumn',// 手动模式下使用的默认季节（spring/summer/autumn/winter）
  particles: true,        // 是否启用背景粒子（花瓣/光斑/落叶/飘雪）
  colors: { /* 主题配色 */ },
}
```

### `theme.colors` 配色结构

配色采用「键名即 CSS 变量名」的方式，改动这些颜色即可换肤：

- `base`：基础配色（页面加载瞬间、无主题属性时的兜底值），含 `--bg`、`--surface`、`--text`、`--accent` 等。
- `light`：白昼模式下半透明玻璃表面。
- `dark`：夜间模式暗色表面与夜空。
- `seasons`：四季配色（白昼），`spring` / `summer` / `autumn` / `winter`，含天空、山丘、花朵、科技线等颜色。
- `darkSeasons`：四季配色（夜间，提亮以适配暗色底）。
- `periods`：时段配色（色温叠加层与云层色调），`dawn` / `day` / `dusk` / `night` / `late`。

> 注：背景场景 `src/components/ThemeBackground.vue` 内部还有少量硬编码颜色，不在此配置中；其余换肤色均在此处集中管理。

## 撰写博客文章

文章放在 `posts/` 目录下，使用 Markdown 编写，文件名（去除 `.md` 后缀）即为文章 URL 路径。支持通过 YAML 风格的 frontmatter 声明元信息：

```markdown
---
title: 你好，欢迎来到我的博客
date: 2026-09-01
description: 这是我的第一篇博文，介绍这个个人博客的由来与功能。
tags: [随笔, 介绍, 置顶]
---

# 你好，欢迎来到我的博客

正文内容……
```

frontmatter 支持的字段：

| 字段 | 说明 |
| --- | --- |
| `title` | 文章标题（不写则取正文第一个 `#` 标题） |
| `date` | 发布日期，用于列表排序 |
| `description` | 简介（不写则取正文首段前 120 字） |
| `tags` | 标签数组；其中包含 `置顶` 时文章置顶 |

文章内的图片使用相对路径引用，支持 `png / jpg / jpeg / gif（动图）/ webp / svg / bmp / ico / avif` 等格式，例如 `![头像](./images/avatar.png)`。

## Fork 后如何改造

Fork 本仓库后，按以下顺序把内容替换成你自己的：

1. **修改个人信息**：编辑 [src/config.js](src/config.js)，替换 `name`、`bio`、`githubUsername`、`signature`、`links` 等字段。
2. **修改站点标题**：编辑 [index.html](index.html) 中 `<title>` 标签（目前硬编码为「XD-xiao · 个人博客」），建议与 `config.js` 中的 `name` 保持一致。
3. **替换头像与图标**：
   - 首页头像 → 替换 `src/assets/Avatar.jpg`
   - 站点 favicon → 替换 `public/favicon.ico`
4. **替换文章**：清空或直接修改 `posts/` 目录下的 Markdown 文件，换成你自己的内容。
5. **（可选）调整热力图**：若使用其他贡献图服务，修改 `heatmapUrl`，保持 `{username}` 占位符即可。

## GitHub Actions 自动部署

项目已内置部署工作流 [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)：每当推送到 `main` 分支，会自动执行 `npm ci` → `npm run build`，并将 `dist/` 产物部署到 GitHub Pages；也可在仓库 Actions 页面手动触发。

### 首次启用步骤

1. 进入仓库 **Settings → Pages**。
2. 在 **Build and deployment → Source** 中选择 **GitHub Actions**。
3. 推送一次代码到 `main` 分支，触发部署。
4. 部署完成后，在 Actions 运行详情页的 `deploy` 任务里查看站点地址。

### base 路径自动推导

[vite.config.js](vite.config.js) 会根据 GitHub Actions 注入的 `GITHUB_REPOSITORY` 自动推导静态资源的 `base` 路径，因此**无需手工修改代码**即可适配两种站点形态：

| 仓库形态 | 仓库名示例 | base 路径 | 站点地址 |
| --- | --- | --- | --- |
| 用户站点 | `<用户名>.github.io` | `/` | `https://<用户名>.github.io/` |
| 项目站点 | 任意仓库名 | `/<仓库名>/` | `https://<用户名>.github.io/<仓库名>/` |

路由采用 Hash 模式，因此 GitHub Pages 下刷新或直达文章链接也不会出现 404。

## 许可证

[Apache License 2.0](LICENSE)
