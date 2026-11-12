/**
 * Pure, deterministic markdown to HTML renderer for previewing specifications without raw markers.
 * Handles headings, bold, italic, inline code, code blocks, tables, blockquotes, checklists, links, rules, and lists.
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown || !markdown.trim()) return ''

  // Normalize line endings
  const text = markdown.replace(/\r\n/g, '\n')
  const lines = text.split('\n')
  const out: string[] = []

  let inList: 'ul' | 'ol' | false = false
  let inCodeBlock = false
  let codeBlockLang = ''
  let codeBlockBuffer: string[] = []

  let inBlockquote = false
  let blockquoteBuffer: string[] = []

  let inTable = false
  let tableHeaders: string[] = []
  let tableRows: string[][] = []

  const closeList = () => {
    if (inList === 'ul') out.push('</ul>')
    else if (inList === 'ol') out.push('</ol>')
    inList = false
  }

  const closeBlockquote = () => {
    if (inBlockquote) {
      const content = blockquoteBuffer.map((line) => `<p class="md-paragraph">${inlineFormat(line)}</p>`).join('\n')
      out.push(`<blockquote class="md-blockquote">${content}</blockquote>`)
      blockquoteBuffer = []
      inBlockquote = false
    }
  }

  const closeTable = () => {
    if (inTable) {
      if (tableHeaders.length > 0) {
        const thead = `<thead><tr>${tableHeaders.map((h) => `<th>${inlineFormat(h)}</th>`).join('')}</tr></thead>`
        const tbodyRows = tableRows
          .map((row) => `<tr>${row.map((cell) => `<td>${inlineFormat(cell)}</td>`).join('')}</tr>`)
          .join('')
        const tbody = `<tbody>${tbodyRows}</tbody>`
        out.push(`<div class="md-table-wrap"><table class="md-table">${thead}${tbody}</table></div>`)
      }
      tableHeaders = []
      tableRows = []
      inTable = false
    }
  }

  const closeAllBlocks = () => {
    closeList()
    closeBlockquote()
    closeTable()
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]!
    const trimmed = rawLine.trim()

    // Fenced Code Block Check
    if (trimmed.startsWith('```')) {
      closeAllBlocks()
      if (inCodeBlock) {
        // Closing code block
        const langClass = codeBlockLang ? ` language-${escapeHtml(codeBlockLang)}` : ''
        out.push(
          `<pre class="code-box font-mono"><code class="code-content${langClass}">${escapeHtml(codeBlockBuffer.join('\n'))}</code></pre>`,
        )
        inCodeBlock = false
        codeBlockLang = ''
        codeBlockBuffer = []
      } else {
        // Opening code block
        inCodeBlock = true
        codeBlockLang = trimmed.slice(3).trim()
        codeBlockBuffer = []
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(rawLine)
      continue
    }

    // Horizontal Rule Check
    if (/^(?:---|\*\*\*|___)$/.test(trimmed)) {
      closeAllBlocks()
      out.push('<hr class="md-hr" />')
      continue
    }

    // Blockquote Check (> quote)
    if (trimmed.startsWith('>')) {
      closeList()
      closeTable()
      inBlockquote = true
      blockquoteBuffer.push(trimmed.replace(/^>\s?/, ''))
      continue
    } else {
      closeBlockquote()
    }

    // Table Row Check (| cell | cell |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
      closeList()
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim())

      // Check if delimiter row (| --- | --- |)
      const isDelimiter = cells.every((c) => /^:?-+:?$/.test(c))
      if (isDelimiter) {
        // Just the delimiter row, marks table as verified
        continue
      }

      if (!inTable) {
        // First row is the header
        inTable = true
        tableHeaders = cells
        tableRows = []
      } else {
        tableRows.push(cells)
      }
      continue
    } else {
      closeTable()
    }

    // Task List Item Check (- [ ] or - [x])
    const taskMatch = trimmed.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/)
    if (taskMatch) {
      if (inList !== 'ul') {
        closeList()
        out.push('<ul class="md-list md-task-list">')
        inList = 'ul'
      }
      const isChecked = taskMatch[1]!.toLowerCase() === 'x'
      out.push(
        `<li class="md-list-item md-task-item"><input type="checkbox" disabled ${isChecked ? 'checked' : ''} class="md-task-checkbox" /> <span>${inlineFormat(taskMatch[2]!)}</span></li>`,
      )
      continue
    }

    // Bullet List Item Check (- item or * item)
    const listMatch = trimmed.match(/^[-*]\s+(.*)$/)
    if (listMatch) {
      if (inList !== 'ul') {
        closeList()
        out.push('<ul class="md-list">')
        inList = 'ul'
      }
      out.push(`<li class="md-list-item">${inlineFormat(listMatch[1]!)}</li>`)
      continue
    }

    // Numbered List Check (e.g. 1. Item)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
    if (numMatch) {
      if (inList !== 'ol') {
        closeList()
        out.push('<ol class="md-num-list">')
        inList = 'ol'
      }
      out.push(`<li class="md-num-item">${inlineFormat(numMatch[2]!)}</li>`)
      continue
    }

    // Close list if non-list line arrived
    closeList()

    // Empty Line
    if (!trimmed) {
      continue
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      out.push(`<h3 class="md-heading-3">${inlineFormat(trimmed.slice(4))}</h3>`)
      continue
    }
    if (trimmed.startsWith('## ')) {
      out.push(`<h2 class="md-heading-2">${inlineFormat(trimmed.slice(3))}</h2>`)
      continue
    }
    if (trimmed.startsWith('# ')) {
      out.push(`<h1 class="md-heading-1 font-serif">${inlineFormat(trimmed.slice(2))}</h1>`)
      continue
    }

    // Paragraph
    out.push(`<p class="md-paragraph">${inlineFormat(trimmed)}</p>`)
  }

  closeAllBlocks()

  if (inCodeBlock) {
    out.push(
      `<pre class="code-box font-mono"><code class="code-content">${escapeHtml(codeBlockBuffer.join('\n'))}</code></pre>`,
    )
  }

  return out.join('\n')
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function sanitizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  if (/^(?:https?:\/\/|mailto:|#|\/)/i.test(trimmed)) {
    return escapeHtml(trimmed)
  }
  return '#'
}

function inlineFormat(str: string): string {
  let res = escapeHtml(str)

  // Inline code: `code`
  res = res.replace(/`([^`]+)`/g, '<code class="md-inline-code font-mono">$1</code>')

  // Bold: **text**
  res = res.replace(/\*\*([^*]+)\*\*/g, '<strong class="md-bold">$1</strong>')

  // Italic: *text* or _text_
  res = res.replace(/(?:^|[^*])\*([^*]+)\*(?:[^*]|$)/g, ' <em>$1</em> ')

  // Markdown links: [label](url)
  res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const safeHref = sanitizeUrl(url)
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="md-link">${label}</a>`
  })

  return res
}
