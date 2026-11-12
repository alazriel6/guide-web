/**
 * Lightweight, zero-dependency code syntax highlighter with LRU memoization
 * Generates semantic HTML spans for keywords, strings, comments, numbers, types, and functions.
 */

const HIGHLIGHT_CACHE = new Map<string, string>()
const MAX_CACHE_SIZE = 300

export function highlightSyntax(rawCode: string): string {
  if (!rawCode) return ''

  const cached = HIGHLIGHT_CACHE.get(rawCode)
  if (cached !== undefined) {
    return cached
  }

  const tokens: string[] = []
  const saveToken = (html: string) => {
    tokens.push(html)
    return `___TOK_${tokens.length - 1}___`
  }

  const escape = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  // 1. Extract strings, template literals, and comments first so keywords inside them aren't highlighted
  const commentStringRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*|--[^\n]*|`(?:\\.|[^`])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g

  let processed = rawCode.replace(commentStringRegex, (match) => {
    const escaped = escape(match)
    if (
      match.startsWith('//') ||
      match.startsWith('/*') ||
      match.startsWith('#') ||
      match.startsWith('--')
    ) {
      return saveToken(`<span class="syn-comm">${escaped}</span>`)
    }
    return saveToken(`<span class="syn-str">${escaped}</span>`)
  })

  // 2. Escape remaining code characters
  processed = escape(processed)

  // 3. Highlight Keywords (JS, TS, Python, Go, Rust, C#, Java, PHP, Elixir, SQL)
  const kwRegex = /\b(import|export|from|default|as|const|let|var|function|return|if|else|switch|case|break|continue|for|while|do|in|of|async|await|yield|try|catch|finally|throw|class|interface|type|enum|extends|implements|new|this|super|typeof|instanceof|def|elif|pass|lambda|with|is|not|and|or|fn|pub|struct|impl|mut|use|mod|match|trait|where|package|func|select|defer|go|chan|namespace|using|public|private|protected|static|void|override|val|fun|null|true|false|nil|None|SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|JOIN|GROUP|BY|ORDER|LIMIT|OFFSET|CREATE|TABLE|INDEX)\b/g
  processed = processed.replace(kwRegex, '<span class="syn-kw">$1</span>')

  // 4. Highlight Primitive & Standard Types
  const typeRegex = /\b(string|number|boolean|any|void|unknown|never|int|float|str|dict|list|bool|i8|i16|i32|i64|u8|u16|u32|u64|usize|isize|Vec|Option|Result|String|Promise|Record|Array|Map|Set|Props|State)\b/g
  processed = processed.replace(typeRegex, '<span class="syn-type">$1</span>')

  // 5. Highlight Numbers
  processed = processed.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="syn-num">$1</span>')

  // 6. Highlight Function calls: foo(...)
  processed = processed.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()/g, '<span class="syn-fn">$1</span>')

  // 7. Restore preserved comments & strings
  processed = processed.replace(/___TOK_(\d+)___/g, (_, idx) => tokens[Number(idx)] || '')

  if (HIGHLIGHT_CACHE.size >= MAX_CACHE_SIZE) {
    const firstKey = HIGHLIGHT_CACHE.keys().next().value
    if (firstKey !== undefined) {
      HIGHLIGHT_CACHE.delete(firstKey)
    }
  }
  HIGHLIGHT_CACHE.set(rawCode, processed)

  return processed
}
