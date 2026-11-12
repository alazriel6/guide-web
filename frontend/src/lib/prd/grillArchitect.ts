/**
 * Grill My Architecture Engine
 * Stress-tests system design and architecture specifications against real-world production hazards:
 * 50,000+ RPS concurrency, single points of failure (SPOF), database locking, cascading timeouts, and security gaps.
 */

import type { PrdModel } from './sections'

export type VulnerabilitySeverity = 'critical' | 'warning' | 'strength'
export type ArchitecturePillar =
  | 'concurrency'
  | 'database'
  | 'spof'
  | 'security'
  | 'resilience'
  | 'observability'

export interface ArchitectureFinding {
  id: string
  pillar: ArchitecturePillar
  severity: VulnerabilitySeverity
  title: string
  scenario: string
  vulnerability: string
  recommendation: string
  suggestedNfrPatch?: string
  suggestedConstraintPatch?: string
}

export interface GrillReport {
  score: number // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
  summary: string
  strengthsCount: number
  warningsCount: number
  criticalCount: number
  findings: ArchitectureFinding[]
  suggestedNfrAdditions: string[]
  suggestedConstraintAdditions: string[]
}

/**
 * Evaluates active PrdModel against production stress-test vectors
 */
export function grillArchitecture(model: PrdModel): GrillReport {
  const stack = (model.stack || '').toLowerCase()
  const dataModels = (model.data_models || '').toLowerCase()
  const apiContract = (model.api_contract || '').toLowerCase()
  const nfr = (model.nfr || '').toLowerCase()
  const constraints = (model.constraints || '').toLowerCase()
  const flows = (model.flows || '').toLowerCase()

  const findings: ArchitectureFinding[] = []

  // PILLAR 1: Concurrency & Caching (50k RPS Traffic Spike)
  const hasRedis = stack.includes('redis') || nfr.includes('redis') || constraints.includes('cache') || stack.includes('memcached')
  const hasQueue = stack.includes('kafka') || stack.includes('rabbit') || stack.includes('bull') || stack.includes('sqs') || stack.includes('queue')
  const hasRateLimit = nfr.includes('rate limit') || constraints.includes('rate limit') || apiContract.includes('rate-limit') || apiContract.includes('429')

  if (!hasRedis) {
    findings.push({
      id: 'missing-caching-layer',
      pillar: 'concurrency',
      severity: 'critical',
      title: 'Ketiadaan Caching Layer (Ancaman Database Thundering Herd)',
      scenario: 'Lonjakan traffic 50.000 RPS atau flash sale langsung membombardir database utama.',
      vulnerability: 'Setiap request membaca langsung ke database relasional. Connection pool database akan habis dalam hitungan detik dan menimbulkan cascading timeout HTTP 504.',
      recommendation: 'Implementasikan Redis / In-Memory Cache dengan Cache-Aside pattern dan TTL terukur untuk endpoint baca frekuensi tinggi.',
      suggestedNfrPatch: '- Caching: Redis Cluster dengan eviction policy allkeys-lru; p99 read cache hit > 85%',
      suggestedConstraintPatch: '- Wajib membaca data statis/semi-statis via Redis Cache sebelum menyentuh database utama',
    })
  } else {
    findings.push({
      id: 'caching-present',
      pillar: 'concurrency',
      severity: 'strength',
      title: 'Caching Terdefinisi',
      scenario: 'High throughput read workloads.',
      vulnerability: '',
      recommendation: 'Pertahankan invalidasi cache yang ketat (misal: event-driven cache evict).',
    })
  }

  if (hasQueue) {
    findings.push({
      id: 'queue-present',
      pillar: 'concurrency',
      severity: 'strength',
      title: 'Async Message Queue Terdefinisi',
      scenario: 'High burst write loads and background decoupling.',
      vulnerability: '',
      recommendation: 'Pastikan dead-letter queue (DLQ) dan retry backoff dikonfigurasi.',
    })
  }

  if (!hasRateLimit) {
    findings.push({
      id: 'missing-rate-limiter',
      pillar: 'concurrency',
      severity: 'critical',
      title: 'Ketiadaan Rate Limiting (Risiko DoS & Resource Exhaustion)',
      scenario: 'Bot scraping atau penyerang mengirimkan jutaan request per menit tanpa hambatan.',
      vulnerability: 'Server akan kehabisan worker thread dan memori, menyebabkan downtime total bagi seluruh pengguna normal.',
      recommendation: 'Terapkan Token Bucket / Leaky Bucket rate limiter di tingkat API Gateway (misal: 100 req/menit per IP/JWT).',
      suggestedNfrPatch: '- Rate Limiting: 120 req/menit per IP untuk public endpoints; 1.000 req/menit untuk authenticated clients dengan HTTP 429 Too Many Requests response',
      suggestedConstraintPatch: '- Seluruh endpoint publik wajib dilindungi rate limiter berbasis Redis Sliding Window',
    })
  } else {
    findings.push({
      id: 'rate-limit-present',
      pillar: 'concurrency',
      severity: 'strength',
      title: 'Rate Limiting Terdefinisi',
      scenario: 'Brute-force and API flooding mitigation.',
      vulnerability: '',
      recommendation: 'Pastikan status HTTP 429 menyertakan header Retry-After.',
    })
  }

  // PILLAR 2: Database Bottlenecks, Indexing & N+1 Queries
  const hasPagination = apiContract.includes('page') || apiContract.includes('limit') || apiContract.includes('cursor') || flows.includes('pagination')
  const hasDbIndexes = dataModels.includes('index') || dataModels.includes('(fk)') || constraints.includes('index')

  if (!hasPagination && apiContract.includes('get /api')) {
    findings.push({
      id: 'unbounded-query-pagination',
      pillar: 'database',
      severity: 'critical',
      title: 'Query Database Tanpa Batas (Unbounded List Query)',
      scenario: 'Tabel tumbuh dari 1.000 menjadi 500.000 record di database produksi.',
      vulnerability: 'Endpoint GET tanpa pagination memaksa database melakukan Full Table Scan, memuat jutaan objek ke memori Node.js/Go dan memicu Out of Memory (OOM Crash).',
      recommendation: 'Wajibkan keyset/cursor-based pagination atau default limit 20 (max limit 100) untuk seluruh endpoint koleksi.',
      suggestedNfrPatch: '- Pagination: Wajib cursor-based / limit-offset pagination (default limit: 20, max limit: 100) pada seluruh endpoint GET daftar data',
      suggestedConstraintPatch: '- Dilarang mengeksekusi SELECT * tanpa klausa LIMIT eksplisit',
    })
  }

  if (!hasDbIndexes) {
    findings.push({
      id: 'unindexed-foreign-keys',
      pillar: 'database',
      severity: 'warning',
      title: 'Ketiadaan Spesifikasi Indexing Foreign Key & Filter',
      scenario: 'Operasi JOIN relasional antar entitas data pada beban puncak.',
      vulnerability: 'Query JOIN pada foreign key yang tidak memiliki index B-Tree akan menurunkan performa query dari O(log N) menjadi O(N) sequential scan.',
      recommendation: 'Buat index eksplisit pada seluruh kolom foreign key (*_id) dan kolom status yang sering difilter.',
      suggestedNfrPatch: '- Database Performance: Seluruh kolom foreign key dan filter status wajib memiliki B-Tree index',
      suggestedConstraintPatch: '- Setiap relasi tabel wajib dilengkapi indeks pendukung untuk mencegah sequential table scan',
    })
  }

  // PILLAR 3: Single Point of Failure (SPOF) & High Availability
  const hasReplicaOrCluster = stack.includes('replica') || nfr.includes('replica') || stack.includes('cluster') || nfr.includes('multi-az') || nfr.includes('failover')
  const hasStateless = nfr.includes('stateless') || constraints.includes('stateless')

  if (!hasReplicaOrCluster) {
    findings.push({
      id: 'single-point-of-failure-db',
      pillar: 'spof',
      severity: 'warning',
      title: 'Risiko Single Point of Failure (SPOF) Database',
      scenario: 'Node database primer mengalami crash hardware atau reboot maintenance.',
      vulnerability: 'Jika hanya menggunakan satu instance database mandiri, seluruh aplikasi akan lumpuh total tanpa failover otomatis.',
      recommendation: 'Terapkan Primary-Replica replication dengan automated health probing dan failover.',
      suggestedNfrPatch: '- High Availability: Database dengan 1 Primary (Write) dan minimal 1 Read Replica dengan failover otomatis (< 30 detik)',
      suggestedConstraintPatch: '- Arsitektur backend memisahkan connection pool untuk Write (Primary) dan Read (Replica)',
    })
  }

  if (hasStateless) {
    findings.push({
      id: 'stateless-arch-present',
      pillar: 'spof',
      severity: 'strength',
      title: 'Arsitektur Stateless Server Terdefinisi',
      scenario: 'Horizontal autoscaling.',
      vulnerability: '',
      recommendation: 'Pertahankan penyimpanan session di luar memori server.',
    })
  }

  // PILLAR 4: Security, Authentication & Data Boundary
  const hasSqlSanitize = constraints.includes('parameter') || constraints.includes('injection') || constraints.includes('orm') || stack.includes('prisma') || stack.includes('gorm')
  const hasJwtRotation = constraints.includes('refresh') || nfr.includes('refresh') || constraints.includes('rotation') || apiContract.includes('refresh')

  if (!hasSqlSanitize) {
    findings.push({
      id: 'sql-injection-risk',
      pillar: 'security',
      severity: 'critical',
      title: 'Ketiadaan Aturan Parameterized Query Eksplisit',
      scenario: 'Penyerang menyuntikkan karakter berbahaya pada payload atau parameter pencarian.',
      vulnerability: 'Potensi kerentanan SQL Injection yang dapat mengekstrak seluruh data kredensial pengguna atau menghapus tabel.',
      recommendation: 'Wajibkan prepared statements / parameterized queries atau ORM bertipe ketat. Larang konkatenasi string SQL.',
      suggestedNfrPatch: '- Keamanan Data: 100% query database menggunakan prepared statements / parameterized query; zero inline string concatenation',
      suggestedConstraintPatch: '- Dilarang keras menggabungkan string raw SQL tanpa parameter binding',
    })
  } else {
    findings.push({
      id: 'sql-injection-protected',
      pillar: 'security',
      severity: 'strength',
      title: 'Perlindungan Injeksi Query Terdefinisi',
      scenario: 'Secure database interactions.',
      vulnerability: '',
      recommendation: 'Jaga kepatuhan audit keamanan berkala.',
    })
  }

  if (!hasJwtRotation && (apiContract.includes('login') || apiContract.includes('auth'))) {
    findings.push({
      id: 'jwt-refresh-rotation',
      pillar: 'security',
      severity: 'warning',
      title: 'Token JWT Tanpa Mekanisme Refresh & Revokasi',
      scenario: 'Token akses klien tercuri via XSS atau network sniffing.',
      vulnerability: 'Jika access token memiliki masa berlaku panjang tanpa refresh token rotation dan blacklist revocation, penyerang memiliki akses permanen.',
      recommendation: 'Gunakan short-lived access token (15 menit) dipasangkan dengan refresh token berkala (rotation & revocation di Redis).',
      suggestedNfrPatch: '- Autentikasi: Short-lived Access Token (15 menit) + Refresh Token Rotation (7 hari) dengan blacklist Redis',
      suggestedConstraintPatch: '- Refresh token wajib dirotasi pada setiap pembaruan token; token lama langsung dibatalkan',
    })
  }

  // PILLAR 5: Resilience, Timeouts & Circuit Breakers
  const hasTimeouts = nfr.includes('timeout') || constraints.includes('timeout')
  const hasHealthcheck = apiContract.includes('health') || nfr.includes('health') || constraints.includes('healthz')

  if (!hasTimeouts) {
    findings.push({
      id: 'missing-client-server-timeouts',
      pillar: 'resilience',
      severity: 'warning',
      title: 'Ketiadaan Batas Waktu (Timeout) Eksplisit',
      scenario: 'Layanan pihak ketiga (payment/email/SMS) mengalami kelambatan atau hang.',
      vulnerability: 'Koneksi HTTP yang menggantung tanpa timeout akan menghabiskan socket descriptor dan memicu thread starvation pada seluruh aplikasi.',
      recommendation: 'Tetapkan batas waktu ketat: HTTP client timeout 5 detik, database query timeout 3 detik.',
      suggestedNfrPatch: '- Resilience: Egress HTTP timeout maksimal 5 detik; Database query timeout maksimal 3 detik',
      suggestedConstraintPatch: '- Seluruh panggilan jaringan eksternal wajib dibungkus Context Timeout',
    })
  }

  if (!hasHealthcheck) {
    findings.push({
      id: 'missing-health-probe',
      pillar: 'resilience',
      severity: 'warning',
      title: 'Ketiadaan Endpoint Healthcheck (/healthz /readyz)',
      scenario: 'Load balancer atau orchestrator (Docker/K8s) mendeteksi node yang mengalami deadlock.',
      vulnerability: 'Tanpa health probe liveness/readiness yang memvalidasi koneksi database, traffic akan terus dikirim ke instance yang rusak.',
      recommendation: 'Sediakan endpoint GET /healthz (liveness) dan GET /readyz (readiness cek koneksi DB & Cache).',
      suggestedNfrPatch: '- Observabilitas: Endpoint GET /healthz dan GET /readyz wajib memverifikasi koneksi database aktif',
      suggestedConstraintPatch: '- Load balancer wajib menghentikan routing traffic jika /readyz mengembalikan non-200',
    })
  }

  // Calculate score
  let criticalCount = 0
  let warningsCount = 0
  let strengthsCount = 0

  for (const f of findings) {
    if (f.severity === 'critical') criticalCount++
    else if (f.severity === 'warning') warningsCount++
    else if (f.severity === 'strength') strengthsCount++
  }

  // Base score 100, -20 per critical, -10 per warning, +5 per strength (capped at 100)
  let calculatedScore = 100 - criticalCount * 22 - warningsCount * 10 + strengthsCount * 5
  calculatedScore = Math.max(15, Math.min(100, calculatedScore))

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'C'
  if (calculatedScore >= 95) grade = 'A+'
  else if (calculatedScore >= 85) grade = 'A'
  else if (calculatedScore >= 70) grade = 'B'
  else if (calculatedScore >= 55) grade = 'C'
  else if (calculatedScore >= 40) grade = 'D'
  else grade = 'F'

  // Summary message in clean Indonesian
  let summary = ''
  if (calculatedScore >= 90) {
    summary = 'Arsitektur sangat tangguh dan siap menghadapi lonjakan traffic tinggi dengan proteksi berlapis.'
  } else if (calculatedScore >= 70) {
    summary = 'Arsitektur cukup solid untuk fase MVP, namun terdapat celah skalabilitas dan konkurensi yang perlu dimitigasi sebelum rilis publik.'
  } else {
    summary = 'Ditemukan potensi bottleneck kritis! Tanpa caching, rate limiting, dan batasan query, sistem berisiko crash saat traffic melonjak.'
  }

  const suggestedNfrAdditions = findings
    .map((f) => f.suggestedNfrPatch)
    .filter((p): p is string => Boolean(p))

  const suggestedConstraintAdditions = findings
    .map((f) => f.suggestedConstraintPatch)
    .filter((p): p is string => Boolean(p))

  return {
    score: calculatedScore,
    grade,
    summary,
    strengthsCount,
    warningsCount,
    criticalCount,
    findings,
    suggestedNfrAdditions,
    suggestedConstraintAdditions,
  }
}

/**
 * Injects recommended hardening patches into the PrdModel
 */
export function applyGrillFixesToModel(
  model: PrdModel,
  report: GrillReport,
): PrdModel {
  const currentNfr = model.nfr || ''
  const currentConstraints = model.constraints || ''

  const newNfrLines = report.suggestedNfrAdditions.filter(
    (line) => !currentNfr.toLowerCase().includes(line.toLowerCase().slice(0, 20)),
  )

  const newConstraintLines = report.suggestedConstraintAdditions.filter(
    (line) => !currentConstraints.toLowerCase().includes(line.toLowerCase().slice(0, 20)),
  )

  const updatedNfr = currentNfr
    ? `${currentNfr.trim()}\n${newNfrLines.join('\n')}`
    : newNfrLines.join('\n')

  const updatedConstraints = currentConstraints
    ? `${currentConstraints.trim()}\n${newConstraintLines.join('\n')}`
    : newConstraintLines.join('\n')

  return {
    ...model,
    nfr: updatedNfr,
    constraints: updatedConstraints,
  }
}
