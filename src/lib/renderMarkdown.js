import { marked, Parser } from 'marked'
import DOMPurify from 'dompurify'

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

const leaf = (html) => `<span leaf="">${html}</span>`

function customStyleFor(theme) {
  const config = theme.layoutConfig || {}
  const density = config.density || 'balanced'
  const paragraphGap = density === 'compact' ? '14px' : density === 'airy' ? '26px' : '19px'
  const lineHeight = density === 'compact' ? '1.75' : density === 'airy' ? '2.15' : '1.9'
  const sectionGap = density === 'compact' ? '34px' : density === 'airy' ? '54px' : '42px'

  const titleStyles = {
    editorial: `padding:0 0 18px;border-bottom:4px solid ${theme.accent};`,
    left: `padding:4px 0 4px 18px;border-left:7px solid ${theme.accent};`,
    boxed: `padding:22px 20px;background:${theme.tint};border:1px solid ${theme.border};border-radius:${theme.radius};box-shadow:5px 5px 0 ${theme.accent};`,
    center: `padding:14px 10px 22px;text-align:center;letter-spacing:0.1em;border-bottom:1px solid ${theme.border};`,
  }
  const sectionStyles = {
    bar: `padding-left:13px;border-left:4px solid ${theme.accent};`,
    solid: `padding:9px 13px;color:#FFFFFF;background:${theme.text};border-radius:${theme.radius};box-shadow:4px 4px 0 ${theme.accent};`,
    underline: `padding:0 0 9px;border-bottom:2px solid ${theme.accent};`,
    center: `padding:8px 0;text-align:center;letter-spacing:0.12em;`,
  }
  const quoteStyles = {
    card: `padding:19px 21px;background:${theme.tint};border:1px solid ${theme.border};border-radius:${theme.radius};`,
    line: `padding:10px 0 10px 20px;border-left:4px solid ${theme.accent};`,
    center: `padding:24px 28px;text-align:center;border-top:1px solid ${theme.border};border-bottom:1px solid ${theme.border};`,
    dark: `padding:20px 22px;color:#FFFFFF;background:${theme.text};border-radius:${theme.radius};`,
  }

  return {
    root: `max-width:677px;margin:0 auto;padding:30px 20px 50px;box-sizing:border-box;background:#FFFFFF;color:${theme.text};font-family:${theme.bodyFont};font-size:16px;line-height:${lineHeight};letter-spacing:0.04em;word-break:break-word;`,
    h1: `margin:8px 0 30px;font-family:${theme.headingFont};font-size:30px;line-height:1.38;font-weight:800;letter-spacing:0.02em;color:${theme.text};${titleStyles[config.titleStyle] || titleStyles.editorial}`,
    h2: `margin:${sectionGap} 0 20px;font-family:${theme.headingFont};font-size:23px;line-height:1.5;font-weight:800;color:${theme.text};${sectionStyles[config.sectionStyle] || sectionStyles.bar}`,
    h3: `margin:30px 0 14px;font-size:18px;line-height:1.6;font-weight:700;color:${theme.accent};`,
    p: `margin:0 0 ${paragraphGap};font-size:16px;line-height:${lineHeight};color:${theme.text};text-align:justify;`,
    quote: `margin:28px 0;color:${config.quoteStyle === 'dark' ? '#FFFFFF' : theme.muted};font-size:15px;line-height:1.9;${quoteStyles[config.quoteStyle] || quoteStyles.card}`,
    code: `margin:24px 0;padding:18px 20px;background:#20242A;color:#E5E7EB;border-radius:${theme.radius};font-family:Consolas,Monaco,monospace;font-size:13px;line-height:1.7;overflow-x:auto;white-space:pre;`,
    inlineCode: `padding:2px 6px;background:${theme.tint};color:${theme.accent};border:1px solid ${theme.border};border-radius:4px;font-family:Consolas,Monaco,monospace;font-size:0.9em;`,
    list: `margin:12px 0 22px;padding-left:1.55em;color:${theme.text};`,
    li: `margin:8px 0;line-height:1.85;padding-left:4px;`,
    link: `color:${theme.accent};text-decoration:none;border-bottom:1px solid ${theme.accentSoft};`,
    strong: `font-weight:700;color:${theme.text};border-bottom:2px solid ${theme.accentSoft};`,
  }
}

