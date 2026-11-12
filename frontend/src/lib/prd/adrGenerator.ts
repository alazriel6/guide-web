/**
 * Architecture Decision Records (ADR) Generator
 * Official MADR (Markdown Architectural Decision Records) / Michael Nygard Standard.
 * Adopted by Google, AWS, Spotify, and ThoughtWorks for enterprise architecture governance.
 */

import type { PrdModel } from './sections'

export interface AdrRecord {
  id: string
  number: number
  filename: string
  title: string
  status: 'Accepted' | 'Proposed' | 'Superseded'
  date: string
  deciders: string
  context: string
  decision: string
  positiveConsequences: string[]
  negativeConsequences: string[]
  markdown: string
}

/**
 * Generates a full suite of formal MADR documents tailored to the active PrdModel
 */
export function generateAdrSuite(model: PrdModel): AdrRecord[] {
  const title = model.title || 'Enterprise System'
  const stack = model.stack || 'Modern Cloud Architecture'
  const today = new Date().toISOString().split('T')[0] || '2026-11-10'

  const adrs: AdrRecord[] = [
    {
      id: 'adr-0001',
      number: 1,
      filename: '0001-core-architectural-style-and-tech-stack.md',
      title: 'Pemilihan Arsitektur Inti & Tech Stack',
      status: 'Accepted',
      date: today,
      deciders: 'Principal Architect, Lead Software Engineer',
      context: `Diperlukan arsitektur perangkat lunak yang modular, terukur, dan memiliki performa tinggi untuk membangun ${title}. Sistem harus mendukung skalabilitas horizontal, pemisahan tugas (*separation of concerns*), dan kemudahan pemeliharaan kode jangka panjang.`,
      decision: `Mengadopsi arsitektur berlapis (*Clean / Layered Architecture*) dengan stack teknologi pilihan:\n${stack}.\nPemisahan ketat diberlakukan antara lapisan Transport (Controller/Router), Domain Service (Business Logic), dan Persistence (Database Repository).`,
      positiveConsequences: [
        'Kerapian kode tinggi dengan pemisahan dependensi searah (Dependency Inversion).',
        'Kemudahan dalam pengujian unit test dan mocking pada lapisan bisnis tanpa menyentuh database fisik.',
        'Onboarding developer baru lebih cepat karena struktur direktori modular dan dapat diprediksi.',
      ],
      negativeConsequences: [
        'Memerlukan kode boilerplate tambahan untuk DTO dan mapper antarlapisan.',
        'Waktu setup awal sedikit lebih lama dibanding pola active-record sederhana.',
      ],
      markdown: '',
    },
    {
      id: 'adr-0002',
      number: 2,
      filename: '0002-database-engine-and-relational-integrity.md',
      title: 'Strategi Database & Integritas Relasional',
      status: 'Accepted',
      date: today,
      deciders: 'Database Administrator, Backend Lead',
      context: `Data aplikasi (${model.category}) memiliki relasi kompleks antar entitas, kebutuhan transaksi ACID yang ketat, dan pelaporan yang konsisten. Ketiadaan integritas referensial akan menyebabkan data yatim (*orphaned records*) dan inkonsistensi status.`,
      decision: `Menggunakan database relasional dengan skema terstruktur dan migrasi eksplisit version-controlled.\nSeluruh relasi foreign key (*_id) wajib memiliki B-Tree index dan constraint referensial ketat (CASCADE / RESTRICT). Dilarang keras menggunakan query raw string concatenations tanpa parameterized binding.`,
      positiveConsequences: [
        'Jaminan integritas data tingkat database dengan kepatuhan ACID mutlak.',
        'Pencegahan anomali data yatim secara deterministik.',
        'Performa query JOIN tetap optimal pada volume ratusan ribu data berkat index B-Tree.',
      ],
      negativeConsequences: [
        'Perubahan skema tabel besar di masa depan memerlukan skrip migrasi berhati-hati (zero-downtime alter table).',
        'Horizontal sharding lebih kompleks dibanding NoSQL database berbasis dokumen.',
      ],
      markdown: '',
    },
    {
      id: 'adr-0003',
      number: 3,
      filename: '0003-restful-api-contract-and-json-envelope.md',
      title: 'Standar Komunikasi API & Format Kontrak JSON',
      status: 'Accepted',
      date: today,
      deciders: 'Frontend Lead, Backend Lead, API Architect',
      context: `Komunikasi antara antarmuka klien dan backend memerlukan kontrak data yang konsisten, mudah dipahami, dan dapat di-generate otomatis menjadi SDK bertipe statis (TypeScript). Inkonsistensi format error menyebabkan bug tak terduga di browser.`,
      decision: `Menerapkan spesifikasi RESTful API berbasis OpenAPI 3.1 dengan envelope JSON standar:\n- Sukses: { "data": ..., "meta": { "page": 1, "limit": 20 } }\n- Error: { "error": { "code": "VALIDATION_FAILED", "message": "...", "details": [...] } }\nStatus kode HTTP standar (200, 201, 400, 401, 403, 404, 429, 500) wajib dipatuhi.`,
      positiveConsequences: [
        'Frontend dan backend dapat bekerja secara paralel dengan Mock Server berkat kontrak yang terkunci.',
        'Error handling di klien menjadi terpusat (*centralized error toast boundary*).',
        'Dapat langsung diuji via Swagger UI, Postman, dan REST Client VS Code (tests/api.http).',
      ],
      negativeConsequences: [
        'Beban ukuran payload JSON sedikit bertambah karena struktur envelope wrapper.',
        'Setiap controller backend wajib membungkus respons dengan helper envelope konsisten.',
      ],
      markdown: '',
    },
    {
      id: 'adr-0004',
      number: 4,
      filename: '0004-authentication-token-rotation-and-security.md',
      title: 'Otentikasi, Autorisasi & Keamanan Sesi Klien',
      status: 'Accepted',
      date: today,
      deciders: 'Security Engineer, Lead Architect',
      context: `Aplikasi mengelola data sensitif dan memerlukan otentikasi aman tanpa menyimpan session state di memori server agar backend dapat diskalakan secara horizontal (*stateless scaling*).`,
      decision: `Menerapkan JSON Web Token (JWT) dengan pola Short-Lived Access Token (15 menit) dan Refresh Token Rotation (7 hari) yang disimpan dengan atribut httpOnly secure cookie atau mekanisme penyimpanan terenkripsi.\nPassword pengguna di-hash menggunakan algoritma modern Argon2id atau Bcrypt dengan cost factor minimal 12.`,
      positiveConsequences: [
        'Server backend sepenuhnya stateless; autoscaling horizontal tidak memerlukan session stickiness.',
        'Pencurian access token memiliki jendela bahaya yang sangat sempit (15 menit).',
        'Dukungan penuh untuk Single Sign-On (SSO) dan microservice token forwarding.',
      ],
      negativeConsequences: [
        'Revokasi token instan memerlukan blacklist layer di Redis cache.',
        'Klien perlu mengimplementasikan silent token refresh interceptor di sisi frontend.',
      ],
      markdown: '',
    },
    {
      id: 'adr-0005',
      number: 5,
      filename: '0005-caching-and-high-concurrency-resilience.md',
      title: 'Strategi Caching & Ketahanan Beban Puncak',
      status: 'Accepted',
      date: today,
      deciders: 'DevOps / SRE Lead, Tech Lead',
      context: `Lonjakan traffic tiba-tiba berisiko menyebabkan kehabisan koneksi database (*thundering herd / connection exhaustion*) dan degradasi p95 latency di atas batas target ${model.metrics || '200ms'}.`,
      decision: `Menerapkan in-memory cache layer (Redis Cluster) menggunakan pola Cache-Aside pattern dengan Time-to-Live (TTL) terukur.\nEndpoint baca berfrekuensi tinggi dilayani dari Redis, sementara mutasi data memicu event-driven cache invalidation. Seluruh endpoint dilindungi Sliding Window Rate Limiting (120 req/menit per IP).`,
      positiveConsequences: [
        'Beban query ke database utama berkurang hingga 80-90% pada beban puncak.',
        'p95 read latency turun signifikan di bawah 20ms untuk data ter-cache.',
        'Perlindungan dari serangan brute-force dan DoS flooding via rate limiting.',
      ],
      negativeConsequences: [
        'Risiko *stale data* jika invalidasi cache tidak tertangani dengan sempurna.',
        'Menambah komponen infrastruktur baru yang harus dipantau dan di-maintain (Redis).',
      ],
      markdown: '',
    },
  ]

  // Render full MADR markdown format for each record
  for (const adr of adrs) {
    adr.markdown = `# ${adr.number}. ${adr.title}

* **Status:** ${adr.status}
* **Deciders:** ${adr.deciders}
* **Date:** ${adr.date}
* **System Scope:** ${title}

## Context and Problem Statement
${adr.context}

## Decision Drivers
* Kecepatan eksekusi dan skalabilitas sistem.
* Keamanan data dan kepatuhan standar industri.
* Kemudahan pemeliharaan dan isolasi bug antarlapisan.

## Considered Options
1. **Pilihan Utama (Diadopsi):** Solusi terstruktur dengan jaminan integritas tinggi.
2. **Pilihan Alternatif:** Pola monolitik minim struktur atau NoSQL tanpa skema kaku.

## Decision Outcome
Chosen option: **"${adr.title}"**, karena:
${adr.decision}

## Positive Consequences
${adr.positiveConsequences.map((c) => `* ${c}`).join('\n')}

## Negative Consequences & Trade-offs
${adr.negativeConsequences.map((c) => `* ${c}`).join('\n')}

## Compliance & Verification
* Arsitektur diverifikasi pada build CI/CD dengan static type-check dan automated test matrix.
* Dokumen ini menjadi rujukan baku dalam setiap code review pull-request baru.
`
  }

  return adrs
}

/**
 * Download a single ADR markdown file
 */
export function downloadAdrFile(adr: AdrRecord): void {
  const blob = new Blob([adr.markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = adr.filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
