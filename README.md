<div align="center">

# 字里 · 公众号排版工作台

**把 Markdown 实时排成可直接粘贴到微信公众号编辑器的精致富文本**

六套精选模板 · 实时双栏预览 · 可视化模板设计器 · 一键复制到公众号

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-111827.svg)](https://www.gnu.org/licenses/agpl-3.0.html)
[![React](https://img.shields.io/badge/React-19-149ECA.svg?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev/)
[![Markdown](https://img.shields.io/badge/Input-Markdown-111827.svg?logo=markdown)](https://commonmark.org/)

</div>

> [!IMPORTANT]
> 本项目的六套内置公众号模板、主题设计体系与公众号兼容思路来源于 [isjiamu/gzh-design-skill](https://github.com/isjiamu/gzh-design-skill)。原项目由 **甲木 ×「摸鱼小李」** 联名共建，排版组件、主题设计与质量标准凝聚了两位作者的公众号实践与共同打磨。

## 项目介绍

`字里` 是一个面向微信公众号创作者的可视化 Markdown 排版网站。

你可以在浏览器中粘贴或编写 Markdown，选择文章模板，实时查看公众号手机端效果，最后点击一次按钮复制富文本，直接粘贴到微信公众号后台发布。

它将 [gzh-design-skill](https://github.com/isjiamu/gzh-design-skill) 中偏 Agent / 文件工作流的排版能力，转换成了普通用户也可以直接操作的 Web 工作台。

```mermaid
flowchart LR
    A["粘贴 Markdown"] --> B["选择或创建模板"]
    B --> C["实时查看公众号预览"]
    C --> D["复制富文本"]
    D --> E["粘贴到公众号后台"]
```

## ✨ 核心功能

- **Markdown 实时排版**：标题、段落、加粗、引用、列表、代码块、链接和图片实时转换。
- **六套内置模板**：摸鱼绿、红白编辑、石墨极简、留白禅意、摸鱼票据、橄榄手记。
- **公众号手机预览**：在编辑过程中直接查看接近公众号阅读页的实际效果。
- **一键复制富文本**：同时写入 `text/html` 和 `text/plain`，可直接粘贴到公众号后台。
- **全内联样式**：输出正文不依赖外部样式表，降低粘贴后格式丢失的概率。
- **可视化模板设计器**：独立配置主标题、章节标题、编号方式、引用组件、阅读密度和颜色。
- **模板实时预览**：创建模板时，右侧使用真实渲染器即时展示完整示例文章。
- **自定义模板持久化**：创建的模板保存在浏览器本地，刷新页面后仍可继续使用。
- **HTML 导出**：将排版后的完整文章保存为 HTML 文件。
- **写作辅助**：Markdown 工具栏、撤销/重做、自动保存、字数统计与专注模式。
- **响应式界面**：支持桌面端三栏工作台和移动端编辑/预览切换。

## 🎨 六套内置模板

六套模板来自 [gzh-design-skill](https://github.com/isjiamu/gzh-design-skill) 的主题体系：

| 模板 | 主色 | 推荐场景 |
| --- | --- | --- |
| 摸鱼绿 | `#059669` | 教程、测评、清单、工具盘点 |
| 红白编辑 | `#DC2626` | 深度分析、观点与力量感话题 |
| 石墨极简 | `#52525B` | 设计、科技评论、专业观点、高端品牌 |
| 留白禅意 | `#4A5D52` | 极简生活、深度随笔、安静叙事 |
| 摸鱼票据 | `#059669` | 工具对比、创意评测、产品清单 |
| 橄榄手记 | `#1E1F23` | 内刊手记、案例复盘、深度评测 |

> 原始主题的完整组件库、配方表和质量规范，请阅读 [gzh-design-skill 原仓库](https://github.com/isjiamu/gzh-design-skill)。

## 🧩 创建自己的模板

点击左侧模板栏底部的「添加模板」，即可创建六套内置模板之外的新模板。

模板设计器支持独立设置：

| 组件 | 可选规则 |
| --- | --- |
| 主标题 | 编辑横线、左侧色条、整块卡片、居中留白 |
| 章节标题 | 左侧锚点、深色标题、下划线、居中章节 |
| 章节编号 | `01 /`、`第一章`、`NO.01`、不编号 |
| 引用组件 | 浅色卡片、左侧引线、居中金句、深色摘要 |
| 阅读密度 | 紧凑、标准、舒展 |
| 视觉变量 | 主题色、正文色、卡片底色 |

创建过程中，右侧会使用与最终文章相同的渲染器实时展示完整公众号文章效果。保存后，新模板会作为独立模板加入模板列表。

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) `^20.19.0` 或 `>=22.12.0`
- npm 9 或更高版本

### 本地开发

```bash
# 克隆或下载本仓库后进入项目目录
cd gzh-design-web
npm install
npm run dev
```

浏览器访问：

```text
http://localhost:5173
```

### 生产构建

```bash
npm run build
```

构建产物会生成在 `dist/` 目录。

### 本地预览生产构建

```bash
npm run preview
```

## 📖 使用流程

1. 将 Markdown 文章粘贴到写作区。
2. 从左侧选择一套内置模板，或创建自己的模板。
3. 在右侧检查手机端文章效果。
4. 根据需要调整 Markdown、模板和阅读宽度。
5. 点击右上角「复制到公众号」。
6. 打开微信公众号后台编辑器并直接粘贴。

也可以点击「导出 HTML」，保存一份独立的排版结果。

## 📝 支持的 Markdown

````markdown
# 文章标题

> 一段需要被强调的引言或核心观点。

## 第一章节

这是正文，支持 **加粗关键词**、*斜体*、`行内代码` 和链接。

- 无序列表
- 第二个列表项

1. 有序步骤
2. 第二个步骤

```js
console.log('Hello WeChat');
```
````

项目使用 [Marked](https://marked.js.org/) 解析 Markdown，并使用 [DOMPurify](https://github.com/cure53/DOMPurify) 对生成内容进行清理。

## 🧩 公众号兼容策略

微信公众号编辑器会过滤部分 HTML 和 CSS。为了尽量保持复制后的排版效果，本项目对文章输出做了以下约束：

- 样式尽量写入元素的 `style` 属性。
- 正文使用语义化的 `section`、`h1`、`h2`、`p`、`blockquote`、`ul` 等标签。
- 文本节点使用 `<span leaf="">` 包裹。
- 输出正文不包含 `<style>`、`<script>` 和用于页面布局的 `<div>`。
- 不在文章正文中依赖 `class`、`id`、CSS 变量或外部字体。
- 复制时同时提供 HTML 富文本和纯文本格式。

> 不同公众号后台版本、浏览器和第三方插件可能存在差异。正式发布前建议在公众号编辑器中再次检查图片、代码块和长列表。

## 🛠 技术栈

| 技术 | 用途 |
| --- | --- |
| React | 编辑器、模板选择和状态管理 |
| Vite | 本地开发与生产构建 |
| Marked | Markdown 解析 |
| DOMPurify | HTML 内容清理 |
| Lucide React | 界面图标 |
| Clipboard API | 富文本复制 |
| Local Storage | 草稿与自定义模板持久化 |

## 📁 项目结构

```text
gzh-design-web/
├── src/
│   ├── App.jsx                    # 工作台与模板设计器
│   ├── main.jsx                   # 应用入口
│   ├── styles.css                 # 网站界面样式
│   └── lib/
│       ├── themes.js              # 六套内置模板配置
│       └── renderMarkdown.js      # Markdown → 公众号 HTML 渲染器
├── index.html
├── package.json
├── README.md
└── dist/                          # 生产构建产物
```

## 📜 可用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 本地预览生产构建 |

## 🔍 与 gzh-design-skill 的关系

[gzh-design-skill](https://github.com/isjiamu/gzh-design-skill) 是面向 Claude Code、Codex、Cursor 等 AI Agent 的公众号排版 Skill，包含主题组件库、Agent 工作流、主题生成器和确定性校验脚本。

本项目是基于其主题体系和公众号排版方法构建的可视化 Web 工作台，重点解决：

- 不使用 Agent 也能完成公众号排版。
- 在一个界面内编辑 Markdown、切换模板并实时预览。
- 通过浏览器直接复制公众号富文本。
- 用可视化组件规则创建新的文章模板。

本项目不是 `gzh-design-skill` 官方仓库的替代品。需要完整主题组件库、Agent 自动排版、主题生成工作流或校验脚本时，请使用原项目。

## 🙏 致谢与来源声明

本项目的六套内置模板、主题设计思路和公众号兼容方法来源于：

- [isjiamu/gzh-design-skill](https://github.com/isjiamu/gzh-design-skill)
- 原项目作者：**甲木 ×「摸鱼小李」**
- 原项目协议：[GNU AGPL-3.0](https://github.com/isjiamu/gzh-design-skill/blob/main/LICENSE)

感谢原作者将公众号排版组件、主题方法和实践经验开放出来。本项目在此基础上进行 Web 可视化实现，并保留来源说明与署名。

## 📄 License

本项目按照 **GNU Affero General Public License v3.0（AGPL-3.0）** 发布。

这意味着：

1. 必须保留原项目及本项目的版权与署名信息。
2. 修改、分发或二次开发版本应继续以 AGPL-3.0 或兼容协议开源。
3. 将修改版本作为网络服务提供时，也需要向服务使用者提供对应源代码。

请同时遵守 [gzh-design-skill 的许可证与署名要求](https://github.com/isjiamu/gzh-design-skill/blob/main/LICENSE)。

---