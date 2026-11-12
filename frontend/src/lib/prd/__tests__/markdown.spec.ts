import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../markdown'

describe('renderMarkdown', () => {
  it('renders headings properly with semantic tags', () => {
    const md = '# Main Title\n## Section Subtitle\n### Sub-section'
    const html = renderMarkdown(md)
    expect(html).toContain('<h1 class="md-heading-1 font-serif">Main Title</h1>')
    expect(html).toContain('<h2 class="md-heading-2">Section Subtitle</h2>')
    expect(html).toContain('<h3 class="md-heading-3">Sub-section</h3>')
  })

  it('renders inline formatting: bold, italic, inline code', () => {
    const md = 'This has **bold** text, *italic* word, and `code_snippet`.'
    const html = renderMarkdown(md)
    expect(html).toContain('<strong class="md-bold">bold</strong>')
    expect(html).toContain('<em>italic</em>')
    expect(html).toContain('<code class="md-inline-code font-mono">code_snippet</code>')
  })

  it('renders fenced code blocks with language', () => {
    const md = '```ts\nconst x: number = 42;\n```'
    const html = renderMarkdown(md)
    expect(html).toContain('<pre class="code-box font-mono"><code class="code-content language-ts">const x: number = 42;</code></pre>')
  })

  it('renders unordered and numbered lists', () => {
    const md = '- Item 1\n- Item 2\n\n1. First\n2. Second'
    const html = renderMarkdown(md)
    expect(html).toContain('<ul class="md-list">')
    expect(html).toContain('<li class="md-list-item">Item 1</li>')
    expect(html).toContain('<ol class="md-num-list">')
    expect(html).toContain('<li class="md-num-item">First</li>')
  })

  it('renders interactive task checklists', () => {
    const md = '- [ ] Pending task\n- [x] Completed task'
    const html = renderMarkdown(md)
    expect(html).toContain('<ul class="md-list md-task-list">')
    expect(html).toContain('<li class="md-list-item md-task-item"><input type="checkbox" disabled  class="md-task-checkbox" /> <span>Pending task</span></li>')
    expect(html).toContain('<li class="md-list-item md-task-item"><input type="checkbox" disabled checked class="md-task-checkbox" /> <span>Completed task</span></li>')
  })

  it('renders blockquotes', () => {
    const md = '> Crucial architecture boundary note\n> Always validate JWT'
    const html = renderMarkdown(md)
    expect(html).toContain('<blockquote class="md-blockquote">')
    expect(html).toContain('Crucial architecture boundary note')
    expect(html).toContain('Always validate JWT')
  })

  it('renders markdown tables cleanly', () => {
    const md = '| Name | Role |\n| --- | --- |\n| Alice | Lead |\n| Bob | DevOps |'
    const html = renderMarkdown(md)
    expect(html).toContain('<div class="md-table-wrap"><table class="md-table">')
    expect(html).toContain('<th>Name</th><th>Role</th>')
    expect(html).toContain('<td>Alice</td><td>Lead</td>')
  })

  it('renders horizontal rules', () => {
    const md = 'Paragraph 1\n---\nParagraph 2'
    const html = renderMarkdown(md)
    expect(html).toContain('<hr class="md-hr" />')
  })

  it('renders links safely while sanitizing javascript: attack vectors', () => {
    const md = '[Safe](https://example.com) and [Malicious](javascript:alert(1))'
    const html = renderMarkdown(md)
    expect(html).toContain('<a href="https://example.com" target="_blank" rel="noopener noreferrer" class="md-link">Safe</a>')
    expect(html).toContain('<a href="#" target="_blank" rel="noopener noreferrer" class="md-link">Malicious</a>')
    expect(html).not.toContain('javascript:')
  })

  it('escapes raw HTML to prevent XSS injection', () => {
    const md = '<script>alert("xss")</script> & <img src=x onerror=alert(1)>'
    const html = renderMarkdown(md)
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })
})
