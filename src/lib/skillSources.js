import commonSource from '../skill/references/common-components.md?raw'
import themeIndexSource from '../skill/references/theme-index.md?raw'
import graphiteSource from '../skill/references/theme-graphite-minimal.md?raw'
import greenSource from '../skill/references/theme-moyu-green.md?raw'
import ticketSource from '../skill/references/theme-moyu-ticket.md?raw'
import oliveSource from '../skill/references/theme-olive-journal.md?raw'
import redSource from '../skill/references/theme-red-white.md?raw'
import zenSource from '../skill/references/theme-zen-whitespace.md?raw'

const sources = {
  'moyu-green': greenSource,
  'red-white': redSource,
  'graphite-minimal': graphiteSource,
  'zen-whitespace': zenSource,
  'moyu-ticket': ticketSource,
  'olive-journal': oliveSource,
}

function parseLibrary(source) {
  const components = []
  let family = ''

  for (const section of source.split(/(?=^#{2,3}\s)/m)) {
    const heading = section.match(/^(#{2,3})\s+([^\r\n]+)/)
    if (!heading) continue
    if (heading[1] === '##') family = heading[2]

    const templates = [...section.matchAll(/```html\s*\r?\n([\s\S]*?)```/g)]
      .map((match) => match[1].trim())
    if (!templates.length) continue

    components.push({
      title: heading[2],
      family,
      templates,
      placeholders: [...new Set(templates.flatMap((template) =>
        [...template.matchAll(/\{\{([^}]+)\}\}/g)].map((match) => match[1].trim())))],
    })
  }

  return {
    source,
    components,
    familyCount: [...new Set(components.map((component) => component.family))].length,
    templateCount: components.reduce((count, component) => count + component.templates.length, 0),
    hasRecipe: /文章类型\s*→\s*组件组合配方/.test(source),
    hasSkeleton: /完整文章模板骨架/.test(source),
    hasMapping: /Markdown\s*→/.test(source),
  }
}

const libraries = Object.fromEntries(Object.entries(sources)
  .map(([id, source]) => [id, parseLibrary(source)]))

export const commonLibrary = parseLibrary(commonSource)
export const themeIndex = themeIndexSource

export function getSkillLibrary(theme) {
  return libraries[theme?.sourceTheme || theme?.layout || theme?.id] || libraries['moyu-green']
}

export function findSkillComponent(theme, matcher, { variant = 0, common = false } = {}) {
  const library = common ? commonLibrary : getSkillLibrary(theme)
  const match = typeof matcher === 'function'
    ? matcher
    : (component) => matcher.test(`${component.title} ${component.family}`)
  const component = library.components.find(match)
  if (!component) return null
  return { ...component, template: component.templates[variant] || component.templates[0] }
}

export function getSkillStats(theme) {
  const library = getSkillLibrary(theme)
  return {
    families: library.familyCount,
    templates: library.templateCount,
    commonTemplates: commonLibrary.templateCount,
    hasRecipe: library.hasRecipe,
    hasSkeleton: library.hasSkeleton,
    hasMapping: library.hasMapping,
  }
}
