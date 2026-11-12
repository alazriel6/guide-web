import { PRD_SECTIONS, type PrdModel } from './sections'
import { renderMarkdown } from './markdown'

/**
 * Generates Microsoft Word (.doc) HTML/XML document with professional styling,
 * formal cover header, executive metadata table, and structured section layout.
 */
export function generateWordDocHtml(model: PrdModel): string {
  const title = model.title || 'Product Requirement Document'
  const category = model.category || 'General Architecture'
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Build section contents
  const sectionBlocks: string[] = []

  for (const sec of PRD_SECTIONS) {
    let contentHtml = ''

    if (sec.kind === 'list' && sec.id === 'features') {
      const items = model.features || []
      if (items.length > 0) {
        const rows = items
          .map(
            (item, idx) => `
          <tr>
            <td style="width: 40px; text-align: center; color: #64748b; font-family: monospace;">${idx + 1}</td>
            <td style="width: 180px; font-weight: bold; color: #0f172a;">${escapeXml(item.name)}</td>
            <td style="width: 80px; text-align: center;">
              <span style="display: inline-block; padding: 2px 8px; font-size: 8.5pt; font-weight: bold; border-radius: 3px; ${
                item.priority === 'mvp'
                  ? 'background-color: #dcfce7; color: #15803d; border: 1px solid #86efac;'
                  : 'background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;'
              }">
                ${item.priority.toUpperCase()}
              </span>
            </td>
            <td style="color: #334155;">${escapeXml(item.description)}</td>
          </tr>`,
          )
          .join('\n')

        contentHtml = `
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 8px; text-align: center; color: #475569;">#</th>
                <th style="padding: 8px; text-align: left; color: #475569;">Feature Name</th>
                <th style="padding: 8px; text-align: center; color: #475569;">Priority</th>
                <th style="padding: 8px; text-align: left; color: #475569;">Capability Description</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>`
      } else {
        contentHtml = '<p style="color: #94a3b8; font-style: italic;">No features defined.</p>'
      }
    } else {
      const text = ((model[sec.id as keyof PrdModel] as string) || '').trim()
      if (text) {
        contentHtml = renderMarkdown(text)
      } else {
        contentHtml = '<p style="color: #94a3b8; font-style: italic;">Section not yet detailed.</p>'
      }
    }

    const orderNum = sec.order.toString().padStart(2, '0')

    sectionBlocks.push(`
      <div class="prd-section-block" style="margin-top: 24pt; page-break-inside: avoid;">
        <h2 style="font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 14pt; color: #0f172a; border-bottom: 1.5pt solid #cbd5e1; padding-bottom: 4pt; margin-bottom: 6pt;">
          <span style="color: #ff7a45; font-family: 'Consolas', monospace; font-size: 13pt;">${orderNum}.</span>
          ${escapeXml(sec.title)}
        </h2>
        <p style="font-size: 9pt; color: #64748b; font-style: italic; margin-top: 0; margin-bottom: 8pt;">
          ${escapeXml(sec.hint)}
        </p>
        <div class="section-content" style="font-size: 10.5pt; line-height: 1.6; color: #1e293b;">
          ${contentHtml}
        </div>
      </div>
    `)
  }

  // Word Document Template with MS Office XML namespaces
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${escapeXml(title)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 8.5in 11.0in;
      margin: 1.0in 1.0in 1.0in 1.0in;
      mso-header-margin: .5in;
      mso-footer-margin: .5in;
      mso-paper-source: 0;
    }
    div.Section1 {
      page: Section1;
    }
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #0f172a;
      background-color: #ffffff;
    }
    h1.doc-title {
      font-family: 'Georgia', serif;
      font-size: 26pt;
      font-weight: bold;
      color: #0f172a;
      margin: 0 0 8pt 0;
      line-height: 1.15;
    }
    .doc-subtitle {
      font-size: 12pt;
      color: #64748b;
      margin-bottom: 16pt;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
    }
    .metadata-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24pt;
      background-color: #f8fafc;
      border: 1pt solid #e2e8f0;
    }
    .metadata-table td {
      padding: 6pt 10pt;
      border: 1pt solid #e2e8f0;
      font-size: 9.5pt;
    }
    .meta-key {
      font-weight: bold;
      color: #475569;
      width: 25%;
    }
    .meta-val {
      color: #0f172a;
      width: 25%;
    }
    .code-box, pre {
      background-color: #f1f5f9;
      border: 1pt solid #cbd5e1;
      padding: 8pt 10pt;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 9pt;
      line-height: 1.45;
      color: #0f172a;
      margin: 8pt 0;
    }
    code {
      font-family: 'Consolas', monospace;
      font-size: 9.5pt;
      background-color: #f1f5f9;
      padding: 1pt 3pt;
      color: #0f172a;
    }
    ul, ol {
      margin: 6pt 0 6pt 18pt;
      padding: 0;
    }
    li {
      margin-bottom: 4pt;
      line-height: 1.5;
    }
    p {
      margin: 4pt 0 8pt 0;
    }
    .doc-footer {
      margin-top: 36pt;
      padding-top: 10pt;
      border-top: 1pt solid #cbd5e1;
      font-size: 8.5pt;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="Section1">
    <!-- Formal Cover Header -->
    <div style="border-bottom: 2pt solid #0f172a; padding-bottom: 12pt; margin-bottom: 16pt;">
      <div class="doc-subtitle">Software Architecture Blueprint & Specification</div>
      <h1 class="doc-title">${escapeXml(title)}</h1>
      <p style="font-size: 10pt; color: #475569; margin: 0;">
        Synthesized via <strong>BlueprintDev Workbench</strong> · Formal Engineering Artifact
      </p>
    </div>

    <!-- Executive Metadata Card -->
    <table class="metadata-table">
      <tr>
        <td class="meta-key">Document Status:</td>
        <td class="meta-val">Approved Architecture Draft</td>
        <td class="meta-key">Primary Category:</td>
        <td class="meta-val">${escapeXml(category)}</td>
      </tr>
      <tr>
        <td class="meta-key">Generation Date:</td>
        <td class="meta-val">${dateStr}</td>
        <td class="meta-key">Spec Framework:</td>
        <td class="meta-val">BlueprintDev (13 Sections)</td>
      </tr>
    </table>

    <!-- Specification Body Stream -->
    ${sectionBlocks.join('\n')}

    <!-- Formal Engineering Document Footer -->
    <div class="doc-footer">
      Confidential & Proprietary · Architecture Specification Document · Generated on ${dateStr}
    </div>
  </div>
</body>
</html>`
}

/**
 * Downloads Microsoft Word (.doc) file directly to client browser.
 */
export function downloadWordDoc(model: PrdModel): void {
  const html = generateWordDocHtml(model)
  const slug = (model.title || 'prd-specification')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  const filename = `${slug || 'specification'}.doc`

  const blob = new Blob([html], {
    type: 'application/msword;charset=utf-8',
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function escapeXml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
