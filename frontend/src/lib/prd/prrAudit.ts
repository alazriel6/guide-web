/**
 * Production Readiness Review (PRR) Audit Engine
 * Industry SRE standard (pioneered by Google SRE) for service launch authorization.
 * Evaluates architecture against 4 mission-critical pillars before deploying to production.
 */

import type { PrdModel } from './sections'

export type PrrPillar = 'security' | 'reliability' | 'observability' | 'data'

export interface PrrCheckItem {
  id: string
  pillar: PrrPillar
  title: string
  description: string
  passed: boolean
  importance: 'critical' | 'high' | 'recommended'
  remediation: string
}

export interface PrrReport {
  score: number // 0 - 100
  verdict: 'READY' | 'CONDITIONAL' | 'BLOCKED'
  passedCount: number
  totalCount: number
  criticalFailedCount: number
  items: PrrCheckItem[]
  evaluatedAt: string
}

export function evaluateProductionReadiness(model: PrdModel): PrrReport {
  const stack = (model.stack || '').toLowerCase()
  const nfr = (model.nfr || '').toLowerCase()
  const constraints = (model.constraints || '').toLowerCase()
  const apiContract = (model.api_contract || '').toLowerCase()
  const dataModels = (model.data_models || '').toLowerCase()

  const items: PrrCheckItem[] = [
    // PILLAR 1: SECURITY
    {
      id: 'sec-cors',
      pillar: 'security',
      title: 'Restriksi CORS Whitelist Origin',
      description: 'CORS dilarang menggunakan wildcard (*) pada kredensial cookie/Authorization.',
      passed: nfr.includes('cors') || constraints.includes('cors') || constraints.includes('whitelist'),
      importance: 'critical',
      remediation: 'Konfigurasikan origin whitelist eksplisit (misal: https://app.domain.com) pada CORS middleware.',
    },
    {
      id: 'sec-param-sql',
      pillar: 'security',
      title: 'Perlindungan Injeksi SQL (Parameterized Binding)',
      description: 'Seluruh query SQL wajib menggunakan parameterized query atau ORM bertipe ketat.',
      passed: constraints.includes('parameter') || constraints.includes('orm') || stack.includes('prisma') || stack.includes('gorm'),
      importance: 'critical',
      remediation: 'Hapus seluruh konkatenasi string SQL raw; gunakan parameterized statement.',
    },
    {
      id: 'sec-rate-limit',
      pillar: 'security',
      title: 'Proteksi Rate Limiting & Brute-Force',
      description: 'Endpoint publik dan login wajib dibatasi frekuensi aksesnya (HTTP 429).',
      passed: nfr.includes('rate limit') || constraints.includes('rate limit') || apiContract.includes('rate'),
      importance: 'high',
      remediation: 'Pasang token bucket atau sliding window rate limiter di reverse proxy / API gateway.',
    },
    {
      id: 'sec-token-rotation',
      pillar: 'security',
      title: 'Rotasi Token JWT & Short Expiration',
      description: 'Access token maksimal 15-30 menit dengan refresh token rotation.',
      passed: nfr.includes('refresh') || constraints.includes('refresh') || apiContract.includes('refresh'),
      importance: 'high',
      remediation: 'Terapkan masa berlaku token pendek dan blacklist refresh token yang telah dipakai.',
    },

    // PILLAR 2: RELIABILITY & DISASTER RECOVERY
    {
      id: 'rel-backup',
      pillar: 'reliability',
      title: 'Backup Database Otomatis & Point-in-Time Recovery',
      description: 'Snapshot database berkala dan verifikasi restore script teruji.',
      passed: nfr.includes('backup') || constraints.includes('backup') || nfr.includes('snapshot'),
      importance: 'critical',
      remediation: 'Jadwalkan backup harian otomatis ke object storage terisolasi dengan retensi minimal 30 hari.',
    },
    {
      id: 'rel-healthcheck',
      pillar: 'reliability',
      title: 'Liveness & Readiness Health Probes (/healthz)',
      description: 'Orchestrator memerlukan probe /healthz dan /readyz untuk mendeteksi crash.',
      passed: apiContract.includes('health') || nfr.includes('healthz') || constraints.includes('healthz'),
      importance: 'critical',
      remediation: 'Buat endpoint GET /healthz yang memverifikasi koneksi database dan cache aktif.',
    },
    {
      id: 'rel-graceful',
      pillar: 'reliability',
      title: 'Graceful Shutdown Handling (SIGTERM)',
      description: 'Aplikasi menyelesaikan request aktif sebelum mematikan koneksi saat deploy baru.',
      passed: nfr.includes('graceful') || constraints.includes('sigterm') || nfr.includes('sigterm'),
      importance: 'high',
      remediation: 'Tangkap sinyal SIGTERM pada HTTP server dan tunggu maksimal 15 detik sebelum exit.',
    },
    {
      id: 'rel-timeout',
      pillar: 'reliability',
      title: 'Egress Network & Database Query Timeouts',
      description: 'Dilarang membiarkan koneksi jaringan eksternal menggantung tanpa batas waktu.',
      passed: nfr.includes('timeout') || constraints.includes('timeout'),
      importance: 'high',
      remediation: 'Tentukan batas waktu timeout maksimal: 5 detik untuk HTTP external, 3 detik untuk query DB.',
    },

    // PILLAR 3: OBSERVABILITY
    {
      id: 'obs-correlation-id',
      pillar: 'observability',
      title: 'Pelacakan Request Correlation ID (X-Request-ID)',
      description: 'Setiap request memiliki UUID unik yang diteruskan ke log dan database query.',
      passed: nfr.includes('request id') || nfr.includes('tracing') || constraints.includes('correlation'),
      importance: 'high',
      remediation: 'Suntikkan header X-Request-ID di middleware gateway dan masukkan ke seluruh baris log.',
    },
    {
      id: 'obs-json-log',
      pillar: 'observability',
      title: 'Pencatatan Log JSON Terstruktur',
      description: 'Format log terstruktur standar (timestamp, level, message, metadata) untuk ELK/Datadog.',
      passed: nfr.includes('structured') || nfr.includes('json log') || stack.includes('zap') || stack.includes('pino'),
      importance: 'recommended',
      remediation: 'Gunakan structured logger seperti Zap, Pino, atau Winston; hindari console.log polos.',
    },

    // PILLAR 4: DATA INTEGRITY & PERFORMANCE
    {
      id: 'data-index',
      pillar: 'data',
      title: 'Pengindeksan B-Tree pada Foreign Key',
      description: 'Seluruh foreign key (*_id) dan kolom filter sering wajib memiliki index.',
      passed: dataModels.includes('index') || dataModels.includes('(fk)') || constraints.includes('index'),
      importance: 'critical',
      remediation: 'Tambahkan CREATE INDEX pada seluruh kolom relasi foreign key untuk mencegah full table scan.',
    },
    {
      id: 'data-pagination',
      pillar: 'data',
      title: 'Pagination pada Koleksi Data (Limit/Offset / Cursor)',
      description: 'Dilarang mengeksekusi query SELECT * tanpa klausa limitasi.',
      passed: apiContract.includes('page') || apiContract.includes('limit') || apiContract.includes('cursor'),
      importance: 'high',
      remediation: 'Terapkan default limit 20 dan max limit 100 pada seluruh endpoint GET daftar data.',
    },
  ]

  let passedCount = 0
  let criticalFailedCount = 0

  for (const item of items) {
    if (item.passed) {
      passedCount++
    } else if (item.importance === 'critical') {
      criticalFailedCount++
    }
  }

  const score = Math.round((passedCount / items.length) * 100)
  let verdict: PrrReport['verdict'] = 'BLOCKED'

  if (score >= 85 && criticalFailedCount === 0) {
    verdict = 'READY'
  } else if (score >= 60 && criticalFailedCount <= 1) {
    verdict = 'CONDITIONAL'
  } else {
    verdict = 'BLOCKED'
  }

  return {
    score,
    verdict,
    passedCount,
    totalCount: items.length,
    criticalFailedCount,
    items,
    evaluatedAt: new Date().toISOString(),
  }
}