function styleFor(theme) {
  if (theme.layoutConfig) return customStyleFor(theme)
  const layout = theme.layout || theme.id
  const ticket = layout === 'moyu-ticket'
  const zen = layout === 'zen-whitespace'
  const red = layout === 'red-white'
  const olive = layout === 'olive-journal'
  const graphite = layout === 'graphite-minimal'
  return {
    root: `max-width:677px;margin:0 auto;padding:${zen ? '44px 22px 60px' : '28px 20px 48px'};box-sizing:border-box;background:#FFFFFF;color:${theme.text};font-family:${theme.bodyFont};font-size:16px;line-height:${zen ? '2.15' : '1.9'};letter-spacing:0.04em;word-break:break-word;`,
    h1: `margin:8px 0 30px;padding:${ticket ? '22px 18px' : red ? '0 0 20px' : '0'};font-family:${theme.headingFont};font-size:${zen ? '29px' : '30px'};line-height:1.38;font-weight:800;letter-spacing:0.02em;color:${theme.text};${ticket ? `border:2px solid ${theme.border};box-shadow:5px 5px 0 ${theme.accent};` : red ? `border-bottom:4px solid ${theme.accent};` : olive ? `border-left:7px solid #ED7B2F;padding-left:18px;` : graphite ? `border-top:1px solid ${theme.text};padding-top:18px;` : ''}`,
    h2: `margin:${zen ? '52px' : '42px'} 0 20px;padding:${red ? '0 0 10px' : ticket ? '9px 12px' : olive ? '10px 14px' : '0'};font-family:${theme.headingFont};font-size:23px;line-height:1.5;font-weight:800;color:${theme.text};${red ? `border-bottom:1px solid ${theme.accent};` : ticket ? `background:${theme.text};color:#FFFFFF;box-shadow:4px 4px 0 ${theme.accent};` : olive ? `background:${theme.tint};border-left:4px solid ${theme.accent};` : zen ? `text-align:center;letter-spacing:0.14em;` : `border-left:4px solid ${theme.accent};padding-left:13px;`}`,
    h3: `margin:30px 0 14px;font-size:18px;line-height:1.6;font-weight:700;color:${theme.accent};${ticket ? `border-bottom:2px dashed ${theme.accentSoft};padding-bottom:6px;` : ''}`,
    p: `margin:0 0 ${zen ? '25px' : '19px'};font-size:16px;line-height:${zen ? '2.15' : '1.9'};color:${theme.text};text-align:justify;`,
    quote: `margin:28px 0;padding:${zen ? '24px 28px' : '18px 20px'};background:${theme.tint};border-left:${zen ? '0' : `4px solid ${theme.accent}`};${zen ? `border-top:1px solid ${theme.border};border-bottom:1px solid ${theme.border};text-align:center;` : ''}color:${theme.muted};font-size:15px;line-height:1.9;`,
    code: `margin:24px 0;padding:18px 20px;background:${olive ? '#1E1F23' : '#20242A'};color:#E5E7EB;border-radius:${theme.radius};font-family:Consolas,Monaco,monospace;font-size:13px;line-height:1.7;overflow-x:auto;white-space:pre;`,
    inlineCode: `padding:2px 6px;background:${theme.tint};color:${theme.accent};border:1px solid ${theme.border};border-radius:4px;font-family:Consolas,Monaco,monospace;font-size:0.9em;`,
    list: `margin:12px 0 22px;padding-left:1.55em;color:${theme.text};`,
    li: `margin:8px 0;line-height:1.85;padding-left:4px;`,
    link: `color:${theme.accent};text-decoration:none;border-bottom:1px solid ${theme.accentSoft};`,
    strong: `font-weight:700;color:${theme.text};border-bottom:2px solid ${theme.accentSoft};`,
  }
}

