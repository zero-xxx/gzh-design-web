import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check, Clipboard, Code2, Download, Eye, FileText,
  Heading1, Heading2, Image, Italic, List, ListOrdered,
  Maximize2, Minus, Moon, Quote, Redo2, RotateCcw, Smartphone,
  Sparkles, Sun, Undo2, X, Plus, Palette,
} from 'lucide-react'
import { defaultMarkdown, themes } from './lib/themes'
import { renderMarkdown } from './lib/renderMarkdown'

const STORAGE_KEY = 'gzh-design-draft-v1'
const CUSTOM_THEMES_KEY = 'gzh-design-custom-themes-v1'
const EMPTY_THEME_DRAFT = {
  name: '', description: '', accent: '#2563EB', text: '#1E293B', background: '#EFF6FF',
  titleStyle: 'editorial', sectionStyle: 'bar', numbering: 'decimal', quoteStyle: 'card', density: 'balanced',
}
const TEMPLATE_PREVIEW_MARKDOWN = `> 好的排版，让重要的内容自然被看见。

## 第一部分 · 从这里开始

这是一段用于观察正文节奏的示例文字。清晰的层级、恰当的留白，以及 **真正重要的关键词**，共同构成舒服的阅读体验。

### 一个小标题

- 标题建立阅读地图
- 引用突出核心观点
- 细节决定最终质感`

const mixHex = (hex, target = '#ffffff', weight = 0.8) => {
  const clean = hex.replace('#', '')
  const targetClean = target.replace('#', '')
  const values = [0, 2, 4].map((index) => {
    const from = parseInt(clean.slice(index, index + 2), 16)
    const to = parseInt(targetClean.slice(index, index + 2), 16)
    return Math.round(from + (to - from) * weight).toString(16).padStart(2, '0')
  })
  return `#${values.join('')}`
}

const decorateTheme = (theme) => ({
  ...theme,
  sampleTitle: theme.sampleTitle || ((theme.layout || theme.id) === 'moyu-ticket' ? 'TODAY’S ISSUE' : (theme.layout || theme.id) === 'olive-journal' ? 'FIELD NOTES' : (theme.layout || theme.id) === 'red-white' ? '编辑手记' : '把想法写成文章'),
})

function ThemeMiniature({ theme }) {
  const visualId = theme.layout || theme.id
  return (
    <div className={`theme-miniature miniature-${visualId}`} aria-hidden="true">
      <div className="mini-kicker">{theme.code} / EDITORIAL</div>
      <div className="mini-title">{theme.sampleTitle}</div>
      <div className="mini-rule" style={theme.custom ? { background: theme.accent } : undefined} />
      <div className="mini-line long" />
      <div className="mini-line" />
      <div className="mini-highlight" style={theme.custom ? { background: theme.accentSoft } : undefined} />
    </div>
  )
}

function ToolbarButton({ label, icon: Icon, onClick }) {
  return (
    <button className="tool-button" type="button" title={label} aria-label={label} onClick={onClick}>
      <Icon size={15} strokeWidth={1.8} />
    </button>
  )
}