/**
 * Generates official Markdown report for sign-off
 */
export function generatePrrMarkdown(report: PrrReport, model: PrdModel): string {
  const title = model.title || 'Enterprise System'
  const date = report.evaluatedAt.split('T')[0] || '2026-11-10'

  const verdictBadge =
    report.verdict === 'READY'
      ? '🟢 READY FOR PRODUCTION'
      : report.verdict === 'CONDITIONAL'
        ? '🟡 CONDITIONAL APPROVAL (REMEDIATIONS REQUIRED)'
        : '🔴 BLOCKED (CRITICAL SRE HAZARDS DETECTED)'

  const rows = report.items
    .map(
      (item) =>
        `| ${item.passed ? '✅ Lolos' : '❌ Perlu Perbaikan'} | **${item.title}** | \`${item.pillar.toUpperCase()}\` | ${item.importance.toUpperCase()} | ${item.passed ? 'Sesuai spesifikasi' : item.remediation} |`,
    )
    .join('\n')

  return `# Production Readiness Review (PRR) Gate
**Project:** ${title}
**Date:** ${date}
**Overall Readiness Score:** ${report.score} / 100
**Launch Authorization:** **${verdictBadge}**

## Executive Summary
Audit kesiapan peluncuran (*Production Readiness Review*) berstandar Google SRE.
- Total Pemeriksaan: **${report.totalCount} Item**
- Lolos Memenuhi Standar: **${report.passedCount} Item**
- Item Kritis yang Tertunda: **${report.criticalFailedCount} Item**

## Detail Matriks Audit SRE
| Status | Item Audit | Pilar | Prioritas | Catatan & Remediasi |
| :--- | :--- | :--- | :--- | :--- |
${rows}

## Sign-Off Otorisasi Peluncuran
Dokumen ini menyatakan bahwa sistem telah diaudit secara deterministik terhadap risiko kegagalan sistemik.

- [ ] **Lead Software Architect:** ________________________ (Tanggal: _____)
- [ ] **Site Reliability Engineer (SRE):** ________________ (Tanggal: _____)
- [ ] **Quality Assurance Lead:** _________________________ (Tanggal: _____)
`
}

/**
 * Downloads the PRR markdown document
 */
export function downloadPrrDocument(report: PrrReport, model: PrdModel): void {
  const content = generatePrrMarkdown(report, model)
  const slug = (model.title || 'system')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const filename = `${slug}-PRODUCTION_READINESS_REVIEW.md`
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