function makeRenderer(theme) {
  const s = styleFor(theme)
  const layout = theme.layout || theme.id
  let h2Index = 0
  const renderer = new marked.Renderer()
  const renderInline = (tokens = []) => Parser.parseInline(tokens, { renderer })

  // WeChat treats `span[leaf]` as an atomic text node. A leaf must contain
  // text only; wrapping rendered inline HTML in a leaf causes paste cleanup
  // to discard nested emphasis styles.
  renderer.text = ({ text }) => leaf(esc(text))

  renderer.heading = ({ tokens, depth }) => {
    const content = renderInline(tokens)
    if (depth === 1) return `<h1 style="${s.h1}">${content}</h1>`
    if (depth === 2) {
      h2Index += 1
      const numbering = theme.layoutConfig?.numbering
      const customPrefix = numbering === 'decimal' ? `${String(h2Index).padStart(2, '0')} / ` : numbering === 'chapter' ? `第${['一','二','三','四','五','六','七','八','九','十'][h2Index - 1] || h2Index}章 · ` : numbering === 'no' ? `NO.${String(h2Index).padStart(2, '0')} ` : ''
      const prefix = theme.layoutConfig ? customPrefix : layout === 'zen-whitespace' ? '— ' : layout === 'red-white' ? `${String(h2Index).padStart(2, '0')} / ` : layout === 'moyu-ticket' ? `NO.${String(h2Index).padStart(2, '0')} ` : ''
      return `<h2 style="${s.h2}">${prefix ? leaf(prefix) : ''}${content}</h2>`
    }
    return `<h3 style="${s.h3}">${content}</h3>`
  }
  renderer.paragraph = ({ tokens }) => `<p style="${s.p}">${renderInline(tokens)}</p>`
  renderer.blockquote = ({ tokens }) => {
    const content = tokens.map((token) => token.type === 'paragraph' ? renderInline(token.tokens) : marked.parser([token], { renderer })).join('')
    return `<blockquote style="${s.quote}">${content}</blockquote>`
  }
  renderer.code = ({ text, lang }) => `<pre style="${s.code}"><code>${lang ? `<span style="color:${theme.accentSoft};">${leaf(esc(lang))}</span><br/>` : ''}${leaf(esc(text))}</code></pre>`
  renderer.codespan = ({ text }) => `<code style="${s.inlineCode}">${leaf(esc(text))}</code>`
  renderer.strong = ({ tokens }) => `<span style="${s.strong}">${renderInline(tokens)}</span>`
  renderer.em = ({ tokens }) => `<em style="font-style:italic;color:${theme.muted};">${renderInline(tokens)}</em>`
  renderer.del = ({ tokens }) => `<s style="color:${theme.muted};text-decoration-color:${theme.accent};">${renderInline(tokens)}</s>`
  renderer.link = ({ href, title, tokens }) => `<a href="${esc(href)}" style="${s.link}"${title ? ` title="${esc(title)}"` : ''}>${renderInline(tokens)}</a>`
  renderer.image = ({ href, title, text }) => `<figure style="margin:28px 0;"><img src="${esc(href)}" alt="${esc(text)}" style="display:block;width:100%;height:auto;border-radius:${theme.radius};"${title ? ` title="${esc(title)}"` : ''}/>${text ? `<figcaption style="margin-top:9px;text-align:center;color:${theme.muted};font-size:12px;">${leaf(esc(text))}</figcaption>` : ''}</figure>`
  renderer.list = ({ ordered, items, start }) => `<${ordered ? 'ol' : 'ul'} style="${s.list}"${ordered && start !== 1 ? ` start="${start}"` : ''}>${items.map((item) => renderer.listitem(item)).join('')}</${ordered ? 'ol' : 'ul'}>`
  renderer.listitem = ({ tokens, checked }) => {
    const content = tokens.map((token) => token.type === 'text' ? renderInline(token.tokens || [token]) : marked.parser([token], { renderer })).join('')
    const check = checked === true ? '☑ ' : checked === false ? '☐ ' : ''
    return `<li style="${s.li}">${check ? leaf(check) : ''}${content}</li>`
  }
  renderer.hr = () => `<section style="margin:38px auto;width:42px;border-top:3px solid ${theme.accent};font-size:0;line-height:0;">&nbsp;</section>`
  renderer.br = () => '<br/>'
  renderer.html = ({ text }) => leaf(esc(text))
  return renderer
}

export function renderMarkdown(markdown, theme) {
  marked.setOptions({ gfm: true, breaks: true })
  const content = marked.parse(markdown || '', { renderer: makeRenderer(theme) })
  const safe = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['section', 'h1', 'h2', 'h3', 'p', 'span', 'strong', 'em', 's', 'u', 'blockquote', 'pre', 'code', 'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'br'],
    ALLOWED_ATTR: ['style', 'leaf', 'href', 'title', 'src', 'alt', 'start'],
    ALLOW_DATA_ATTR: false,
  })
  return `<section style="${styleFor(theme).root}">${safe}</section>`
}
