import { Marked } from 'marked'
import DOMPurify from 'dompurify'
import { commonLibrary, findSkillComponent, getSkillLibrary, getSkillStats } from './skillSources'

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

const leaf = (value = '') => `<span leaf="">${escapeHtml(value)}</span>`
const decoratedLeaf = (style, value) => `<span style="${style}">${leaf(value)}</span>`
const conclusionPattern = /结语|总结|最后|写在最后|尾声|后记|小结|结束|conclusion|summary/i
const authorPattern = /^(?:我是|作者[：:]|撰文[：:]|文[：:]|关于作者)/
const punctuationPattern = /[，。！？；：、\n]/

const DEFAULT_OPTIONS = {
  cover: true,
  introduction: true,
  tableOfContents: true,
  autoKeywords: true,
  authorCard: true,
  fullWidthPunctuation: true,
  author: '',
  authorBio: '',
}

function extension(name, delimiter) {
  const escaped = delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`^${escaped}([^\\n]+?)${escaped}`)

  return {
    name,
    level: 'inline',
    start(source) { return source.indexOf(delimiter) },
    tokenizer(source) {
      const match = pattern.exec(source)
      if (!match) return undefined
      return { type: name, raw: match[0], text: match[1], tokens: this.lexer.inlineTokens(match[1]) }
    },
    renderer() { return false },
  }
}

const markdownParser = new Marked({
  gfm: true,
  breaks: true,
  extensions: [extension('highlight', '=='), extension('underline', '++')],
})

function normalizeProse(value, enabled = true) {
  if (!enabled) return value
  return value
    .replace(/(?<=[\u3400-\u9fff])[,:;!?](?=\s*[\u3400-\u9fff])/g, (mark) => ({
      ',': '，', ':': '：', ';': '；', '!': '！', '?': '？',
    }[mark]))
    .replace(/(?<=[\u3400-\u9fff])\.(?=\s*[\u3400-\u9fff])/g, '。')
}

function applyTemplate(template, replacements = {}) {
  if (!template) return ''
  return template
    .replace(/<!--[^]*?-->/g, '')
    .replace(/\{\{([^}]+)\}\}/g, (_, key) => escapeHtml(replacements[key.trim()] ?? ''))
    .replace(/<p\b[^>]*>\s*<span leaf="">\s*(?:——\s*)?<\/span>\s*<\/p>/g, '')
    .trim()
}

function sourceStyle(template, tag = 'section', fallback = '') {
  return template?.match(new RegExp(`<${tag}\\b[^>]*\\bstyle="([^"]*)"`, 'i'))?.[1] || fallback
}

function sourceTextStyle(template, fallback = '') {
  return sourceStyle(template, 'p', fallback)
}

function englishLabel(title) {
  const mapping = [
    [/教程|步骤|操作|指南|入门|上手/, 'TUTORIAL'],
    [/工具|盘点|清单|推荐/, 'TOOLS'],
    [/实测|测试|评测|测评/, 'REVIEW'],
    [/案例|实践|实战/, 'CASE STUDY'],
    [/对比|比较|区别/, 'COMPARISON'],
    [/数据|指标|报告/, 'DATA INSIGHT'],
    [/原理|为什么|思考|观点/, 'THOUGHTS'],
    [conclusionPattern, 'EPILOGUE'],
  ]
  return mapping.find(([pattern]) => pattern.test(title))?.[1] || 'CHAPTER NOTES'
}

function classifyArticle(tokens) {
  const headings = tokens.filter((token) => token.type === 'heading').map((token) => token.text).join(' ')
  const body = tokens.map((token) => token.text || '').join(' ')
  if (/教程|指南|步骤|安装|配置|使用方法/.test(headings + body) || tokens.some((token) => token.type === 'code')) return '教程 / 操作指南'
  if (/测评|对比|工具|推荐|盘点|清单/.test(headings)) return '盘点 / 工具清单'
  if (tokens.some((token) => token.type === 'table') || /数据|报告|复盘|指标/.test(headings)) return '数据复盘 / 报告'
  if (/采访|访谈|对话|人物/.test(headings)) return '访谈 / 人物特稿'
  if (/案例|实战|实践/.test(headings)) return '案例实战'
  return '观点 / 深度分析'
}