function App() {
  const [markdown, setMarkdown] = useState(() => localStorage.getItem(STORAGE_KEY) || defaultMarkdown)
  const [themeId, setThemeId] = useState('moyu-green')
  const [activeTab, setActiveTab] = useState('edit')
  const [copied, setCopied] = useState(false)
  const [zenMode, setZenMode] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [previewMode, setPreviewMode] = useState('phone')
  const [customThemes, setCustomThemes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CUSTOM_THEMES_KEY) || '[]') } catch { return [] }
  })
  const [showThemeCreator, setShowThemeCreator] = useState(false)
  const [themeDraft, setThemeDraft] = useState(EMPTY_THEME_DRAFT)
  const [history, setHistory] = useState([markdown])
  const [historyIndex, setHistoryIndex] = useState(0)
  const textareaRef = useRef(null)
  const articleRef = useRef(null)

  const allThemes = useMemo(() => [...themes, ...customThemes], [customThemes])
  const templateCards = useMemo(() => allThemes.map(decorateTheme), [allThemes])
  const theme = allThemes.find((item) => item.id === themeId) || themes[0]
  const articleHtml = useMemo(() => renderMarkdown(markdown, theme), [markdown, theme])
  const charCount = markdown.replace(/\s/g, '').length
  const readingMinutes = Math.max(1, Math.ceil(charCount / 500))
  const draftPreviewTheme = useMemo(() => ({
    id: 'custom-preview', custom: true, layout: 'custom-independent', schemaVersion: 1,
    name: themeDraft.name || '未命名模板', code: 'NEW', description: themeDraft.description,
    accent: themeDraft.accent.toUpperCase(),
    accentSoft: mixHex(themeDraft.accent, '#ffffff', .68),
    tint: themeDraft.background.toUpperCase(),
    text: themeDraft.text.toUpperCase(),
    muted: mixHex(themeDraft.text, '#ffffff', .42),
    border: mixHex(themeDraft.accent, '#ffffff', .82),
    headingFont: "'Noto Serif SC','Songti SC',serif",
    bodyFont: "'Noto Sans SC','Microsoft YaHei',sans-serif",
    radius: '10px',
    layoutConfig: {
      titleStyle: themeDraft.titleStyle, sectionStyle: themeDraft.sectionStyle,
      numbering: themeDraft.numbering, quoteStyle: themeDraft.quoteStyle, density: themeDraft.density,
    },
  }), [themeDraft])
  const draftPreviewHtml = useMemo(() => renderMarkdown(`# ${themeDraft.name || '一篇正在成形的文章'}\n\n${TEMPLATE_PREVIEW_MARKDOWN}`, draftPreviewTheme), [draftPreviewTheme, themeDraft.name])

  useEffect(() => {
    const timer = window.setTimeout(() => localStorage.setItem(STORAGE_KEY, markdown), 350)
    return () => window.clearTimeout(timer)
  }, [markdown])

  useEffect(() => {
    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(customThemes))
  }, [customThemes])

  const addCustomTheme = (event) => {
    event.preventDefault()
    const name = themeDraft.name.trim()
    if (!name) return
    const accent = themeDraft.accent.toUpperCase()
    const customTheme = {
      id: `custom-${Date.now()}`,
      custom: true,
      layout: 'custom-independent',
      schemaVersion: 1,
      name,
      code: `C${customThemes.length + 1}`,
      description: themeDraft.description.trim() || '我的自定义公众号版式',
      accent,
      accentSoft: mixHex(accent, '#ffffff', .68),
      tint: themeDraft.background.toUpperCase(),
      text: themeDraft.text.toUpperCase(),
      muted: mixHex(themeDraft.text, '#ffffff', .42),
      border: mixHex(accent, '#ffffff', .82),
      headingFont: "'Noto Serif SC','Songti SC',serif",
      bodyFont: "'Noto Sans SC','Microsoft YaHei',sans-serif",
      radius: '10px',
      layoutConfig: {
        titleStyle: themeDraft.titleStyle,
        sectionStyle: themeDraft.sectionStyle,
        numbering: themeDraft.numbering,
        quoteStyle: themeDraft.quoteStyle,
        density: themeDraft.density,
      },
      preview: [accent, themeDraft.background, themeDraft.text],
      sampleTitle: name,
    }
    setCustomThemes((current) => [...current, customTheme])
    setThemeId(customTheme.id)
    setShowThemeCreator(false)
    setThemeDraft(EMPTY_THEME_DRAFT)
  }

  const commitMarkdown = (next) => {
    setMarkdown(next)
    setHistory((current) => [...current.slice(0, historyIndex + 1), next].slice(-50))
    setHistoryIndex((current) => Math.min(current + 1, 49))
  }

  const insertMarkdown = (before, after = '', placeholder = '文字') => {
    const input = textareaRef.current
    if (!input) return
    const start = input.selectionStart
    const end = input.selectionEnd
    const selection = markdown.slice(start, end) || placeholder
    const next = `${markdown.slice(0, start)}${before}${selection}${after}${markdown.slice(end)}`
    commitMarkdown(next)
    requestAnimationFrame(() => {
      input.focus()
      input.setSelectionRange(start + before.length, start + before.length + selection.length)
    })
  }

  const undo = () => {
    if (historyIndex <= 0) return
    const next = historyIndex - 1
    setHistoryIndex(next)
    setMarkdown(history[next])
  }

  const redo = () => {
    if (historyIndex >= history.length - 1) return
    const next = historyIndex + 1
    setHistoryIndex(next)
    setMarkdown(history[next])
  }

  const copyRichText = async () => {
    try {
      const plain = articleRef.current?.innerText || markdown
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({
          'text/html': new Blob([articleHtml], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        })
        await navigator.clipboard.write([item])
      } else {
        const range = document.createRange()
        range.selectNodeContents(articleRef.current)
        const selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(range)
        document.execCommand('copy')
        selection.removeAllRanges()
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setActiveTab('preview')
      articleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const downloadHtml = () => {
    const page = `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>公众号文章</title></head><body>${articleHtml}</body></html>`
    const url = URL.createObjectURL(new Blob([page], { type: 'text/html;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `公众号文章-${theme.name}.html`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const resetDraft = () => {
    if (markdown === defaultMarkdown || window.confirm('确定恢复示例内容吗？当前草稿会被替换。')) {
      commitMarkdown(defaultMarkdown)
    }
  }

  return (
    <div className={`app ${isDark ? 'dark' : ''} ${zenMode ? 'zen-mode' : ''}`}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="字里首页">
          <span className="brand-seal">字</span>
          <span className="brand-copy"><b>字里</b><small>公众号排版工作台</small></span>
        </a>
        <div className="topbar-center">
          <span className="status-dot" />
          <span>草稿已自动保存</span>
          <i />
          <span>{charCount.toLocaleString()} 字</span>
          <i />
          <span>约 {readingMinutes} 分钟阅读</span>
        </div>
        <div className="topbar-actions">
          <button className="icon-action" type="button" title="切换明暗" onClick={() => setIsDark((value) => !value)}>
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="export-button" type="button" onClick={downloadHtml}><Download size={15} /> 导出 HTML</button>
          <button className={`copy-button ${copied ? 'success' : ''}`} type="button" onClick={copyRichText}>
            {copied ? <Check size={16} /> : <Clipboard size={16} />}
            {copied ? '已复制，可去粘贴' : '复制到公众号'}
          </button>
        </div>
      </header>

      <main className="workspace" id="top">
        <aside className="theme-panel">
          <div className="panel-heading">
            <span className="eyebrow">TEMPLATES</span>
            <h2>选择版式</h2>
            <p>一篇文章，只用一种气质。</p>
          </div>
          <div className="theme-list">
            {templateCards.map((item) => (
              <button
                type="button"
                className={`theme-card ${item.id === themeId ? 'active' : ''}`}
                key={item.id}
                onClick={() => setThemeId(item.id)}
              >
                <ThemeMiniature theme={item} />
                <span className="theme-card-meta">
                  <span><b>{item.name}</b><em>{item.code}</em></span>
                  <small>{item.description}</small>
                </span>
                {item.id === themeId && <span className="theme-check"><Check size={12} /></span>}
              </button>
            ))}
          </div>
          <button className="add-theme-button" type="button" onClick={() => setShowThemeCreator(true)}>
            <span><Plus size={16} /></span>
            <span><b>添加模板</b><small>设计一套全新的文章模板</small></span>
          </button>
          <a className="source-link" href="https://github.com/isjiamu/gzh-design-skill" target="_blank" rel="noreferrer">
            <Code2 size={14} /> 基于 gzh-design-skill <span>↗</span>
          </a>
        </aside>

        <section className="editor-panel">
          <div className="mobile-tabs">
            <button type="button" className={activeTab === 'edit' ? 'active' : ''} onClick={() => setActiveTab('edit')}><FileText size={15} /> 编辑</button>
            <button type="button" className={activeTab === 'preview' ? 'active' : ''} onClick={() => setActiveTab('preview')}><Eye size={15} /> 预览</button>
          </div>
          <div className="editor-header">
            <div>
              <span className="eyebrow">MARKDOWN</span>
              <h2>写作区</h2>
            </div>
            <div className="editor-actions">
              <button type="button" onClick={resetDraft}><RotateCcw size={14} /> 恢复示例</button>
              <button type="button" onClick={() => setZenMode(true)}><Maximize2 size={14} /> 专注</button>
            </div>
          </div>
          <div className="markdown-toolbar">
            <ToolbarButton label="一级标题" icon={Heading1} onClick={() => insertMarkdown('# ', '', '一级标题')} />
            <ToolbarButton label="二级标题" icon={Heading2} onClick={() => insertMarkdown('## ', '', '二级标题')} />
            <span />
            <ToolbarButton label="加粗" icon={Sparkles} onClick={() => insertMarkdown('**', '**', '重点文字')} />
            <ToolbarButton label="斜体" icon={Italic} onClick={() => insertMarkdown('*', '*', '强调文字')} />
            <ToolbarButton label="引用" icon={Quote} onClick={() => insertMarkdown('> ', '', '引用内容')} />
            <ToolbarButton label="行内代码" icon={Code2} onClick={() => insertMarkdown('`', '`', 'code')} />
            <span />
            <ToolbarButton label="无序列表" icon={List} onClick={() => insertMarkdown('- ', '', '列表项')} />
            <ToolbarButton label="有序列表" icon={ListOrdered} onClick={() => insertMarkdown('1. ', '', '列表项')} />
            <ToolbarButton label="图片" icon={Image} onClick={() => insertMarkdown('![', '](https://example.com/image.jpg)', '图片说明')} />
            <ToolbarButton label="分割线" icon={Minus} onClick={() => insertMarkdown('\n---\n', '', '')} />
            <span className="toolbar-spacer" />
            <ToolbarButton label="撤销" icon={Undo2} onClick={undo} />
            <ToolbarButton label="重做" icon={Redo2} onClick={redo} />
          </div>
          <textarea
            ref={textareaRef}
            value={markdown}
            onChange={(event) => commitMarkdown(event.target.value)}
            className="markdown-input"
            spellCheck="false"
            aria-label="Markdown 编辑器"
          />
          <div className="editor-footer">
            <span>支持标准 Markdown 与 GFM</span>
            <span>{markdown.split(/\n/).length} 行 · {charCount.toLocaleString()} 字</span>
          </div>
        </section>

        <section className="preview-panel">
          <div className="preview-header">
            <div>
              <span className="eyebrow">WECHAT PREVIEW</span>
              <h2>发布预览</h2>
            </div>
            <div className="preview-controls">
              <button type="button" className={previewMode === 'phone' ? 'active' : ''} onClick={() => setPreviewMode('phone')} title="手机宽度"><Smartphone size={15} /></button>
              <button type="button" className={previewMode === 'wide' ? 'active' : ''} onClick={() => setPreviewMode('wide')} title="宽屏预览"><Maximize2 size={15} /></button>
            </div>
          </div>
          <div className="preview-stage">
            <div className={`phone-shell ${previewMode === 'wide' ? 'wide' : ''}`}>
              <div className="phone-chrome">
                <span>‹</span><b>公众号文章预览</b><span>•••</span>
              </div>
              <article ref={articleRef} className="article-canvas" dangerouslySetInnerHTML={{ __html: articleHtml }} />
            </div>
          </div>
          <div className="compatibility-note">
            <Check size={13} /> 已转换为内联样式富文本 <span>·</span> 可直接粘贴到公众号编辑器
          </div>
        </section>
      </main>

      {zenMode && (
        <div className="zen-editor">
          <button type="button" className="zen-close" onClick={() => setZenMode(false)}><X size={18} /> 退出专注</button>
          <div className="zen-title">只写此刻重要的事</div>
          <textarea value={markdown} onChange={(event) => commitMarkdown(event.target.value)} spellCheck="false" autoFocus />
          <div className="zen-stats">{charCount.toLocaleString()} 字 · 草稿自动保存</div>
        </div>
      )}

      {showThemeCreator && (
        <div className="theme-creator-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShowThemeCreator(false)}>
          <form className="theme-creator" onSubmit={addCustomTheme}>
            <div className="creator-heading">
              <span className="creator-icon"><Palette size={19} /></span>
              <div><span className="eyebrow">NEW TEMPLATE</span><h2>添加一套新模板</h2><p>独立设计组件规则，保存后成为内置六套之外的新模板。</p></div>
              <button type="button" aria-label="关闭" onClick={() => setShowThemeCreator(false)}><X size={18} /></button>
            </div>

            <div className="creator-workbench">
              <div className="creator-settings">
            <fieldset className="component-designer">
              <legend><span>01</span> 设计模板组件</legend>
              <p>这组规则将组成一套全新的模板，不依赖任何内置模板。</p>

              <div className="designer-row">
                <label>主标题</label>
                <div>{[
                  ['editorial', '编辑横线'], ['left', '左侧色条'], ['boxed', '整块卡片'], ['center', '居中留白'],
                ].map(([value, label]) => <button type="button" key={value} className={themeDraft.titleStyle === value ? 'active' : ''} onClick={() => setThemeDraft((draft) => ({ ...draft, titleStyle: value }))}>{label}</button>)}</div>
              </div>

              <div className="designer-row">
                <label>章节标题</label>
                <div>{[
                  ['bar', '左侧锚点'], ['solid', '深色标题'], ['underline', '下划线'], ['center', '居中章节'],
                ].map(([value, label]) => <button type="button" key={value} className={themeDraft.sectionStyle === value ? 'active' : ''} onClick={() => setThemeDraft((draft) => ({ ...draft, sectionStyle: value }))}>{label}</button>)}</div>
              </div>

              <div className="designer-row compact-row">
                <label>章节编号</label>
                <div>{[
                  ['decimal', '01 /'], ['chapter', '第一章'], ['no', 'NO.01'], ['none', '不编号'],
                ].map(([value, label]) => <button type="button" key={value} className={themeDraft.numbering === value ? 'active' : ''} onClick={() => setThemeDraft((draft) => ({ ...draft, numbering: value }))}>{label}</button>)}</div>
              </div>

              <div className="designer-row compact-row">
                <label>引用组件</label>
                <div>{[
                  ['card', '浅色卡片'], ['line', '左侧引线'], ['center', '居中金句'], ['dark', '深色摘要'],
                ].map(([value, label]) => <button type="button" key={value} className={themeDraft.quoteStyle === value ? 'active' : ''} onClick={() => setThemeDraft((draft) => ({ ...draft, quoteStyle: value }))}>{label}</button>)}</div>
              </div>

              <div className="designer-row compact-row">
                <label>阅读密度</label>
                <div>{[
                  ['compact', '紧凑'], ['balanced', '标准'], ['airy', '舒展'],
                ].map(([value, label]) => <button type="button" key={value} className={themeDraft.density === value ? 'active' : ''} onClick={() => setThemeDraft((draft) => ({ ...draft, density: value }))}>{label}</button>)}</div>
              </div>
            </fieldset>

            <div className="creator-fields">
              <div className="field-section-title"><span>02</span> 定义模板信息</div>
              <label className="wide"><span>模板名称</span><input value={themeDraft.name} onChange={(event) => setThemeDraft((draft) => ({ ...draft, name: event.target.value }))} placeholder="例如：雾蓝旅行手记" maxLength={12} autoFocus /></label>
              <label className="wide"><span>适用场景</span><input value={themeDraft.description} onChange={(event) => setThemeDraft((draft) => ({ ...draft, description: event.target.value }))} placeholder="例如：旅行随笔、城市观察" maxLength={28} /></label>
              <label className="color-field"><span>主题色</span><span className="color-control"><input type="color" value={themeDraft.accent} onChange={(event) => setThemeDraft((draft) => ({ ...draft, accent: event.target.value }))} /><code>{themeDraft.accent.toUpperCase()}</code></span></label>
              <label className="color-field"><span>正文色</span><span className="color-control"><input type="color" value={themeDraft.text} onChange={(event) => setThemeDraft((draft) => ({ ...draft, text: event.target.value }))} /><code>{themeDraft.text.toUpperCase()}</code></span></label>
              <label className="color-field"><span>卡片底色</span><span className="color-control"><input type="color" value={themeDraft.background} onChange={(event) => setThemeDraft((draft) => ({ ...draft, background: event.target.value }))} /><code>{themeDraft.background.toUpperCase()}</code></span></label>
            </div>
              </div>

              <aside className="template-live-preview">
                <div className="live-preview-heading">
                  <div><span>LIVE PREVIEW</span><b>公众号文章实时预览</b></div>
                  <i style={{ background: themeDraft.accent }} />
                </div>
                <div className="live-preview-device">
                  <div className="live-preview-chrome"><span>‹</span><b>文章预览</b><span>•••</span></div>
                  <div className="live-preview-viewport">
                    <article dangerouslySetInnerHTML={{ __html: draftPreviewHtml }} />
                  </div>
                </div>
                <p><span className="live-pulse" /> 修改左侧选项，文章效果会立即更新</p>
              </aside>
            </div>

            <div className="creator-actions">
              <button type="button" onClick={() => setShowThemeCreator(false)}>取消</button>
              <button type="submit" disabled={!themeDraft.name.trim()}><Plus size={15} /> 创建并应用</button>
            </div>
          </form>
        </div>
      )}

      {copied && <div className="toast"><span><Check size={15} /></span><div><b>富文本已复制</b><small>现在打开公众号后台，直接粘贴即可</small></div></div>}
    </div>
  )
}

export default App
