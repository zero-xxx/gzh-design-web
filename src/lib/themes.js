export const themes = [
  {
    id: 'moyu-green',
    name: '摸鱼绿',
    code: '01',
    description: '教程、清单与工具盘点',
    accent: '#059669',
    accentSoft: '#A7F3D0',
    underline: 'border-bottom:2px solid #A7F3D0;font-weight:600;',
    highlight: '#FDE68A',
    tint: '#ECFDF5',
    text: '#1F2937',
    muted: '#6B7280',
    border: '#D1FAE5',
    headingFont: "'Noto Serif SC','Songti SC',serif",
    bodyFont: "'Noto Sans SC','Microsoft YaHei',sans-serif",
    radius: '14px',
    preview: ['#059669', '#D1FAE5', '#F59E0B'],
  },
  {
    id: 'red-white',
    name: '红白编辑',
    code: '02',
    description: '观点、深度分析与力量感话题',
    accent: '#DC2626',
    accentSoft: '#FECACA',
    underline: 'border-bottom:2px solid #FECACA;font-weight:600;',
    highlight: '#FEE2E2',
    tint: '#FEF2F2',
    text: '#171717',
    muted: '#737373',
    border: '#E5E5E5',
    headingFont: "'Noto Serif SC','Songti SC',serif",
    bodyFont: "'Noto Sans SC','Microsoft YaHei',sans-serif",
    radius: '0px',
    preview: ['#DC2626', '#171717', '#F5F5F5'],
  },
  {
    id: 'graphite-minimal',
    name: '石墨极简',
    code: '03',
    description: '设计、科技与专业观点',
    accent: '#52525B',
    accentSoft: '#D4D4D8',
    underline: 'border-bottom:2px solid #52525B;font-weight:600;',
    highlight: '#F4F4F5',
    tint: '#F4F4F5',
    text: '#27272A',
    muted: '#71717A',
    border: '#E4E4E7',
    headingFont: "'Noto Serif SC','Songti SC',serif",
    bodyFont: "'Noto Sans SC','Microsoft YaHei',sans-serif",
    radius: '4px',
    preview: ['#27272A', '#A1A1AA', '#F4F4F5'],
  },
  {
    id: 'zen-whitespace',
    name: '留白禅意',
    code: '04',
    description: '生活、随笔与安静叙事',
    accent: '#4A5D52',
    accentSoft: '#B5C8BC',
    underline: 'border-bottom:1.5px solid #B5C8BC;font-weight:500;',
    highlight: '#E7EEE9',
    tint: '#F3F5F2',
    text: '#303B34',
    muted: '#7A857E',
    border: '#DDE4DF',
    headingFont: "'Noto Serif SC','Songti SC',serif",
    bodyFont: "'Noto Serif SC','Songti SC',serif",
    radius: '2px',
    preview: ['#4A5D52', '#B5C8BC', '#F5F1E8'],
  },
  {
    id: 'moyu-ticket',
    name: '摸鱼票据',
    code: '05',
    description: '测评、工具对比与创意清单',
    accent: '#059669',
    accentSoft: '#A7F3D0',
    underline: 'border-bottom:2px solid #A7F3D0;font-weight:600;',
    highlight: '#FEF3C7',
    tint: '#F0FDF4',
    text: '#1C1917',
    muted: '#78716C',
    border: '#1C1917',
    headingFont: "'Noto Sans SC','Microsoft YaHei',sans-serif",
    bodyFont: "'Noto Sans SC','Microsoft YaHei',sans-serif",
    radius: '0px',
    preview: ['#059669', '#1C1917', '#FEF3C7'],
  },
  {
    id: 'olive-journal',
    name: '橄榄手记',
    code: '06',
    description: '内刊、案例复盘与深度评测',
    accent: '#1E1F23',
    accentSoft: '#ED7B2F',
    underline: 'border-bottom:2px solid #ED7B2F;font-weight:600;',
    highlight: '#F5D8A8',
    secondary: '#6B7456',
    tint: '#F3F1E8',
    text: '#1E1F23',
    muted: '#6B6A64',
    border: '#D8D2C3',
    headingFont: "'Noto Serif SC','Songti SC',serif",
    bodyFont: "'Noto Sans SC','Microsoft YaHei',sans-serif",
    radius: '3px',
    preview: ['#1E1F23', '#6B7456', '#ED7B2F'],
  },
]

export const defaultMarkdown = `# 把想法，排成一篇好文章

> 真正舒服的阅读，不只来自文字本身，也来自 ==节奏、留白与层次==。

这是一个为微信公众号准备的 **Markdown 排版工作台**。你只需要专注写作，剩下的交给模板。

## 为什么要认真对待排版？

读者打开文章后的前几秒，就在判断是否继续。清楚的层级、恰当的留白和克制的强调，会让复杂内容变得更容易理解。

- 标题负责建立阅读地图
- 正文保持稳定、舒适的节奏
- **关键词**只在真正重要时出现
- 引用让核心观点被记住

## 三步完成一次发布

### 01 · 粘贴内容

把 Markdown 放进左侧编辑器。标题、列表、引用、代码和图片都会被自动识别。

### 02 · 选择模板

每套模板有自己的气质，但都遵循公众号兼容规则：样式内联、结构克制。

### 03 · 复制发布

点击右上角的「复制到公众号」，然后直接粘贴到公众号后台编辑器。

| 排版组件 | 使用方式 | 公众号兼容 |
| --- | --- | --- |
| 关键词高亮 | ==重要观点== | 内联样式 |
| 重点下划线 | ++值得记住++ | span leaf |
| Markdown 表格 | GFM 表格语法 | 主题表格组件 |

\`\`\`javascript
const idea = '写作';
const design = '排版';
console.log(idea + ' × ' + design);
\`\`\`

## 写在最后

愿每一个认真写下的想法，都能被舒服地读到。真正好的排版，会让重要内容自然浮现。

---

我是文章作者，热衷于分享认真写作与审美观察。`