function findKeyword(text) {
  const candidates = text.split(punctuationPattern)
    .flatMap((part) => part.split(/[（）「」“”"\s]+/))
    .map((part) => part.trim())
    .filter((part) => part.length >= 4)
    .map((part) => {
      const semantic = part.match(/(?:真正|核心|关键|重要|本质|最大|最强|必须|可以|能够|负责|决定|意味着|不是|而是|为了|通过|支持|提升|降低|实现|构成|完成|生成|自动|复杂|稳定|高质量)[^，。！？；：、]{2,12}/)?.[0]
      const concept = part.match(/[A-Za-z][A-Za-z0-9 +./-]{2,18}|\d+(?:\.\d+)?(?:%|倍|个|项|种|天|小时)/)?.[0]
      const phrase = semantic || concept || part.slice(0, Math.min(part.length, 12))
      return { phrase, score: (semantic ? 6 : 0) + (concept ? 4 : 0) + Math.min(part.length, 18) / 10 }
    })
    .filter(({ phrase }) => phrase.length >= 4 && phrase.length <= 18)
    .sort((left, right) => right.score - left.score)
  return candidates[0]?.phrase
}

function renderText(text, context, { autoKeyword = false } = {}) {
  const normalized = normalizeProse(text || '', context.options.fullWidthPunctuation)
  if (!autoKeyword || !context.options.autoKeywords || normalized.length < 16 || context.paragraphMarks >= 2) return leaf(normalized)
  const keyword = findKeyword(normalized)
  if (!keyword) return leaf(normalized)
  const offset = normalized.indexOf(keyword)
  if (offset < 0) return leaf(normalized)
  context.paragraphMarks += 1
  context.keywordCount += 1
  return `${leaf(normalized.slice(0, offset))}${decoratedLeaf(context.theme.underline, keyword)}${leaf(normalized.slice(offset + keyword.length))}`
}

function renderInline(tokens = [], context, { autoKeyword = false } = {}) {
  let html = ''
  let underlineOpen = false

  for (const token of tokens) {
    if (token.type === 'text' || token.type === 'escape') {
      html += renderText(token.text, context, { autoKeyword: autoKeyword && !underlineOpen })
    } else if (token.type === 'strong') {
      html += `<span style="color:${context.theme.accent};font-weight:750;">${renderInline(token.tokens, context)}</span>`
    } else if (token.type === 'highlight') {
      html += `<span style="background:linear-gradient(120deg,${context.theme.highlight || context.theme.accentSoft} 0%,rgba(255,255,255,0) 100%);padding:1px 4px;border-radius:3px;font-weight:650;color:${context.theme.text};">${renderInline(token.tokens, context)}</span>`
    } else if (token.type === 'underline') {
      html += `<span style="${context.theme.underline}">${renderInline(token.tokens, context)}</span>`
    } else if (token.type === 'em') {
      html += `<span style="font-style:italic;color:${context.theme.muted};">${renderInline(token.tokens, context)}</span>`
    } else if (token.type === 'del') {
      html += `<span style="background:${context.theme.tint};color:${context.theme.muted};padding:1px 4px;border-radius:3px;text-decoration:line-through;">${renderInline(token.tokens, context)}</span>`
    } else if (token.type === 'codespan') {
      html += decoratedLeaf(`background:${context.theme.tint};color:${context.theme.accent};padding:2px 6px;border-radius:4px;font-family:Consolas,Monaco,monospace;font-size:13px;`, token.text)
    } else if (token.type === 'link') {
      html += `<a href="${escapeHtml(token.href)}" style="color:${context.theme.accent};border-bottom:1px solid ${context.theme.accentSoft};text-decoration:none;">${renderInline(token.tokens, context)}</a>`
    } else if (token.type === 'image') {
      html += renderImage(token, context)
    } else if (token.type === 'br') {
      html += '<br>'
    } else if (token.type === 'html') {
      if (/^<u(?:\s[^>]*)?>$/i.test(token.text)) {
        html += `<span style="${context.theme.underline}">`
        underlineOpen = true
      } else if (/^<\/u>$/i.test(token.text)) {
        html += '</span>'
        underlineOpen = false
      } else {
        html += leaf(token.text)
      }
    } else if (token.tokens) {
      html += renderInline(token.tokens, context, { autoKeyword })
    } else if (token.text) {
      html += leaf(token.text)
    }
  }
  return underlineOpen ? `${html}</span>` : html
}

function paragraphStyle(context) {
  const template = findSkillComponent(context.theme, /正文段落(?:\s|$)|richtext-paragraph|paragraph/)?.template
  const fallback = `margin:0 0 18px;font-size:15px;line-height:1.9;text-align:justify;color:${context.theme.text};`
  const original = sourceTextStyle(template, fallback)
  const density = context.theme.layoutConfig?.density
  if (!density) return original
  return `${original}margin-bottom:${density === 'compact' ? 13 : density === 'airy' ? 24 : 18}px;line-height:${density === 'compact' ? 1.75 : density === 'airy' ? 2.1 : 1.9};`
}

function renderParagraph(token, context, { autoKeyword = true } = {}) {
  context.paragraphMarks = 0
  return `<p style="${paragraphStyle(context)}">${renderInline(token.tokens || [], context, { autoKeyword })}</p>`
}

function coverTitleParts(title) {
  const clean = title.replace(/[，。！？：；、]/g, ' ').trim()
  const words = clean.split(/\s+/).filter(Boolean)
  if (words.length > 1) return [words.slice(0, -1).join(' '), words.at(-1)]
  const pivot = Math.max(2, Math.ceil(clean.length * 0.58))
  return [clean.slice(0, pivot), clean.slice(pivot)]
}

function renderCover(title, context) {
  if (!title) return ''
  const [first, second] = coverTitleParts(title)
  const date = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit' }).format(new Date()).replace('/', '.')
  const layout = context.theme.sourceTheme || context.theme.layout || context.theme.id
  const replacements = {
    顶部标签: englishLabel(title), 日期: date, 划线旧认知: '',
    主标题行1: first, 绿色高亮词: second, 主标题行2: '',
    副标题关键词: context.articleType, 底部左侧文字: 'EDITORIAL NOTES', 标签1: 'READ', 标签2: 'SHARE',
    头部标签: 'EDITORIAL ISSUE', 大标题: title, 副标题: context.articleType,
    作者名: context.options.author || '文章作者', 作者身份: context.options.authorBio || '内容创作者',
    简介段落: context.introductionText || '一篇值得认真阅读的内容。',
    '#标签1': '#阅读', '#标签2': '#思考', '#标签3': '#记录', 编号: '001', 竖排文字: '深度阅读', 等级: 'S',
    内刊标签: 'FIELD NOTES', 旧标题占位: '', 主标题: first, 强调词: second || '编辑手记',
    副标题说明: context.articleType, 底部摘要: context.introductionText?.slice(0, 34) || '记录值得分享的观察与思考',
  }

  if (!context.options.cover) {
    return `<section style="padding:24px 20px 18px;"><h1 style="margin:0;font-size:24px;line-height:1.55;font-weight:850;color:${context.theme.text};">${leaf(title)}</h1></section>`
  }

  if (layout === 'moyu-green') {
    const template = findSkillComponent(context.theme, /封面 cover-breaking/, { variant: 1 })?.template
    return applyTemplate(template, replacements)
      .replace(/<p[^>]*text-decoration:line-through[^>]*>\s*<span leaf="">\s*<\/span>\s*<\/p>/, '')
      .replace(/<p[^>]*font-size:24px[^>]*>\s*<span leaf="">\s*<\/span>\s*<\/p>/, '')
  }
  if (layout === 'moyu-ticket') return applyTemplate(findSkillComponent(context.theme, /票据封面/)?.template, replacements)
  if (layout === 'olive-journal') {
    return applyTemplate(findSkillComponent(context.theme, /头图卡 hero-card/)?.template, replacements)
      .replace(/<p[^>]*text-decoration:line-through[^>]*>\s*<span leaf="">\s*<\/span>\s*<\/p>/, '')
  }

  const density = context.theme.layoutConfig?.density
  const center = layout === 'zen-whitespace' || context.theme.layoutConfig?.titleStyle === 'center'
  const titleRule = context.theme.layoutConfig?.titleStyle
  const border = titleRule === 'left'
    ? `border-left:6px solid ${context.theme.accent};padding-left:16px;`
    : titleRule === 'boxed'
      ? `padding:20px;background:${context.theme.tint};border:1px solid ${context.theme.border};border-radius:${context.theme.radius};`
      : `border-bottom:${layout === 'red-white' ? '3px' : '1px'} solid ${layout === 'red-white' ? context.theme.accent : context.theme.border};padding-bottom:20px;`
  return `<section style="padding:${density === 'airy' ? '42px 20px 30px' : '28px 16px 24px'};${center ? 'text-align:center;' : ''}"><p style="margin:0 0 11px;color:${context.theme.accent};font-size:10px;font-weight:700;letter-spacing:3px;">${leaf(englishLabel(title))}</p><h1 style="margin:0;font-family:${context.theme.headingFont};font-size:24px;font-weight:850;line-height:1.55;color:${context.theme.text};${border}">${leaf(title)}</h1></section>`
}

function introStyle(context) {
  const custom = context.theme.layoutConfig?.quoteStyle
  if (custom === 'line') return `margin:22px 16px 28px;padding:12px 0 12px 18px;border-left:4px solid ${context.theme.accent};`
  if (custom === 'center') return `margin:26px 16px 34px;padding:30px 22px;text-align:center;border-top:1px solid ${context.theme.border};border-bottom:1px solid ${context.theme.border};`
  if (custom === 'dark') return `margin:22px 16px 30px;padding:23px;background:${context.theme.text};color:#FFFFFF;border-radius:${context.theme.radius};`
  const matcher = context.theme.id === 'olive-journal' ? /编者按 editors-note/ : /开头引言卡片|oneliner-card|重点观点卡/
  return sourceStyle(findSkillComponent(context.theme, matcher)?.template, 'section', `margin:22px 16px 30px;padding:20px;background:${context.theme.tint};border-left:3px solid ${context.theme.accent};`)
}

function renderIntroduction(token, context) {
  if (!token || !context.options.introduction) return ''
  const tokens = token.tokens?.flatMap((part) => part.tokens || []) || []
  const dark = context.theme.layoutConfig?.quoteStyle === 'dark'
  context.paragraphMarks = 0
  return `<section style="${introStyle(context)}"><p style="font-size:10px;color:${dark ? '#FFFFFFB3' : context.theme.accent};letter-spacing:2px;margin:0 0 12px;font-weight:700;">${leaf(context.theme.id === 'olive-journal' ? 'EDITOR’S NOTE' : 'OPENING QUOTE')}</p><p style="font-size:${context.theme.id === 'zen-whitespace' ? 19 : 16}px;line-height:1.85;font-weight:650;color:${dark ? '#FFFFFF' : context.theme.text};margin:0;">${renderInline(tokens, context, { autoKeyword: true })}</p>${context.options.author ? `<p style="margin:14px 0 0;text-align:right;color:${dark ? '#FFFFFFAA' : context.theme.muted};font-size:12px;">${leaf(`—— ${context.options.author}`)}</p>` : ''}</section>`
}

function renderTableOfContents(headings, context) {
  if (!context.options.tableOfContents || headings.length < 2) return ''
  const selection = headings.slice(0, 3)
  const layout = context.theme.sourceTheme || context.theme.layout || context.theme.id

  if (selection.length === 3 && ['red-white', 'graphite-minimal'].includes(layout)) {
    const template = findSkillComponent(context.theme, /前言导读区域/)?.template
    return applyTemplate(template, { 看点一: selection[0].text, 看点二: selection[1].text, 看点三: selection[2].text })
  }
  if (selection.length === 3 && layout === 'zen-whitespace') {
    return findSkillComponent(context.theme, /前言导读区域/)?.template
      .replace('第一个要点', escapeHtml(selection[0].text))
      .replace('第二个要点', escapeHtml(selection[1].text))
      .replace('第三个要点', escapeHtml(selection[2].text)) || ''
  }

  const ticket = layout === 'moyu-ticket'
  const olive = layout === 'olive-journal'
  const items = selection.map((heading, index) => {
    const selected = index === 0
    const background = selected ? context.theme.accent : olive ? '#F5F4EE' : '#FFFFFF'
    const foreground = selected ? '#FFFFFF' : context.theme.text
    return `<section style="flex:1;min-width:0;padding:${ticket ? '11px 8px' : '14px 10px'};background:${background};border:1px solid ${context.theme.border};border-radius:${ticket ? '0' : context.theme.radius};"><p style="margin:0 0 7px;font-size:10px;letter-spacing:1px;color:${selected ? '#FFFFFFB8' : context.theme.muted};">${leaf(`PART ${String(index + 1).padStart(2, '0')}`)}</p><p style="margin:0;font-size:12px;line-height:1.6;font-weight:700;color:${foreground};">${leaf(heading.text.slice(0, 18))}</p></section>`
  }).join('')
  return `<section style="margin:0 14px 30px;"><p style="margin:0 0 12px;color:${context.theme.muted};font-size:11px;letter-spacing:1px;">${leaf('本文看点 · CONTENTS')}</p><section style="display:flex;gap:8px;">${items}</section></section>`
}

function chapterNumber(index, heading, total, context) {
  if (index === total && conclusionPattern.test(heading)) return context.theme.id === 'moyu-green' ? '///' : '∞'
  const config = context.theme.layoutConfig?.numbering
  if (config === 'none') return ''
  if (config === 'chapter') return `第${['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][index - 1] || index}章`
  if (config === 'no') return `NO.${String(index).padStart(2, '0')}`
  return String(index).padStart(2, '0')
}

function renderChapter(token, context) {
  context.chapterIndex += 1
  const number = chapterNumber(context.chapterIndex, token.text, context.headings.length, context)
  const label = englishLabel(token.text)
  const template = findSkillComponent(context.theme, /章节标题(?:组件)?(?:\s|（)|chapter-title|section-title/)?.template
  if (!context.theme.custom && template) {
    return applyTemplate(template, {
      '01': number, 编号: number, 标题: token.text, 中文标题: token.text, 中文章节标题: token.text,
      'ENGLISH TAG': label, 'ENGLISH · 英文副标题': label, 副标题: label,
    })
      .replace(/(<span leaf="">)01(<\/span>)/, `$1${escapeHtml(number)}$2`)
      .replace('01 · CHAPTER ONE', escapeHtml(`${number} · ${label}`))
      .replace('中文章节大标题', escapeHtml(token.text))
      .replace(/margin-top:\s*(?:48|56|64)px/, `margin-top:${context.chapterIndex === 1 ? 18 : context.theme.id === 'zen-whitespace' ? 56 : 42}px`)
  }

  const style = context.theme.layoutConfig?.sectionStyle
  const decoration = style === 'solid'
    ? `background:${context.theme.text};color:#FFFFFF;padding:12px 15px;`
    : style === 'underline'
      ? `border-bottom:2px solid ${context.theme.accent};padding-bottom:9px;`
      : style === 'center'
        ? 'text-align:center;'
        : `border-left:4px solid ${context.theme.accent};padding-left:13px;`
  return `<section style="margin:${context.chapterIndex === 1 ? 18 : 42}px 14px 22px;"><p style="margin:0 0 6px;font-size:10px;letter-spacing:2px;color:${context.theme.accent};">${leaf(`${number} ${label}`.trim())}</p><h2 style="margin:0;font-family:${context.theme.headingFont};font-size:20px;font-weight:800;line-height:1.6;${decoration}">${leaf(token.text)}</h2></section>`
}

function renderSubheading(token, context) {
  const template = findSkillComponent(context.theme, /子标题|小节标题 subtitle|step-heading-inline|subtitle-highlight/)?.template
  const original = sourceTextStyle(template, `margin:25px 0 12px;font-size:16px;font-weight:750;line-height:1.6;border-left:3px solid ${context.theme.accent};padding-left:10px;`)
  return `<p style="${original}">${leaf(token.text)}</p>`
}

function renderQuote(token, context) {
  const warning = /^(提示|注意|警告|重点|旁注|TIP|NOTE|WARNING)[：:]/i.test(token.text || '')
  const match = warning
    ? /提示条|提示块|warn-tip|green-tip|编者按 editors-note/
    : /金句引用|quote-box|重点观点卡|居中衬线大字引用|核心观点卡片/
  const component = findSkillComponent(context.theme, match)
  const style = sourceStyle(component?.template, 'section', `margin:20px 0;padding:17px 19px;background:${context.theme.tint};border-left:3px solid ${context.theme.accent};border-radius:${context.theme.radius};`)
  const title = warning ? `<p style="margin:0 0 8px;font-size:11px;color:${context.theme.accent};font-weight:750;letter-spacing:1px;">${leaf('EDITOR NOTE')}</p>` : ''
  const parts = (token.tokens || []).map((entry) => {
    if (entry.type === 'paragraph') {
      context.paragraphMarks = 0
      return `<p style="margin:0 0 5px;font-size:15px;font-weight:${warning ? 500 : 650};line-height:1.85;color:${context.theme.text};">${renderInline(entry.tokens, context, { autoKeyword: true })}</p>`
    }
    return renderBlock(entry, context)
  }).join('')
  return `<section style="${style}">${title}${parts}</section>`
}

function renderCode(token) {
  const source = commonLibrary.components.find((component) => /^1a\./.test(component.title))?.template
  const rootStyle = sourceStyle(source, 'section', 'margin:0 0 20px;border-radius:8px;overflow:hidden;background:#1E293B;')
  const dots = ['#FF5F56', '#FFBD2E', '#27C93F'].map((color) => `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${color};margin-right:7px;font-size:0;line-height:0;">${leaf('·')}</span>`).join('')
  const rows = token.text.split('\n').map((row) => {
    const indent = row.match(/^\s*/)?.[0].replace(/\t/g, '    ').replace(/ {2}/g, '　').replace(/ /g, '\u00a0') || ''
    const code = indent + row.trimStart()
    return `<p style="margin:0;font-family:Consolas,Monaco,monospace;font-size:13px;line-height:1.65;color:#E2E8F0;word-break:break-all;">${leaf(code || '\u00a0')}</p>`
  }).join('')
  return `<section style="${rootStyle}"><section style="display:flex;align-items:center;padding:9px 14px;background:#0F172A;">${dots}${token.lang ? decoratedLeaf('margin-left:8px;font-size:11px;color:#94A3B8;font-family:Consolas,Monaco,monospace;letter-spacing:1px;', token.lang) : ''}</section><section style="padding:11px 14px;">${rows}</section></section>`
}

function renderImage(token, context) {
  const href = token.href || ''
  const caption = token.text || ''
  const gif = /\.gif(?:[?#].*)?$/i.test(href) || /动图|GIF/i.test(caption)
  const template = findSkillComponent(context.theme, /图片容器|image-card|image-ticket/)?.template
  const style = sourceStyle(template, 'section', `margin:22px 0;border-radius:${context.theme.radius};overflow:hidden;`)
  const badge = gif ? `${decoratedLeaf(`display:inline-block;background:${context.theme.tint};color:${context.theme.accent};font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;margin-right:6px;`, 'GIF 动图')}` : ''
  const description = caption || gif ? `<p style="margin:9px 0 0;text-align:center;color:${context.theme.muted};font-size:12px;line-height:1.7;">${badge}${caption ? leaf(caption) : ''}</p>` : ''
  return `<section style="${style}"><img src="${escapeHtml(href)}" alt="${escapeHtml(caption)}" style="display:block;width:100%;height:auto;border-radius:${context.theme.radius};">${description}</section>`
}

function listItemContent(item, context) {
  const parts = (item.tokens || []).filter((token) => token.type !== 'checkbox')
  return parts.map((token) => {
    if (token.type === 'text') return renderInline(token.tokens || [token], context, { autoKeyword: false })
    if (token.type === 'paragraph') return renderInline(token.tokens || [], context, { autoKeyword: false })
    return renderBlock(token, context)
  }).join('')
}

function renderList(token, context) {
  const items = token.items.map((item, index) => {
    const task = item.task ? (item.checked ? '☑' : '☐') : ''
    const marker = token.ordered ? String((Number(token.start) || 1) + index).padStart(2, '0') : task || '•'
    const markerStyle = token.ordered
      ? `min-width:25px;height:25px;display:inline-block;text-align:center;background:${context.theme.tint};color:${context.theme.accent};border-radius:${context.theme.id === 'moyu-ticket' ? '2px' : '50%'};font-size:11px;font-weight:750;line-height:25px;`
      : `min-width:18px;color:${context.theme.accent};font-size:${item.task ? 15 : 18}px;font-weight:700;line-height:1.5;`
    return `<section style="display:flex;align-items:flex-start;gap:10px;margin:10px 0;">${decoratedLeaf(markerStyle, marker)}<section style="flex:1;min-width:0;font-size:14px;line-height:1.85;color:${context.theme.text};">${listItemContent(item, context)}</section></section>`
  }).join('')
  return `<section style="margin:14px 0 21px;padding-left:2px;">${items}</section>`
}

function renderTable(token, context) {
  const headingStyle = `padding:10px 11px;background:${context.theme.id === 'moyu-ticket' ? context.theme.text : context.theme.tint};color:${context.theme.id === 'moyu-ticket' ? '#FFFFFF' : context.theme.text};font-size:12px;font-weight:750;text-align:left;border-bottom:1px solid ${context.theme.border};`
  const bodyStyle = `padding:10px 11px;font-size:12px;line-height:1.7;color:${context.theme.text};border-bottom:1px solid ${context.theme.border};vertical-align:top;`
  const header = token.header.map((cell) => `<th style="${headingStyle}">${renderInline(cell.tokens, context)}</th>`).join('')
  const rows = token.rows.map((row, index) => `<tr style="background:${index % 2 ? context.theme.tint : '#FFFFFF'};">${row.map((cell) => `<td style="${bodyStyle}">${renderInline(cell.tokens, context)}</td>`).join('')}</tr>`).join('')
  return `<section style="margin:20px 0;border:1px solid ${context.theme.border};border-radius:${context.theme.radius};overflow:hidden;"><table style="width:100%;border-collapse:collapse;table-layout:fixed;"><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></section>`
}

function renderDivider(context) {
  const source = findSkillComponent(context.theme, /END 结尾分割线|章节分割线|分割线 divider-solid|结束符 end-mark/)?.template
  return source ? applyTemplate(source) : `<section style="margin:32px auto;width:40px;border-top:2px solid ${context.theme.accent};font-size:0;line-height:0;">${leaf('·')}</section>`
}

function renderAuthor(context) {
  if (!context.options.authorCard) return ''
  const author = context.options.author || context.detectedAuthor || '文章作者'
  const biography = context.options.authorBio || context.detectedBio || '热衷于分享认真写作与有价值的观察'
  const interaction = '如果你觉得今天这篇有收获，欢迎点赞、在看、转发，我们下篇见。'
  const layout = context.theme.sourceTheme || context.theme.layout || context.theme.id
  const divider = findSkillComponent(context.theme, /END 结尾分割线|结束符 end-mark/)?.template
  const intro = `<p style="${paragraphStyle(context)}">${leaf(`我是 ${author}，${biography}。`)}</p>`

  if (['moyu-green', 'moyu-ticket', 'olive-journal'].includes(layout)) {
    const matcher = layout === 'olive-journal' ? /结尾行动区 ending-actions/ : /footer-cta/
    const source = findSkillComponent(context.theme, matcher)?.template
    const component = applyTemplate(source, { 互动文案: interaction, 文末互动引导: interaction })
    return `<section style="margin:34px 14px 15px;">${intro}${component}</section>`
  }

  const source = findSkillComponent(context.theme, /尾部作者签名区/)?.template
  let signature = applyTemplate(source, {
    作者名: author,
    '一句话简介，如：热衷于分享 AI 观察与干货': biography,
    '个人名片或引导图URL，无则删本 section': '',
  })
  signature = signature.replace(/<section[^>]*>\s*<span leaf="">\s*<img\s+src=""[^>]*>\s*<\/span>\s*<\/section>/g, '')
  if (!signature) signature = `<section style="padding:20px 8px 8px;border-top:1px solid ${context.theme.border};">${intro}<p style="${paragraphStyle(context)}">${leaf(interaction)}</p></section>`
  return `${divider ? applyTemplate(divider) : ''}${signature}`
}

function renderBlock(token, context) {
  if (!token || token.type === 'space') return ''
  if (token.type === 'heading') {
    if (token.depth === 1) return ''
    if (token.depth === 2) return renderChapter(token, context)
    return renderSubheading(token, context)
  }
  if (token.type === 'paragraph') return renderParagraph(token, context)
  if (token.type === 'blockquote') return renderQuote(token, context)
  if (token.type === 'code') return renderCode(token, context)
  if (token.type === 'list') return renderList(token, context)
  if (token.type === 'table') return renderTable(token, context)
  if (token.type === 'hr') return renderDivider(context)
  if (token.type === 'html') return `<p style="${paragraphStyle(context)}">${leaf(token.text)}</p>`
  if (token.type === 'text') return `<p style="${paragraphStyle(context)}">${renderInline(token.tokens || [token], context)}</p>`
  return ''
}

function getAuthorInformation(tokens) {
  const candidate = [...tokens].reverse().find((token) => token.type === 'paragraph' && authorPattern.test(token.text?.trim() || ''))
  if (!candidate) return { token: null, author: '', bio: '' }
  const match = candidate.text.trim().match(/^(?:我是|作者[：:]|撰文[：:]|文[：:]|关于作者\s*)([^，。！？\s]{1,16})(?:[，,]\s*(.+?))?[。.!]?$/)
  return { token: candidate, author: match?.[1] || '', bio: match?.[2]?.replace(/[。.!]+$/, '') || '' }
}

function recolorCustomTheme(html, theme) {
  if (!theme.custom) return html
  const palettes = {
    'moyu-green': { accent: ['#059669', '#10B981'], underline: ['#A7F3D0', '#6EE7B7'], tint: ['#ECFDF5', '#F0FDF4'], highlight: ['#FDE68A'] },
    'red-white': { accent: ['#DC2626', '#991B1B'], underline: ['#FECACA'], tint: ['#FEF2F2', '#FEE2E2'], highlight: ['#FCA5A5'] },
    'graphite-minimal': { accent: ['#52525B', '#27272A'], underline: ['#D4D4D8'], tint: ['#F4F4F5', '#FAFAFA'], highlight: ['#F97316'] },
    'zen-whitespace': { accent: ['#4A5D52'], underline: ['#B5C8BC'], tint: ['#F3F5F2'], highlight: ['#E7EEE9'] },
    'moyu-ticket': { accent: ['#059669'], underline: ['#A7F3D0'], tint: ['#F0FDF4'], highlight: ['#FEF3C7'] },
    'olive-journal': { accent: ['#1E1F23', '#23251D'], underline: ['#ED7B2F'], tint: ['#EEEFE9', '#FDFDF8'], highlight: ['#F5D8A8'] },
  }
  const palette = palettes[theme.sourceTheme] || palettes['moyu-green']
  const replacements = new Map([
    ...palette.accent.map((value) => [value.toLowerCase(), theme.accent]),
    ...palette.underline.map((value) => [value.toLowerCase(), theme.accentSoft]),
    ...palette.tint.map((value) => [value.toLowerCase(), theme.tint]),
    ...palette.highlight.map((value) => [value.toLowerCase(), theme.highlight]),
  ])
  return html.replace(/#[\da-f]{6}\b/gi, (color) => replacements.get(color.toLowerCase()) || color)
}

function rootStyle(theme) {
  const source = findSkillComponent(theme, /全局容器/)?.template
  const base = sourceStyle(source, 'section', `max-width:677px;margin:0 auto;background:#FFFFFF;color:${theme.text};font-family:${theme.bodyFont};line-height:1.8;`)
  if (!theme.custom) return base
  return `max-width:677px;margin:0 auto;padding:12px;box-sizing:border-box;background:#FFFFFF;color:${theme.text};font-family:${theme.bodyFont};line-height:1.8;letter-spacing:0.4px;overflow-x:hidden;`
}

function inspectOutput(html) {
  const forbidden = [
    [/<\/?(?:script|style|div|iframe)\b/i, '正文存在公众号不支持的标签'],
    [/\s(?:class|id)\s*=/i, '正文存在 class / id 依赖'],
    [/position\s*:\s*(?:fixed|absolute|sticky)/i, '正文存在不兼容定位'],
    [/display\s*:\s*grid/i, '正文使用了不兼容的 grid 布局'],
    [/white-space\s*:\s*pre(?:\s*;|\s*")/i, '代码块使用了会产生空白的 white-space:pre'],
    [/\{\{[^}]+\}\}/, '正文残留未替换的组件占位符'],
  ]
  const errors = forbidden.filter(([pattern]) => pattern.test(html)).map(([, message]) => message)
  const leafCount = (html.match(/<span\s+leaf=""/g) || []).length
  if (!leafCount && /[\u3400-\u9fff]/.test(html)) errors.push('正文中文没有使用 span leaf 包裹')
  return { errors, leafCount, passed: errors.length === 0 }
}

export function renderArticle(markdown, selectedTheme, selectedOptions = {}) {
  const theme = {
    ...selectedTheme,
    underline: selectedTheme.underline || `border-bottom:2px solid ${selectedTheme.accentSoft};font-weight:600;`,
    highlight: selectedTheme.highlight || selectedTheme.accentSoft,
  }
  const options = { ...DEFAULT_OPTIONS, ...selectedOptions }
  const tokens = markdownParser.lexer(markdown || '')
  const titleToken = tokens.find((token) => token.type === 'heading' && token.depth === 1)
  const headings = tokens.filter((token) => token.type === 'heading' && token.depth === 2)
  const firstHeadingIndex = tokens.findIndex((token) => token.type === 'heading' && token.depth === 2)
  const introIndex = tokens.findIndex((token, index) => token.type === 'blockquote' && (firstHeadingIndex < 0 || index < firstHeadingIndex))
  const introduction = introIndex < 0 ? null : tokens[introIndex]
  const author = getAuthorInformation(tokens)
  const context = {
    theme, options, headings, chapterIndex: 0, paragraphMarks: 0, keywordCount: 0,
    articleType: classifyArticle(tokens), introductionText: introduction?.text?.replace(/==|\+\+|\*\*|<\/?u>/gi, '') || '',
    detectedAuthor: author.author, detectedBio: author.bio,
  }
  const title = titleToken?.text || '未命名文章'
  const layout = theme.sourceTheme || theme.layout || theme.id
  const cover = renderCover(title, context)
  const toc = renderTableOfContents(headings, context)
  const opening = renderIntroduction(introduction, context)
  const introFirst = layout !== 'moyu-green'
  const bodyTokens = tokens.filter((token) => token !== titleToken
    && !(options.introduction && token === introduction)
    && !(options.authorCard && token === author.token))
  const body = bodyTokens.map((token) => {
    const block = renderBlock(token, context)
    if (!block) return ''
    return token.type === 'heading' && token.depth === 2 ? block : `<section style="padding:0 ${layout === 'olive-journal' ? 8 : layout === 'zen-whitespace' ? 16 : 14}px;">${block}</section>`
  }).join('')
  const raw = `<section style="${rootStyle(theme)}">${cover}${introFirst ? `${opening}${toc}` : `${toc}${opening}`}${body}${renderAuthor(context)}</section>`
  const html = DOMPurify.sanitize(recolorCustomTheme(raw, theme), {
    ALLOWED_TAGS: ['section', 'h1', 'h2', 'h3', 'h4', 'p', 'span', 'strong', 'em', 's', 'u', 'a', 'img', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'svg', 'path', 'circle', 'ellipse', 'polygon', 'polyline', 'rect'],
    ALLOWED_ATTR: ['style', 'leaf', 'href', 'title', 'src', 'alt', 'width', 'height', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'points', 'x', 'y', 'aria-hidden'],
    ALLOW_DATA_ATTR: false,
  })
  const validation = inspectOutput(html)
  return {
    html,
    meta: {
      title,
      articleType: context.articleType,
      chapterCount: headings.length,
      keywordCount: context.keywordCount,
      componentStats: getSkillStats(theme),
      validation,
      source: getSkillLibrary(theme),
    },
  }
}

export function renderMarkdown(markdown, theme, options) {
  return renderArticle(markdown, theme, options).html
}

export { DEFAULT_OPTIONS }
