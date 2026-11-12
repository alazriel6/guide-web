export type VaultCategory =
  | 'all'
  | 'web'
  | 'backend'
  | 'mobile'
  | 'desktop'
  | 'game'
  | 'systems'
  | 'database'
  | 'devops'
  | 'algorithms'

export interface VaultSnippet {
  id: string
  title: string
  category: VaultCategory
  platform: string
  badgeColor?: string
  description: string
  setupSteps?: string[]
  folderStructure?: string
  cliCommands?: { label: string; cmd: string }[]
  codeSnippet: string
  language: string
  keyTakeaways: string[]
  gotchas?: string[]
  scaffoldTargetId?: string
  tags: string[]
  docsUrl?: string
}

export interface HttpStatusRef {
  code: number
  name: string
  category: '2xx Success' | '4xx Client Error' | '5xx Server Error'
  whenToUse: string
}

export interface BigORef {
  notation: string
  name: string
  verdict: 'fast' | 'moderate' | 'slow'
  realWorldExample: string
  opsAtOneMillion: string
}

export const HTTP_STATUS_CHEATSHEET: HttpStatusRef[] = [
  { code: 200, name: 'OK', category: '2xx Success', whenToUse: 'GET, PUT, atau PATCH berhasil mengembalikan data.' },
  { code: 201, name: 'Created', category: '2xx Success', whenToUse: 'POST berhasil menyimpan record baru ke database.' },
  { code: 204, name: 'No Content', category: '2xx Success', whenToUse: 'DELETE berhasil menghapus data (tanpa body JSON).' },
  { code: 400, name: 'Bad Request', category: '4xx Client Error', whenToUse: 'Format JSON rusak atau query parameter tidak valid.' },
  { code: 401, name: 'Unauthorized', category: '4xx Client Error', whenToUse: 'Belum login / Header Authorization Bearer token tidak ada.' },
  { code: 403, name: 'Forbidden', category: '4xx Client Error', whenToUse: 'Sudah login, tetapi role tidak punya izin (misal member akses admin).' },
  { code: 404, name: 'Not Found', category: '4xx Client Error', whenToUse: 'ID data yang dicari tidak ditemukan di database.' },
  { code: 409, name: 'Conflict', category: '4xx Client Error', whenToUse: 'Data duplikat (email/slug sudah terdaftar di DB).' },
  { code: 422, name: 'Unprocessable Entity', category: '4xx Client Error', whenToUse: 'Gagal validasi input (password < 8 karakter, format email salah).' },
  { code: 429, name: 'Too Many Requests', category: '4xx Client Error', whenToUse: 'Terkena Rate Limiter akibat spam request.' },
  { code: 500, name: 'Internal Server Error', category: '5xx Server Error', whenToUse: 'Crash / bug tidak tertangani di backend atau koneksi DB putus.' },
]

export const BIG_O_CHEATSHEET: BigORef[] = [
  { notation: 'O(1)', name: 'Constant Time', verdict: 'fast', realWorldExample: 'Akses HashMap / Object key (map.get(id)), Array index arr[0]', opsAtOneMillion: '1 operasi (Instan)' },
  { notation: 'O(log n)', name: 'Logarithmic', verdict: 'fast', realWorldExample: 'Binary Search, Query SQL dengan B-Tree Index (WHERE id = 500)', opsAtOneMillion: '~20 operasi (Sangat Cepat)' },
  { notation: 'O(n)', name: 'Linear Time', verdict: 'fast', realWorldExample: 'Satu kali loop (arr.filter, arr.map, SQL Full Table Scan)', opsAtOneMillion: '1.000.000 operasi (Cepat)' },
  { notation: 'O(n log n)', name: 'Linearithmic', verdict: 'moderate', realWorldExample: 'Sorting standar (arr.sort, Merge Sort, Quick Sort)', opsAtOneMillion: '~20 Juta operasi (Sedang)' },
  { notation: 'O(n²)', name: 'Quadratic', verdict: 'slow', realWorldExample: 'Nested Loop (for di dalam for, masalah N+1 Query di ORM)', opsAtOneMillion: '1 Triliun operasi (BAHAYA FREEZE!)' },
]

export const VAULT_CATEGORIES: { id: VaultCategory; name: string; count?: number }[] = [
  { id: 'all', name: 'All Ecosystems' },
  { id: 'web', name: 'Web & Frontend' },
  { id: 'backend', name: 'Backend & APIs' },
  { id: 'mobile', name: 'Mobile (iOS & Android)' },
  { id: 'desktop', name: 'Desktop Apps' },
  { id: 'game', name: 'Game Development' },
  { id: 'systems', name: 'Systems & Low-Level' },
  { id: 'database', name: 'Databases & Cache' },
  { id: 'devops', name: 'DevOps, Cloud & Git' },
  { id: 'algorithms', name: 'Core Algorithms & Utils' },
]

export const VAULT_ENTRIES: VaultSnippet[] = [
  // -------------------------------------------------------------
  // WEB & FRONTEND
  // -------------------------------------------------------------
  {
    id: 'vue3-composition',
    title: 'Vue 3: Script Setup, Pinia & Async Service',
    category: 'web',
    platform: 'Vue 3 + Vite',
    description:
      'Pola modern Vue 3 menggunakan script setup, reactive state Pinia, computed getters, dan pemanggilan API Axios dengan TypeScript strict typing.',
    setupSteps: [
      'Jalankan npm create vue@latest my-vue-app (Pilih: TypeScript, Vue Router, Pinia, ESLint).',
      'Masuk ke folder proyek: cd my-vue-app && npm install.',
      'Install HTTP client & icon: npm install axios lucide-vue-next.',
      'Jalankan dev server: npm run dev (buka http://localhost:5173).',
    ],
    folderStructure: `src/
├── components/     # Komponen UI reusable (Button, Modal, Card)
├── views/          # Halaman rute utama (HomeView, DashboardView)
├── stores/         # State global Pinia (useUserStore.ts)
├── services/       # Axios instance & modul API (api.ts)
└── router/         # Definisi rute & auth guard (index.ts)`,
    cliCommands: [
      { label: 'Create App', cmd: 'npm create vue@latest my-vue-app' },
      { label: 'Install Deps', cmd: 'npm install axios pinia vue-router' },
      { label: 'Run Dev', cmd: 'npm run dev' },
      { label: 'Build Prod', cmd: 'npm run build' },
    ],
    language: 'typescript',
    codeSnippet: `<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'

interface Props {
  workspaceId: string
  autoRefresh?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: false,
})

const emit = defineEmits<{
  (e: 'updated', count: number): void
}>()

const userStore = useUserStore()
const searchKeyword = ref('')
const isLoading = ref(false)

const filteredItems = computed(() => {
  return userStore.items.filter(i => 
    i.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

onMounted(async () => {
  isLoading.value = true
  await userStore.fetchWorkspaceItems(props.workspaceId)
  isLoading.value = false
  emit('updated', filteredItems.value.length)
})
</script>`,
    keyTakeaways: [
      'Gunakan defineProps dan defineEmits dengan generic type-only declaration.',
      'Computed property bersifat reaktif dan otomatis di-cache.',
      'Pinia menggantikan Vuex untuk state management yang 100% typed.',
    ],
    scaffoldTargetId: 'vue-vite',
    gotchas: [
          "Lupa menulis .value saat membaca atau mengubah ref() di blok <script> (di template auto-unwrap, tapi di script wajib .value).",
          "Destructuring props langsung tanpa toRefs() memutus reaktivitas variabel.",
          "Menggunakan v-for tanpa :key unik menyebabkan rendering glitch saat urutan array berubah."
    ],
    tags: ['Vue 3', 'TypeScript', 'Pinia', 'Vite', 'Frontend'],
    docsUrl: 'https://vuejs.org/guide/introduction.html',
  },
  {
    id: 'react19-server-actions',
    title: 'React 19 & Next.js 15: Server Actions & App Router',
    category: 'web',
    platform: 'React 19 / Next.js 15',
    description:
      'Pola mutasi data modern di React 19 menggunakan Server Actions, useActionState, dan pending state tanpa perlu membuat REST route handler manual.',
    setupSteps: [
      'Jalankan npx create-next-app@latest my-app --typescript --tailwind --app.',
      'Tambahkan validasi & ORM: npm install zod @prisma/client zustand.',
      'Inisialisasi database schema: npx prisma init.',
      'Jalankan dev server: npm run dev (http://localhost:3000).',
    ],
    folderStructure: `app/
├── (auth)/login/page.tsx   # Grup rute autentikasi
├── dashboard/
│   ├── page.tsx            # Server Component (fetch DB langsung)
│   └── loading.tsx         # Skeleton UI otomatis saat transisi
├── actions/                # Server Actions ('use server')
└── api/webhooks/route.ts   # Endpoint REST untuk webhook pihak ke-3`,
    cliCommands: [
      { label: 'Create Next App', cmd: 'npx create-next-app@latest my-app --typescript --tailwind --app' },
      { label: 'Run Dev', cmd: 'npm run dev' },
      { label: 'Build Prod', cmd: 'npm run build && npm run start' },
    ],
    language: 'typescript',
    codeSnippet: `'use server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

export async function createWorkspaceAction(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  if (!name || name.trim().length < 3) {
    return { error: 'Nama workspace minimal 3 karakter' }
  }

  try {
    const ws = await db.workspace.create({
      data: { name, slug: name.toLowerCase().replace(/\\s+/g, '-') }
    })
    revalidatePath('/workspaces')
    return { success: true, data: ws }
  } catch (err: any) {
    return { error: 'Gagal membuat workspace: ' + err.message }
  }
}`,
    keyTakeaways: [
      'Direktif "use server" di bagian atas fungsi menandai eksekusi aman di server.',
      'revalidatePath otomatis membersihkan cache halaman Next.js secara instan.',
      'Gunakan Zod untuk validasi formData sebelum insert ke database.',
    ],
    scaffoldTargetId: 'nextjs-fullstack',
    gotchas: [
          "Server Actions yang tidak memvalidasi session/auth di baris pertama dapat ditembak siapa saja via HTTP POST.",
          "Mengoper callback function dari Server Component ke Client Component memicu error serialisasi wire protocol.",
          "Lupa menulis \"use client\" di baris paling atas komponen yang memakai useState, useEffect, atau browser hooks."
    ],
    tags: ['React 19', 'Next.js', 'Server Actions', 'Fullstack', 'TypeScript'],
    docsUrl: 'https://nextjs.org/docs',
  },
  {
    id: 'svelte5-runes',
    title: 'Svelte 5: Modern Runes ($state, $derived, $effect)',
    category: 'web',
    platform: 'Svelte 5 + SvelteKit',
    description:
      'Sintaks reaktif terbaru Svelte 5 yang menggantikan let dan $: menggunakan Runes untuk performa ultra-cepat tanpa virtual DOM.',
    setupSteps: [
      'Buat proyek SvelteKit: npx sv create my-svelte-app.',
      'Pilih template SvelteKit minimal + TypeScript.',
      'Install dependencies & jalankan: cd my-svelte-app && npm install && npm run dev.',
    ],
    folderStructure: `src/
├── routes/
│   ├── +page.svelte        # Halaman UI utama
│   ├── +page.server.ts     # Load data & form actions di server
│   └── +layout.svelte      # Wrapper navigasi global
└── lib/
    └── components/         # Komponen Svelte reusable`,
    cliCommands: [
      { label: 'Create Svelte App', cmd: 'npx sv create my-svelte-app' },
      { label: 'Run Dev', cmd: 'npm run dev' },
    ],
    language: 'javascript',
    codeSnippet: `<script>
  let count = $state(0);
  let multiplier = $state(2);
  let total = $derived(count * multiplier);

  $effect(() => {
    console.log(\`Count berubah menjadi: \${count}, Total: \${total}\`);
  });

  function increment() {
    count += 1;
  }
</script>

<button onclick={increment}>
  Clicks: {count} | Total: {total}
</button>`,
    keyTakeaways: [
      '$state() mendeklarasikan variabel reaktif.',
      '$derived() menggantikan sintaks $: lama untuk computed state.',
      '$effect() mengeksekusi side-effect saat dependency berubah.',
    ],
    gotchas: [
          "Menggunakan sintaks let count = 0 lama (Svelte 4) alih-alih let count = $state(0) tidak akan memicu re-render di Svelte 5.",
          "Mengubah properti di dalam objek $state tanpa $state.raw jika menginginkan referensi objek immutable."
    ],
    tags: ['Svelte', 'Svelte 5', 'Runes', 'Frontend', 'Reactivity'],
    docsUrl: 'https://svelte.dev/docs',
  },
  {
    id: 'angular18-signals',
    title: 'Angular 18+: Signals, Standalone & Built-in Control Flow',
    category: 'web',
    platform: 'Angular 18+',
    description:
      'Arsitektur enterprise frontend modern dengan Standalone Components (tanpa NgModule), reaktivitas Signals, dan blok @if / @for baru.',
    setupSteps: [
      'Jalankan npx @angular/cli@latest new my-ng-app --standalone --routing --style=scss.',
      'Masuk direktori: cd my-ng-app && npm start (buka http://localhost:4200).',
      'Generate komponen baru: npx ng g c features/order-list.',
    ],
    folderStructure: `src/app/
├── core/           # Singleton services, AuthInterceptor, Guards
├── features/       # Modul fitur standalone (orders/, users/)
├── shared/         # Komponen UI bersama (button, modal, pipes)
├── app.routes.ts   # Lazy-loaded routing table
└── app.config.ts   # Provider HTTP & router global`,
    cliCommands: [
      { label: 'New Project', cmd: 'npx @angular/cli@latest new my-ng-app --standalone' },
      { label: 'Generate Comp', cmd: 'npx ng generate component features/dashboard' },
      { label: 'Run Server', cmd: 'npm start' },
    ],
    language: 'typescript',
    codeSnippet: `import { Component, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-inventory',
  standalone: true,
  template: \`
    <div class="toolbar">
      <button (click)="addStock()">Tambah Stok ({{ quantity() }})</button>
      <span>Total Nilai: Rp {{ totalPrice() }}</span>
    </div>
    @if (quantity() === 0) {
      <p class="warn">Stok kosong!</p>
    } @else {
      <p class="ok">Stok tersedia siap kirim.</p>
    }
  \`
})
export class InventoryComponent {
  private http = inject(HttpClient);
  quantity = signal(5);
  unitPrice = signal(150000);
  totalPrice = computed(() => this.quantity() * this.unitPrice());

  addStock() {
    this.quantity.update(q => q + 1);
  }
}`,
    keyTakeaways: [
      'signal() dan computed() memberikan update DOM yang presisi tanpa beban Zone.js.',
      'Fungsi inject() menggantikan constructor dependency injection yang panjang.',
      'Sintaks @if dan @for jauh lebih bersih dan cepat dibanding *ngIf dan *ngFor.',
    ],
    gotchas: [
          "Membaca nilai Signal tanpa tanda kurung () seperti count alih-alih count() hanya mengembalikan fungsi Signal bukan nilainya.",
          "Memodifikasi Signal di dalam effect() tanpa opsi allowSignalWrites: true memicu error runtime Angular."
    ],
    tags: ['Angular', 'Signals', 'TypeScript', 'Enterprise', 'Frontend'],
    docsUrl: 'https://angular.dev',
  },
  {
    id: 'css-modern-layouts',
    title: 'CSS3 Modern Layouts: Grid Auto-Fit, Flexbox & App Shell',
    category: 'web',
    platform: 'CSS3 / Tailwind',
    description:
      'Kumpulan pola layout CSS yang paling sering terlupakan: centering sempurna, grid kartu responsif otomatis tanpa media query, dan sticky sidebar shell.',
    setupSteps: [
      'Gunakan box-sizing: border-box pada seluruh elemen (*, *::before, *::after).',
      'Gunakan CSS Custom Properties (--bg, --surface, --text) di :root untuk tema gelap/terang.',
    ],
    cliCommands: [],
    language: 'css',
    codeSnippet: `/* 1. Reset Wajib di Setiap Proyek Web */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
}

/* 2. Centering Sempurna Vertikal & Horizontal (1 Baris!) */
.center-everything {
  display: grid;
  place-items: center;
  min-height: 100vh;
}

/* 3. Grid Kartu Responsif Otomatis TANPA @media query */
.auto-responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

/* 4. Dashboard Shell (Sidebar Kiri Tetap + Konten Kanan Scroll) */
.app-workbench {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}

/* 5. Potong Teks Panjang dengan Elipsis (...) Setelah 2 Baris */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}`,
    keyTakeaways: [
      'repeat(auto-fill, minmax(280px, 1fr)) otomatis mengatur jumlah kolom dari 4 -> 3 -> 2 -> 1 sesuai lebar layar.',
      'place-items: center pada CSS Grid adalah cara paling ringkas menaruh elemen tepat di tengah.',
      'Selalu tambahkan min-width: 0 pada anak Grid/Flex jika teks di dalamnya meluber keluar batas.',
    ],
    gotchas: [
          "Menggunakan 100vw untuk lebar container penuh sering memunculkan horizontal scrollbar liar karena lebar scrollbar browser ikut terhitung.",
          "Lupa memberikan flex-shrink: 0 pada icon di dalam flex row sehingga icon mengecil saat teks panjang.",
          "Z-index tidak bekerja tanpa properti position (relative, absolute, fixed, sticky)."
    ],
    tags: ['CSS', 'Flexbox', 'CSS Grid', 'Responsive', 'UI Design'],
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
  },
  {
    id: 'php-blade-templating',
    title: 'Blade Templating Engine: Cara Bikin View, Master Layout & Cara Menjalankan',
    category: 'web',
    platform: 'Laravel Blade (PHP 8.3)',
    description:
      'Panduan lengkap membuat antarmuka web dengan Blade Template Engine di Laravel. Meliputi master layout (@extends & @yield), child views (@section), reusable components (<x-alert>), passing data dari controller, dan integrasi asset Vite (@vite).',
    setupSteps: [
      'Pastikan proyek Laravel terpasang (composer create-project laravel/laravel my-app).',
      'Buat master layout di folder resources/views/layouts/app.blade.php.',
      'Sertakan directive @vite(["resources/css/app.css", "resources/js/app.js"]) di dalam tag <head>.',
      'Gunakan @yield("content") untuk menyediakan slot injeksi konten halaman anak.',
      'Buat halaman anak di resources/views/products/index.blade.php dengan @extends("layouts.app") dan @section("content").',
      'Render dari controller/route: return view("products.index", compact("products"));',
      'Jalankan server: terminal 1 jalankan "php artisan serve", terminal 2 jalankan "npm run dev" untuk live reload asset.',
    ],
    folderStructure: `resources/views/
├── layouts/
│   ├── app.blade.php       # Master layout utama (@yield('content'), @vite)
│   └── guest.blade.php     # Layout halaman publik / otentikasi
├── components/
│   ├── alert.blade.php     # Dipanggil via <x-alert type="success" />
│   └── navbar.blade.php    # Dipanggil via <x-navbar />
├── products/
│   ├── index.blade.php     # Daftar produk (@extends('layouts.app'))
│   └── create.blade.php    # Form input produk (@csrf)
└── partials/
    └── footer.blade.php    # Komponen modular di-include via @include('partials.footer')`,
    cliCommands: [
      { label: 'Run Laravel Server', cmd: 'php artisan serve --port=8000' },
      { label: 'Run Vite Live Reload', cmd: 'npm run dev' },
      { label: 'Make Blade Component', cmd: 'php artisan make:component Alert' },
      { label: 'Clear View Cache', cmd: 'php artisan view:clear' },
      { label: 'Pre-compile Views', cmd: 'php artisan view:cache' },
    ],
    language: 'html',
    codeSnippet: `<!-- 1. resources/views/layouts/app.blade.php (Master Layout) -->
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Aplikasi Laravel')</title>
    <!-- Asset Bundling via Vite (Tailwind CSS + Alpine.js / Vanilla JS) -->
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-gray-900 text-gray-100 min-h-screen">
    <header class="border-b border-gray-800 p-4">
        <nav class="max-w-7xl mx-auto flex justify-between items-center">
            <span class="font-bold text-orange-500">BlueprintDev</span>
            <div class="space-x-4">
                <a href="{{ route('products.index') }}" class="hover:text-orange-400">Produk</a>
            </div>
        </nav>
    </header>

    <main class="max-w-7xl mx-auto p-6">
        <!-- Flash Message Session -->
        @if(session('success'))
            <div class="mb-4 p-4 bg-emerald-900/50 border border-emerald-500 rounded text-emerald-200">
                {{ session('success') }}
            </div>
        @endif

        <!-- Slot Konten Dinamis -->
        @yield('content')
    </main>
</body>
</html>

<!-- 2. resources/views/products/index.blade.php (Child View) -->
@extends('layouts.app')

@section('title', 'Katalog Produk')

@section('content')
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Katalog Produk</h1>
        <a href="{{ route('products.create') }}" class="px-4 py-2 bg-orange-600 rounded hover:bg-orange-500 text-white font-medium">
            + Tambah Produk
        </a>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        @forelse($products as $product)
            <div class="p-4 bg-gray-800 border border-gray-700 rounded shadow">
                <h3 class="font-semibold text-lg">{{ $product->title }}</h3>
                <p class="text-orange-400 font-mono mt-2">Rp {{ number_format($product->price, 0, ',', '.') }}</p>
            </div>
        @empty
            <p class="text-gray-400 col-span-3">Belum ada data produk tersedia.</p>
        @endforelse
    </div>

    <div class="mt-6">
        {{ $products->links() }}
    </div>
@endsection`,
    keyTakeaways: [
      'Gunakan {{ $var }} untuk output aman ber-escaping HTML, dan {!! $var !!} hanya jika yakin aman dari XSS.',
      'Semua form method POST wajib menyertakan @csrf untuk mencegah serangan Cross-Site Request Forgery (Error 419).',
      '@forelse($items as $i) ... @empty ... @endforelse menggantikan kombinasi if-count dan foreach yang repetitif.',
      'Jalankan npm run dev dan php artisan serve secara bersamaan di terminal terpisah agar perubahan CSS/Blade langsung live reload di browser.',
    ],
    gotchas: [
      "Submit form menghasilkan error '419 Page Expired' karena lupa menyertakan directive @csrf di dalam tag <form>.",
      "Perubahan tampilan Blade tidak muncul di production: jalankan 'php artisan view:clear' untuk mereset cache view."
    ],
    tags: ['PHP', 'Laravel', 'Blade', 'Frontend', 'Templates', 'Web'],
    docsUrl: 'https://laravel.com/docs/11.x/blade',
  },

  // -------------------------------------------------------------
  // BACKEND & APIS
  // -------------------------------------------------------------
  {
    id: 'fastapi-pydantic',
    title: 'Python FastAPI: Async CRUD, Pydantic v2 & SQLAlchemy',
    category: 'backend',
    platform: 'Python 3.12 (FastAPI)',
    description:
      'Struktur REST API enterprise dengan validasi skema otomatis Pydantic v2, session async SQLAlchemy, dan auto-generated Swagger UI (/docs).',
    setupSteps: [
      'Buat folder & virtual env: mkdir backend && cd backend && python -m venv .venv.',
      'Aktifkan venv (Windows): .venv\\Scripts\\activate (Mac/Linux: source .venv/bin/activate).',
      'Install paket: pip install fastapi uvicorn[standard] pydantic[email] sqlalchemy asyncpg.',
      'Jalankan server: uvicorn main:app --reload --port 8000 (Cek Swagger di http://localhost:8000/docs).',
    ],
    folderStructure: `backend/
├── app/
│   ├── api/v1/         # Route handlers (users.py, auth.py)
│   ├── core/           # Config .env, JWT security, DB engine
│   ├── models/         # Tabel ORM SQLAlchemy
│   ├── schemas/        # Pydantic v2 Request/Response DTO
│   └── main.py         # Inisialisasi FastAPI & CORS
└── requirements.txt`,
    cliCommands: [
      { label: 'Create Venv', cmd: 'python -m venv .venv && .venv\\Scripts\\activate' },
      { label: 'Install', cmd: 'pip install fastapi uvicorn[standard] pydantic sqlalchemy asyncpg' },
      { label: 'Run Dev', cmd: 'uvicorn main:app --reload --port 8000' },
      { label: 'Freeze Deps', cmd: 'pip freeze > requirements.txt' },
    ],
    language: 'python',
    codeSnippet: `from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

app = FastAPI(title="Production Service", version="1.0.0")

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    model_config = {"from_attributes": True}

@app.post("/api/v1/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email sudah terdaftar.")
    return await save_new_user(db, payload)`,
    keyTakeaways: [
      'Pydantic v2 memvalidasi tipe data secara otomatis sebelum masuk ke fungsi handler.',
      'Buka /docs di browser untuk mencoba semua endpoint secara interaktif (Swagger UI otomatis).',
      'Gunakan status 409 Conflict saat menolak duplikasi email dan 422 untuk validasi input.',
    ],
    scaffoldTargetId: 'fullstack-fastapi-react',
    gotchas: [
          "Menulis rute async def tapi memanggil library blocking sinkron (seperti time.sleep() atau sync ORM) akan memacetkan event loop Uvicorn!",
          "Lupa menyertakan response_model sehingga field sensitif seperti password_hash ikut terkirim ke frontend.",
          "Default argument bertipe mutable (def handler(items=[])) akan berbagi state antar request user."
    ],
    tags: ['Python', 'FastAPI', 'Pydantic', 'SQLAlchemy', 'REST API'],
    docsUrl: 'https://fastapi.tiangolo.com',
  },
  {
    id: 'go-chi-rest',
    title: 'Go: High-Throughput REST, Chi Router & Context Timeout',
    category: 'backend',
    platform: 'Go 1.22+',
    description:
      'Backend Go standar produksi menggunakan chi router, context cancellation timeout 5 detik, struct tags JSON, dan response formatter terstruktur.',
    setupSteps: [
      'Buat direktori & modul: mkdir backend && cd backend && go mod init myapp/backend.',
      'Install router & driver DB: go get github.com/go-chi/chi/v5 github.com/jackc/pgx/v5.',
      'Buat entry point di cmd/api/main.go.',
      'Jalankan server: go run ./cmd/api/main.go.',
    ],
    folderStructure: `backend/
├── cmd/api/main.go       # Entry point & server bootstrap
├── internal/
│   ├── handlers/         # HTTP Handlers (decode JSON & kirim response)
│   ├── services/         # Logika bisnis murni
│   ├── repository/       # Query PostgreSQL (pgx / GORM)
│   └── middleware/       # Auth JWT, Logger, Recoverer
└── go.mod`,
    cliCommands: [
      { label: 'Init Module', cmd: 'go mod init myapp' },
      { label: 'Get Chi', cmd: 'go get github.com/go-chi/chi/v5' },
      { label: 'Run Server', cmd: 'go run main.go' },
      { label: 'Build Binary', cmd: 'go build -ldflags="-s -w" -o server main.go' },
    ],
    language: 'go',
    codeSnippet: `package main

import (
	"context"
	"encoding/json"
	"net/http"
	"time"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type Workspace struct {
	ID        string    \`json:"id"\`
	Name      string    \`json:"name"\`
	CreatedAt time.Time \`json:"created_at"\`
}

func GetWorkspaceHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	id := chi.URLParam(r, "id")
	ws := Workspace{ID: id, Name: "HQ Production", CreatedAt: time.Now()}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(ws)
}

func main() {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Get("/api/workspaces/{id}", GetWorkspaceHandler)
	http.ListenAndServe(":8080", r)
}`,
    keyTakeaways: [
      'Gunakan context.WithTimeout untuk mencegah goroutine gantung saat DB down.',
      'Chi router adalah standar industri Go karena kompatibel 100% dengan net/http standar.',
      'Huruf pertama field struct wajib Kapital (ID, Name) agar bisa di-export ke JSON.',
    ],
    scaffoldTargetId: 'fullstack-go-vue',
    gotchas: [
          "Menjalankan goroutine go func() yang mengakses shared variable tanpa sync.Mutex atau sync.RWMutex memicu data race fatal.",
          "Lupa memanggil defer resp.Body.Close() pada http.Get/Post memicu memory leak file descriptor.",
          "Unbuffered channel pada goroutine yang tidak dibaca listener akan menyebabkan Goroutine Leak / Deadlock."
    ],
    tags: ['Go', 'Golang', 'Chi', 'Backend', 'Microservices', 'High-Performance'],
    docsUrl: 'https://go.dev/doc/',
  },
  {
    id: 'node-express-ts-prisma',
    title: 'Node.js & Express (TypeScript): Zod Validation & Prisma ORM',
    category: 'backend',
    platform: 'Node.js 20+ / Express TS',
    description:
      'Arsitektur backend TypeScript modern menggunakan Express, validasi skema Zod yang ketat, Prisma ORM, dan centralized error middleware.',
    setupSteps: [
      'Inisialisasi proyek: npm init -y && npm pkg set type="module".',
      'Install paket utama: npm install express cors dotenv zod @prisma/client.',
      'Install dev tools: npm install -D typescript tsx @types/node @types/express prisma.',
      'Setup Prisma: npx prisma init --datasource-provider postgresql.',
      'Jalankan mode watch: npx tsx watch src/index.ts.',
    ],
    folderStructure: `backend/
├── prisma/schema.prisma   # Definisi model tabel & relasi DB
├── src/
│   ├── controllers/       # Handler request/response Express
│   ├── middlewares/       # Auth guard & global error handler
│   ├── routes/            # Definisi router per modul
│   ├── schemas/           # Validasi input Zod
│   └── index.ts           # Bootstrap Express app
└── package.json`,
    cliCommands: [
      { label: 'Install Core', cmd: 'npm i express cors dotenv zod @prisma/client' },
      { label: 'Install TS Dev', cmd: 'npm i -D typescript tsx @types/node @types/express prisma' },
      { label: 'Run Watch', cmd: 'npx tsx watch src/index.ts' },
      { label: 'Prisma Migrate', cmd: 'npx prisma migrate dev --name init' },
    ],
    language: 'typescript',
    codeSnippet: `import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const app = express();
app.use(express.json());

const CreateProductSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter'),
  price: z.number().int().positive('Harga harus positif'),
  category: z.enum(['saas', 'hardware', 'service']),
});

app.post('/api/v1/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreateProductSchema.parse(req.body);
    // Simpan ke DB via Prisma: const item = await prisma.product.create({ data: validated })
    res.status(201).json({ success: true, data: validated });
  } catch (err) {
    next(err);
  }
});

// Global Error Handler Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof z.ZodError) {
    return res.status(422).json({ success: false, error: err.flatten().fieldErrors });
  }
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});`,
    keyTakeaways: [
      'Gunakan tsx watch untuk menjalankan file TypeScript secara instan tanpa build manual.',
      'Zod.parse() otomatis melempar error terstruktur jika payload JSON dari user tidak valid.',
      'Selalu pasang Global Error Middleware di urutan paling bawah agar server tidak pernah crash.',
    ],
    scaffoldTargetId: 'fullstack-node-express',
    gotchas: [
          "Lupa return res.status(400).json(...) di middleware/handler memicu error \"Cannot set headers after they are sent to the client\".",
          "Menjalankan query di dalam loop for (N+1 query problem) alih-alih menggunakan Prisma include atau SQL WHERE IN.",
          "Tidak menangani error promise async/await dengan express-async-errors atau global error handler."
    ],
    tags: ['Node.js', 'Express', 'TypeScript', 'Prisma', 'Zod', 'Backend'],
    docsUrl: 'https://expressjs.com',
  },
  {
    id: 'rust-axum-tokio',
    title: 'Rust: Ultra-Low Latency Axum & Tokio Async Handler',
    category: 'backend',
    platform: 'Rust (Axum + Tokio)',
    description:
      'Server asynchronous tercepat dan aman memori menggunakan Rust Axum 0.7, serde JSON serialization, state sharing, dan strong type safety.',
    setupSteps: [
      'Buat binary crate baru: cargo new rust-api --bin && cd rust-api.',
      'Tambahkan Axum & Tokio: cargo add axum tokio --features tokio/full.',
      'Tambahkan Serde JSON: cargo add serde serde_json --features serde/derive.',
      'Jalankan server: cargo run.',
    ],
    folderStructure: `rust-api/
├── src/
│   ├── handlers/       # Fungsi async route Axum
│   ├── models/         # Struct Serde & SQLx FromRow
│   ├── state.rs        # AppState (Database Pool)
│   └── main.rs         # Tokio runtime & Router setup
└── Cargo.toml`,
    cliCommands: [
      { label: 'New Project', cmd: 'cargo new rust-api --bin' },
      { label: 'Add Crates', cmd: 'cargo add axum tokio --features tokio/full' },
      { label: 'Run Dev', cmd: 'cargo run' },
      { label: 'Release Build', cmd: 'cargo build --release' },
    ],
    language: 'rust',
    codeSnippet: `use axum::{
    routing::get,
    extract::Path,
    http::StatusCode,
    Json, Router,
};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
struct Task {
    id: u64,
    title: String,
    completed: bool,
}

async fn get_task(Path(id): Path<u64>) -> Result<Json<Task>, StatusCode> {
    Ok(Json(Task {
        id,
        title: "Integrasikan PRD Studio".into(),
        completed: false,
    }))
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/api/tasks/:id", get(get_task));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await.unwrap();
    println!("Server aktif di port 3000");
    axum::serve(listener, app).await.unwrap();
}`,
    keyTakeaways: [
      'Zero-cost abstractions: Rust menghasilkan binary terkecil dan tercepat tanpa garbage collector.',
      'Result<Json<T>, StatusCode> memaksa penanganan error secara eksplisit saat kompilasi.',
      'Tokio runtime mengeksekusi ribuan concurrent request dengan footprint RAM minimal.',
    ],
    scaffoldTargetId: 'fullstack-rust-axum',
    gotchas: [
          "Menggunakan .clone() berlebihan pada tipe data besar demi menghindari borrow checker yang memperlambat alokasi memori.",
          "Menjalankan operasi file I/O blocking (std::fs::read) di thread async Tokio tanpa tokio::task::spawn_blocking.",
          "Mengabaikan error Result dengan .unwrap() di production code yang memicu Panic / crash thread."
    ],
    tags: ['Rust', 'Axum', 'Tokio', 'Memory Safety', 'Backend', 'Systems'],
    docsUrl: 'https://docs.rs/axum/latest/axum/',
  },
  {
    id: 'csharp-dotnet-minimal',
    title: 'C# / .NET 8+: Minimal APIs & Entity Framework Core',
    category: 'backend',
    platform: 'C# (.NET 8 Core)',
    description:
      'Pembuatan REST API ultra-ringkas menggunakan .NET 8 Minimal APIs, dependency injection native, dan query async Entity Framework Core.',
    setupSteps: [
      'Buat project Web API: dotnet new webapi -minimal -o DotnetApi && cd DotnetApi.',
      'Install EF Core PostgreSQL: dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL.',
      'Jalankan dengan hot-reload: dotnet watch run.',
    ],
    cliCommands: [
      { label: 'New Web API', cmd: 'dotnet new webapi -minimal -o DotnetApi' },
      { label: 'Run Watch', cmd: 'dotnet watch run' },
      { label: 'Add Postgres EF', cmd: 'dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL' },
    ],
    language: 'csharp',
    codeSnippet: `var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<AppDbContext>();

var app = builder.Build();

app.MapGet("/api/products/{id:int}", async (int id, AppDbContext db) => {
    var product = await db.Products.FindAsync(id);
    return product is not null ? Results.Ok(product) : Results.NotFound();
});

app.MapPost("/api/products", async (ProductDto input, AppDbContext db) => {
    var item = new Product { Title = input.Title, Price = input.Price };
    db.Products.Add(item);
    await db.SaveChangesAsync();
    return Results.Created($"/api/products/{item.Id}", item);
});

app.Run();`,
    keyTakeaways: [
      'Minimal APIs memangkas boilerplate Controller dan Startup.cs lama.',
      'Results.Ok() dan Results.Created() mengembalikan status HTTP standar.',
      'dotnet watch memberikan hot-reload otomatis saat file C# di-save.',
    ],
    gotchas: [
          "Mendaftarkan DbContext sebagai Singleton (DbContext di EF Core wajib berumur Scoped per HTTP request).",
          "Lupa menambahkan AsNoTracking() pada query read-only yang memboroskan memori tracking EF Core."
    ],
    tags: ['C#', '.NET 8', 'Minimal API', 'Entity Framework', 'Enterprise'],
    docsUrl: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis',
  },
  {
    id: 'php-native-core',
    title: 'PHP Native 8.3+: Cara Bikin Proyek dari Nol & Cara Menjalankan (CLI & Web Server)',
    category: 'backend',
    platform: 'PHP 8.3 Native (No Framework)',
    description:
      'Panduan fundamental membuat dan menjalankan aplikasi PHP Native modern (PHP 8.3+). Meliputi inisialisasi Composer, PSR-4 autoloading, koneksi PDO MySQL dengan parameterized queries, router sederhana tanpa Apache/Nginx, dan built-in development server.',
    setupSteps: [
      'Periksa instalasi PHP: buka terminal dan ketik "php -v" (pastikan PHP 8.2 atau 8.3 terpasang).',
      'Buat folder proyek baru dan inisialisasi Composer: mkdir my-php-app && cd my-php-app && composer init -n.',
      'Atur PSR-4 autoloading di composer.json pada key "autoload": {"psr-4": {"App\\\\": "src/"}} lalu jalankan "composer dump-autoload".',
      'Buat folder public/ dan letakkan public/index.php sebagai Single Point of Entry (Front Controller).',
      'Jalankan built-in web server: php -S localhost:8000 -t public (buka di browser: http://localhost:8000).',
      'Untuk menjalankan script CLI mandiri: jalankan "php src/Console/script.php".',
    ],
    folderStructure: `my-php-app/
├── public/
│   ├── index.php         # Front controller & routing utama
│   └── assets/           # CSS, JS, dan gambar publik
├── src/
│   ├── Database.php      # Singleton PDO connection wrapper
│   ├── Controllers/      # Controller logika bisnis (UserController.php)
│   └── Models/           # Model data & query PDO murni (User.php)
├── composer.json         # Konfigurasi dependensi & PSR-4 autoload
└── .env                  # Kredensial DB_HOST, DB_USER, DB_PASS`,
    cliCommands: [
      { label: 'Run Built-in Web Server', cmd: 'php -S localhost:8000 -t public' },
      { label: 'Run CLI Script', cmd: 'php src/Console/script.php' },
      { label: 'Dump Autoload', cmd: 'composer dump-autoload -o' },
      { label: 'Check Modules', cmd: 'php -m && php -v' },
    ],
    language: 'php',
    codeSnippet: `<?php
declare(strict_types=1);

// 1. Single Point of Entry: public/index.php
require_once __DIR__ . '/../vendor/autoload.php';

// Koneksi Database PDO yang aman (Prepared Statement wajib untuk mencegah SQL Injection!)
class Database {
    private static ?PDO $pdo = null;

    public static function connect(): PDO {
        if (self::$pdo === null) {
            $dsn = 'mysql:host=127.0.0.1;dbname=app_db;charset=utf8mb4';
            self::$pdo = new PDO($dsn, 'root', 'secret', [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false, // Native prepared statements!
            ]);
        }
        return self::$pdo;
    }
}

// Router sederhana berbasis Request URI
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

header('Content-Type: application/json; charset=utf-8');

if ($path === '/' && $method === 'GET') {
    echo json_encode([
        'status' => 'success',
        'message' => 'PHP Native 8.3 Server Berjalan!',
        'timestamp' => date('Y-m-d H:i:s'),
    ]);
    exit;
}

if ($path === '/users' && $method === 'GET') {
    $stmt = Database::connect()->prepare("SELECT id, name, email FROM users WHERE is_active = :status LIMIT 20");
    $stmt->execute(['status' => 1]);
    $users = $stmt->fetchAll();

    echo json_encode(['data' => $users]);
    exit;
}

// Fallback 404
http_response_code(404);
echo json_encode(['error' => 'Rute tidak ditemukan']);`,
    keyTakeaways: [
      'php -S localhost:8000 -t public adalah cara tercepat menjalankan PHP tanpa repot pasang XAMPP/Apache/Nginx.',
      'Selalu gunakan declare(strict_types=1); di baris pertama file untuk memastikan type-safety PHP 8.',
      'Jangan pernah concatenate string ke SQL ("WHERE id = $id"), selalu gunakan PDO Prepared Statements (:id) untuk mencegah SQL Injection.',
    ],
    gotchas: [
      "Menjalankan 'php -S localhost:8000' tanpa flag '-t public' mengekspos seluruh isi root folder proyek ke internet.",
      "Lupa menambahkan PDO::ATTR_EMULATE_PREPARES => false membuat database driver melakukan emulasi query string lokal yang rentan terhadap bypass escaping."
    ],
    tags: ['PHP', 'PHP Native', 'PDO', 'Composer', 'Backend', 'CLI'],
    docsUrl: 'https://www.php.net/manual/en/features.commandline.webserver.php',
  },
  {
    id: 'php-laravel11-fullstack',
    title: 'Laravel 11 Full-Stack: Cara Bikin Proyek, Konfigurasi .env & Cara Menjalankan',
    category: 'backend',
    platform: 'Laravel 11 (PHP 8.3)',
    description:
      'Panduan lengkap membuat proyek Laravel 11 dari awal hingga berjalan di server lokal. Mencakup instalasi via Composer, konfigurasi file .env, manajemen migrasi database, pembuatan Controller & Model dengan Artisan, serta menjalankan server terpadu bersama Vite.',
    setupSteps: [
      'Buat proyek Laravel baru: composer create-project laravel/laravel my-laravel-app && cd my-laravel-app.',
      'Salin dan generate App Key: cp .env.example .env && php artisan key:generate.',
      'Buka file .env dan atur koneksi database: DB_CONNECTION=mysql, DB_HOST=127.0.0.1, DB_PORT=3306, DB_DATABASE=my_db, DB_USERNAME=root, DB_PASSWORD=.',
      'Jalankan migrasi database bawaan: php artisan migrate.',
      'Install dependency frontend (Tailwind/Vite): npm install && npm run build.',
      'Jalankan server aplikasi: buka terminal 1 ketik php artisan serve, dan terminal 2 ketik npm run dev (buka http://127.0.0.1:8000).',
    ],
    folderStructure: `my-laravel-app/
├── app/
│   ├── Http/Controllers/ # Controller logika web & API
│   └── Models/           # Eloquent Models (User.php, Product.php)
├── bootstrap/app.php     # Registrasi middleware & routing Laravel 11
├── config/               # Konfigurasi database, cache, auth
├── database/
│   ├── migrations/       # Skrip skema database
│   └── seeders/          # Dummy data seeder
├── resources/
│   ├── views/            # Template Blade (*.blade.php)
│   ├── css/ & js/        # Entry point Vite & Tailwind
├── routes/
│   ├── web.php           # Rute halaman browser (Return view)
│   └── api.php           # Rute API RESTful (Return JSON)
└── .env                  # Kredensial lingkungan (Database, Mail, App Key)`,
    cliCommands: [
      { label: '1. Create Project', cmd: 'composer create-project laravel/laravel my-app' },
      { label: '2. Generate App Key', cmd: 'php artisan key:generate' },
      { label: '3. Run Database Migrations', cmd: 'php artisan migrate' },
      { label: '4. Run Laravel Server', cmd: 'php artisan serve --port=8000' },
      { label: '5. Run Vite Asset Compiler', cmd: 'npm run dev' },
      { label: 'Make Model + Migration + Controller', cmd: 'php artisan make:model Product -mcr' },
    ],
    language: 'php',
    codeSnippet: `<?php
// 1. routes/web.php: Rute halaman publik
use App\\Http\\Controllers\\ProductController;
use Illuminate\\Support\\Facades\\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::resource('products', ProductController::class);

// 2. app/Http/Controllers/ProductController.php
namespace App\\Http\\Controllers;

use App\\Models\\Product;
use Illuminate\\Http\\Request;

class ProductController extends Controller
{
    public function index()
    {
        // Ambil produk dengan pagination 10 per halaman
        $products = Product::latest()->paginate(10);
        return view('products.index', compact('products'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:200',
            'price'       => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        Product::create($validated);

        return redirect()->route('products.index')
            ->with('success', 'Produk berhasil ditambahkan!');
    }
}`,
    keyTakeaways: [
      'php artisan serve menyalakan backend PHP di port 8000, sedangkan npm run dev meng-compile CSS/JS secara live reload via Vite.',
      'Di Laravel 11, struktur folder disederhanakan: konfigurasi routing dan middleware berpusat di bootstrap/app.php.',
      'Gunakan php artisan make:model Nama -mcr untuk otomatis membuat Model, Migration, Controller, dan Resource sekaligus.',
    ],
    scaffoldTargetId: 'fullstack-laravel-blade',
    gotchas: [
      "Lupa menjalankan 'php artisan key:generate' menyebabkan error 500 'No application encryption key has been specified'.",
      "Di Laravel 11, routing API tidak aktif secara default. Jalankan 'php artisan install:api' jika membutuhkan file routes/api.php."
    ],
    tags: ['PHP', 'Laravel', 'Artisan', 'Vite', 'Fullstack', 'Backend'],
    docsUrl: 'https://laravel.com/docs/11.x/installation',
  },
  {
    id: 'php-laravel11-api',
    title: 'PHP 8.3 & Laravel 11: Eloquent ORM, FormRequest & API Resource',
    category: 'backend',
    platform: 'Laravel 11 (PHP 8.3)',
    description:
      'Framework full-stack dan backend paling produktif untuk rapid MVP development dengan Eloquent ORM, migrasi otomatis, dan FormRequest validation.',
    setupSteps: [
      'Buat project Laravel: composer create-project laravel/laravel my-app && cd my-app.',
      'Aktifkan modul API routing: php artisan install:api.',
      'Buat Model + Migration + Controller sekaligus: php artisan make:model Order -mcr.',
      'Jalankan server: php artisan serve (http://localhost:8000).',
    ],
    folderStructure: `app/
├── Http/
│   ├── Controllers/    # OrderController.php
│   ├── Requests/       # Validasi StoreOrderRequest.php
│   └── Resources/      # Transformasi JSON OrderResource.php
├── Models/             # Eloquent Model (Order.php)
└── routes/api.php      # Definisi endpoint /api/*`,
    cliCommands: [
      { label: 'Create App', cmd: 'composer create-project laravel/laravel my-app' },
      { label: 'Install API', cmd: 'php artisan install:api' },
      { label: 'Make Model+CRUD', cmd: 'php artisan make:model Order -mcr' },
      { label: 'Migrate DB', cmd: 'php artisan migrate --seed' },
    ],
    language: 'php',
    codeSnippet: `<?php
namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\Order;
use Illuminate\\Http\\Request;

class OrderController extends Controller
{
    public function index()
    {
        // Eager loading relasi 'user' untuk mencegah masalah N+1 Query!
        $orders = Order::with('user:id,name')->latest()->paginate(15);
        return response()->json($orders);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:120',
            'total_amount'  => 'required|numeric|min:1000',
        ]);

        $order = Order::create($validated);
        return response()->json(['data' => $order], 201);
    }
}`,
    keyTakeaways: [
      'Selalu gunakan Order::with(...) (Eager Loading) agar tidak terkena masalah N+1 Query yang membuat DB lambat.',
      '$request->validate() otomatis mengembalikan HTTP 422 JSON jika validasi gagal.',
      'Perintah php artisan make:model Nama -mcr menghemat waktu pembuatan 4 file sekaligus.',
    ],
    gotchas: [
          "Lupa mendefinisikan fillable pada Eloquent model memicu MassAssignmentException.",
          "N+1 query pada relasi database karena lupa memakai with(\"relation\") saat eager loading."
    ],
    tags: ['PHP', 'Laravel', 'Eloquent', 'Backend', 'Fullstack'],
    docsUrl: 'https://laravel.com/docs',
  },
  {
    id: 'java-springboot3-rest',
    title: 'Java 21 & Spring Boot 3: REST Controller, DTO Record & JPA',
    category: 'backend',
    platform: 'Java 21 (Spring Boot 3)',
    description:
      'Standar emas backend korporat dan perbankan menggunakan Java 21 Records (immutable DTO), Spring Data JPA, dan Bean Validation (@Valid).',
    setupSteps: [
      'Generate project di start.spring.io (Pilih: Spring Web, Spring Data JPA, PostgreSQL, Validation, Lombok).',
      'Jalankan via Maven wrapper: ./mvnw spring-boot:run.',
    ],
    cliCommands: [
      { label: 'Run App', cmd: './mvnw spring-boot:run' },
      { label: 'Run Tests', cmd: './mvnw test' },
      { label: 'Build JAR', cmd: './mvnw clean package -DskipTests' },
    ],
    language: 'java',
    codeSnippet: `package com.example.api.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

// Java 21 Record sebagai DTO ringkas tanpa getter/setter manual
public record CreateItemRequest(
    @NotBlank(message = "Nama wajib diisi") String name,
    @Min(value = 1, message = "Harga minimal 1") long price
) {}

@RestController
@RequestMapping("/api/v1/items")
public class ItemController {

    @GetMapping
    public ResponseEntity<List<CreateItemRequest>> findAll() {
        return ResponseEntity.ok(List.of(new CreateItemRequest("Server Rack", 4500000)));
    }

    @PostMapping
    public ResponseEntity<CreateItemRequest> create(@Valid @RequestBody CreateItemRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(req);
    }
}`,
    keyTakeaways: [
      'Java 21 record menggantikan class DTO panjang (otomatis membuat constructor, equals, hashCode, toString).',
      'Anotasi @Valid memicu pengecekan @NotBlank dan @Min secara otomatis sebelum masuk ke body method.',
      'Aktifkan Virtual Threads di Spring Boot 3.2+ dengan spring.threads.virtual.enabled=true.',
    ],
    gotchas: [
          "Memanggil method beranotasi @Transactional dari dalam method lain di class yang sama (self-invocation) mengabaikan Spring proxy sehingga transaksi tidak berjalan.",
          "Menggunakan java.util.Date lama alih-alih java.time.Instant atau LocalDateTime."
    ],
    tags: ['Java', 'Spring Boot', 'Enterprise', 'Backend', 'REST API'],
    docsUrl: 'https://spring.io/projects/spring-boot',
  },

  // -------------------------------------------------------------
  // MOBILE (ANDROID & IOS)
  // -------------------------------------------------------------
  {
    id: 'flutter-riverpod',
    title: 'Flutter / Dart: Responsive UI & Riverpod State',
    category: 'mobile',
    platform: 'Flutter 3 (Dart)',
    description:
      'Arsitektur mobile cross-platform modern untuk Android dan iOS menggunakan Flutter 3, ConsumerWidget, dan Riverpod state management.',
    setupSteps: [
      'Cek instalasi SDK: flutter doctor.',
      'Buat proyek baru: flutter create my_mobile_app && cd my_mobile_app.',
      'Tambah state & HTTP: flutter pub add flutter_riverpod dio go_router.',
      'Jalankan di emulator/HP: flutter run.',
    ],
    folderStructure: `lib/
├── core/               # Theme, Dio HTTP client, constants
├── features/
│   ├── auth/           # presentation/, domain/, data/
│   └── orders/         # Layar & provider per fitur
└── main.dart           # ProviderScope & MaterialApp.router`,
    cliCommands: [
      { label: 'Create App', cmd: 'flutter create my_mobile_app' },
      { label: 'Add Packages', cmd: 'flutter pub add flutter_riverpod dio' },
      { label: 'Run Device', cmd: 'flutter run' },
      { label: 'Build APK', cmd: 'flutter build apk --release' },
    ],
    language: 'dart',
    codeSnippet: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final counterProvider = StateProvider<int>((ref) => 0);

class CounterScreen extends ConsumerWidget {
  const CounterScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Flutter Production UI')),
      body: Center(
        child: Text(
          'Total Nilai: $count',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => ref.read(counterProvider.notifier).state++,
        child: const Icon(Icons.add),
      ),
    );
  }
}`,
    keyTakeaways: [
      'ConsumerWidget dari Riverpod mencegah rebuild layar yang tidak perlu.',
      'Satu codebase Flutter langsung menghasilkan binary native untuk Android, iOS, Windows, dan Web.',
      'ref.watch() mendengarkan perubahan data di build(), ref.read() untuk aksi di onPressed().',
    ],
    gotchas: [
          "Memanggil ref.watch() di dalam callback event (seperti onPressed) memicu runtime exception (gunakan ref.read() di dalam event handler).",
          "Lupa menambahkan const constructor pada widget stateless yang menyebabkan widget di-build ulang tanpa perlu."
    ],
    tags: ['Flutter', 'Dart', 'Mobile', 'Android', 'iOS', 'Riverpod'],
    docsUrl: 'https://docs.flutter.dev',
  },
  {
    id: 'react-native-expo',
    title: 'React Native (Expo): Typed Navigation & Fast FlatList',
    category: 'mobile',
    platform: 'React Native / Expo',
    description:
      'Pengembangan aplikasi mobile berbasis React menggunakan Expo SDK 50+, Expo Router (file-based navigation), dan native layout Flexbox.',
    setupSteps: [
      'Buat project Expo: npx create-expo-app@latest my-mobile.',
      'Masuk folder & jalankan: cd my-mobile && npx expo start.',
      'Scan QR Code menggunakan aplikasi Expo Go di HP Android/iOS Anda.',
    ],
    cliCommands: [
      { label: 'Create Expo', cmd: 'npx create-expo-app@latest my-mobile' },
      { label: 'Start Dev', cmd: 'npx expo start' },
    ],
    language: 'typescript',
    codeSnippet: `import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator } from 'react-native';

export default function FeedScreen() {
  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setData(['Notifikasi Order #101', 'Update Pengiriman #102', 'Promo Akhir Pekan']);
      setLoading(false);
    }, 600);
  }, []);

  if (loading) return <ActivityIndicator size="large" style={styles.center} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Daftar Notifikasi</Text>
      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}><Text style={styles.cardText}>{item}</Text></View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0d0f', padding: 20 },
  header: { fontSize: 22, color: '#fff', fontWeight: 'bold', marginBottom: 15 },
  card: { backgroundColor: '#16181d', padding: 15, borderRadius: 8, marginBottom: 10 },
  cardText: { color: '#ccc', fontSize: 14 },
  center: { flex: 1, justifyContent: 'center' }
});`,
    keyTakeaways: [
      'Selalu gunakan FlatList alih-alih ScrollView untuk daftar data yang panjang agar hemat RAM.',
      'Styling React Native menggunakan Flexbox dengan arah default vertikal (flexDirection: column).',
    ],
    gotchas: [
          "Menaruh teks langsung di dalam <View> tanpa dibungkus komponen <Text> menyebabkan crash fatal di React Native Android.",
          "Mengabaikan SafeAreaView atau useSafeAreaInsets() sehingga header tertutup notch kamera atau dynamic island."
    ],
    tags: ['React Native', 'Expo', 'Mobile', 'TypeScript', 'Cross-Platform'],
    docsUrl: 'https://docs.expo.dev',
  },
  {
    id: 'kotlin-jetpack-compose',
    title: 'Kotlin Android: Jetpack Compose & ViewModel StateFlow',
    category: 'mobile',
    platform: 'Kotlin (Android Native)',
    description:
      'Pengembangan Android native modern deklaratif menggunakan Jetpack Compose, Coroutines, dan Unidirectional Data Flow (StateFlow).',
    setupSteps: [
      'Buka Android Studio -> New Project -> Empty Activity (Jetpack Compose).',
      'Tambahkan dependency lifecycle-viewmodel-compose di build.gradle.kts.',
    ],
    cliCommands: [
      { label: 'Assemble Debug', cmd: './gradlew assembleDebug' },
      { label: 'Run Unit Tests', cmd: './gradlew testDebugUnitTest' },
    ],
    language: 'kotlin',
    codeSnippet: `import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class OrderViewModel : ViewModel() {
    private val _count = MutableStateFlow(0)
    val count: StateFlow<Int> = _count
    fun increment() { _count.value += 1 }
}

@Composable
fun OrderScreen(viewModel: OrderViewModel) {
    val count by viewModel.count.collectAsState()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text(text = "Order Aktif: $count", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(12.dp))
        Button(onClick = { viewModel.increment() }) {
            Text("Tambah Order")
        }
    }
}`,
    keyTakeaways: [
      'StateFlow menjaga state tetap hidup meskipun layar HP di-rotate (configuration change).',
      'Jetpack Compose menggantikan file XML layout lama dengan fungsi Kotlin @Composable.',
    ],
    gotchas: [
          "Melakukan operasi I/O berat atau blocking langsung di dalam @Composable function tanpa LaunchedEffect.",
          "Lupa menggunakan remember { mutableStateOf(...) } sehingga state ter-reset ke nilai awal tiap recomposition."
    ],
    tags: ['Kotlin', 'Android', 'Jetpack Compose', 'Mobile', 'Native'],
    docsUrl: 'https://developer.android.com/compose',
  },

  // -------------------------------------------------------------
  // DESKTOP APPS
  // -------------------------------------------------------------
  {
    id: 'tauri-rust-desktop',
    title: 'Tauri v2: Desktop Ringan (Rust Core + Web Frontend)',
    category: 'desktop',
    platform: 'Tauri v2 (Rust + Vue/React)',
    description:
      'Solusi desktop modern pengganti Electron dengan ukuran installer hanya ~5MB dan konsumsi RAM ultra-rendah menggunakan webview OS bawaan dan Rust backend.',
    setupSteps: [
      'Pastikan Rust compiler & Node.js sudah terpasang.',
      'Jalankan: npm create tauri-app@latest (Pilih Vue atau React + TypeScript).',
      'Jalankan mode dev desktop: npm run tauri dev.',
      'Build installer (.exe / .msi / .dmg): npm run tauri build.',
    ],
    cliCommands: [
      { label: 'Create Tauri', cmd: 'npm create tauri-app@latest' },
      { label: 'Run Desktop', cmd: 'npm run tauri dev' },
      { label: 'Build Installer', cmd: 'npm run tauri build' },
    ],
    language: 'rust',
    codeSnippet: `// src-tauri/src/main.rs (Backend Rust)
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Halo {}, selamat datang di Desktop App!", name)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Di Frontend Vue / React:
// import { invoke } from '@tauri-apps/api/core';
// const message = await invoke('greet', { name: 'Alaz' });`,
    keyTakeaways: [
      'Ukuran installer < 10MB (berbanding Electron yang sering > 100MB).',
      'IPC (Inter-Process Communication) aman dengan sistem invoke command.',
      'Dukungan lintas platform Windows (.msi / .exe), macOS (.dmg), dan Linux (.deb / AppImage).',
    ],
    gotchas: [
          "Lupa mendaftarkan fungsi command Rust ke dalam generate_handler![...] di tauri::Builder::default(), sehingga invoke() dari JavaScript menghasilkan string \"Command not found\".",
          "Mengirim data serialisasi JSON berukuran sangat besar (puluhan MB) via IPC bridge yang memperlambat UI thread."
    ],
    tags: ['Tauri', 'Rust', 'Desktop', 'Electron Alternative', 'Performance'],
    docsUrl: 'https://v2.tauri.app',
  },

  // -------------------------------------------------------------
  // GAME DEVELOPMENT
  // -------------------------------------------------------------
  {
    id: 'unity-csharp-character',
    title: 'Unity C#: Clean Movement & Object Pooling Pattern',
    category: 'game',
    platform: 'Unity 6 (C#)',
    description:
      'Sintaks standar game developer untuk pergerakan karakter berbasis Rigidbody2D/3D dan urutan eksekusi lifecycle MonoBehaviour.',
    setupSteps: [
      'Buka Unity Hub -> New Project -> Universal 2D atau Universal 3D (URP).',
      'Buat folder Assets/_Project/{Scripts,Prefabs,Scenes,Materials}.',
      'Tempelkan script PlayerController.cs ke GameObject yang memiliki Rigidbody2D & Collider2D.',
    ],
    cliCommands: [],
    language: 'csharp',
    codeSnippet: `using UnityEngine;

[RequireComponent(typeof(Rigidbody2D))]
public class PlayerController : MonoBehaviour
{
    [SerializeField] private float moveSpeed = 7f;
    [SerializeField] private float jumpForce = 12f;
    
    private Rigidbody2D _rb;
    private float _horizontalInput;
    private bool _isGrounded;

    private void Awake()
    {
        _rb = GetComponent<Rigidbody2D>();
    }

    private void Update()
    {
        // Tangkap input di Update (berjalan setiap frame render)
        _horizontalInput = Input.GetAxisRaw("Horizontal");

        if (Input.GetButtonDown("Jump") && _isGrounded)
        {
            _rb.linearVelocity = new Vector2(_rb.linearVelocity.x, jumpForce);
        }
    }

    private void FixedUpdate()
    {
        // Perhitungan physics wajib di FixedUpdate (timestep tetap 50Hz)
        _rb.linearVelocity = new Vector2(_horizontalInput * moveSpeed, _rb.linearVelocity.y);
    }

    private void OnCollisionEnter2D(Collision2D collision)
    {
        if (collision.gameObject.CompareTag("Ground")) _isGrounded = true;
    }

    private void OnCollisionExit2D(Collision2D collision)
    {
        if (collision.gameObject.CompareTag("Ground")) _isGrounded = false;
    }
}`,
    keyTakeaways: [
      'Input selalu dibaca di Update(), sedangkan kalkulasi physics selalu di FixedUpdate().',
      'Hindari Instantiate dan Destroy peluru berulang-ulang saat gameplay; gunakan Object Pool.',
      'Gunakan [SerializeField] private agar variabel bisa diatur di Inspector tanpa menjadi public.',
    ],
    gotchas: [
      'Memanggil GetComponent<T>() atau FindObjectOfType<T>() di dalam Update() yang menghancurkan FPS game (selalu cache di Awake/Start).',
      'Menggunakan string literal untuk tag (gameObject.tag == "Enemy") alih-alih CompareTag("Enemy") yang bebas alokasi GC.',
    ],
    tags: ['Unity', 'GameDev', 'C#', 'Physics', 'Movement'],
    docsUrl: 'https://docs.unity3d.com/ScriptReference/',
  },
  {
    id: 'godot-gdscript-movement',
    title: 'Godot 4: GDScript CharacterBody2D & Signals',
    category: 'game',
    platform: 'Godot Engine 4',
    description:
      'Script pergerakan platformer 2D responsif dengan gravitasi, percepatan, dan lompatan di Godot 4 menggunakan GDScript.',
    setupSteps: [
      'Unduh Godot 4 (ukuran ~100MB, langsung jalan tanpa instalasi).',
      'Buat Node utama CharacterBody2D -> tambahkan anak Sprite2D dan CollisionShape2D.',
      'Attach script player.gd ke CharacterBody2D lalu tekan F5 untuk Play.',
    ],
    cliCommands: [
      { label: 'Run Editor', cmd: 'godot --editor' },
    ],
    language: 'python',
    codeSnippet: `extends CharacterBody2D

signal player_jumped(height: float)

const SPEED = 300.0
const JUMP_VELOCITY = -400.0

var gravity = ProjectSettings.get_setting("physics/2d/default_gravity")

func _physics_process(delta: float) -> void:
	if not is_on_floor():
		velocity.y += gravity * delta

	if Input.is_action_just_pressed("ui_accept") and is_on_floor():
		velocity.y = JUMP_VELOCITY
		player_jumped.emit(JUMP_VELOCITY)

	var direction := Input.get_axis("ui_left", "ui_right")
	if direction:
		velocity.x = direction * SPEED
	else:
		velocity.x = move_toward(velocity.x, 0, SPEED)

	move_and_slide()`,
    keyTakeaways: [
      'Godot 4 bersifat open-source, ringan, dan menggunakan arsitektur Node + Signal yang sangat rapi.',
      '_physics_process(delta) menjaga gerakan karakter konsisten di semua frame rate.',
      'move_and_slide() otomatis menangani tubrukan dinding, lereng, dan lantai.',
    ],
    gotchas: [
          "Menggunakan get_node(\"Player\") berulang kali alih-alih @onready var player = $Player.",
          "Memanggil queue_free() pada node saat fisikanya masih aktif di dalam sinyal _physics_process tanpa jeda."
    ],
    tags: ['Godot', 'GDScript', 'GameDev', '2D', 'Indie'],
    docsUrl: 'https://docs.godotengine.org',
  },

  // -------------------------------------------------------------
  // SYSTEMS & LOW-LEVEL
  // -------------------------------------------------------------
  {
    id: 'cpp20-raii-smart-pointers',
    title: 'Modern C++20: RAII, Smart Pointers & std::vector',
    category: 'systems',
    platform: 'C++20 / Systems',
    description:
      'Pola C++ modern bebas memory leak menggunakan RAII (Resource Acquisition Is Initialization), std::unique_ptr, dan move semantics.',
    setupSteps: [
      'Kompilasi dengan flag standar C++20: g++ -std=c++20 -O2 main.cpp -o app.',
      'Atau gunakan CMakeLists.txt untuk proyek multi-file.',
    ],
    cliCommands: [
      { label: 'Compile GCC', cmd: 'g++ -std=c++20 -O2 -Wall main.cpp -o app' },
      { label: 'Run Binary', cmd: './app' },
    ],
    language: 'cpp',
    codeSnippet: `#include <iostream>
#include <memory>
#include <vector>
#include <string>

class TelemetryBuffer {
public:
    explicit TelemetryBuffer(std::string name) : name_(std::move(name)) {
        std::cout << "[INIT] Buffer " << name_ << " dialokasikan.\\n";
    }
    ~TelemetryBuffer() {
        std::cout << "[FREE] Buffer " << name_ << " otomatis dibersihkan!\\n";
    }
    void pushSample(double val) { samples_.push_back(val); }
    size_t count() const noexcept { return samples_.size(); }

private:
    std::string name_;
    std::vector<double> samples_;
};

int main() {
    // Gunakan std::make_unique alih-alih raw 'new' dan 'delete'
    auto buf = std::make_unique<TelemetryBuffer>("EngineCore");
    buf->pushSample(98.6);
    buf->pushSample(102.4);
    std::cout << "Total sampel: " << buf->count() << "\\n";
    return 0; // Destructor otomatis terpanggil saat keluar scope!
}`,
    keyTakeaways: [
      'Di C++ modern, jangan pernah menulis raw new dan delete manual; gunakan std::make_unique.',
      'Gunakan const reference (const std::string&) atau std::move untuk menghindari copy memori berat.',
      'Tandai method yang tidak melempar exception dengan noexcept untuk optimasi compiler.',
    ],
    gotchas: [
          "Menggunakan raw pointer dengan new/delete manual di modern C++ (selalu utamakan std::unique_ptr atau std::shared_ptr).",
          "Dangling reference saat me-return string_view atau reference dari variabel lokal fungsi."
    ],
    tags: ['C++', 'C++20', 'Systems', 'Memory Management', 'RAII'],
    docsUrl: 'https://en.cppreference.com/w/',
  },
  {
    id: 'zig-explicit-allocator',
    title: 'Zig: Explicit Memory Allocator & Defer Cleanup',
    category: 'systems',
    platform: 'Zig 0.13+',
    description:
      'Bahasa sistem modern pengganti C dengan alokasi memori eksplisit, blok defer anti-lupa free, dan interoperabilitas C langsung.',
    setupSteps: [
      'Inisialisasi proyek Zig: zig init.',
      'Compile dan jalankan: zig build run.',
      'Jalankan test blok: zig test src/main.zig.',
    ],
    cliCommands: [
      { label: 'Init Project', cmd: 'zig init' },
      { label: 'Build & Run', cmd: 'zig build run' },
      { label: 'Run Tests', cmd: 'zig test src/main.zig' },
    ],
    language: 'zig',
    codeSnippet: `const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit(); // Cek otomatis apakah ada memory leak saat keluar!
    const allocator = gpa.allocator();

    // Alokasi array dinamis
    var list = std.ArrayList(u32).init(allocator);
    defer list.deinit(); // Pasti dibersihkan di akhir scope

    try list.append(10);
    try list.append(20);

    std.debug.print("Item pertama: {d}, Total: {d}\\n", .{ list.items[0], list.items.len });
}`,
    keyTakeaways: [
      'Tulis baris defer tepat di bawah baris alokasi agar tidak pernah lupa membebaskan memori.',
      'Tidak ada alokasi memori tersembunyi di Zig; semua fungsi yang butuh heap wajib menerima parameter Allocator.',
    ],
    gotchas: [
          "Lupa memanggil defer allocator.free(slice) yang langsung menyebabkan memory leak seketika.",
          "Mengabaikan error union tanpa try atau catch."
    ],
    tags: ['Zig', 'Systems', 'Low-Level', 'Memory Safety', 'C Alternative'],
    docsUrl: 'https://ziglang.org/documentation/master/',
  },

  // -------------------------------------------------------------
  // DATABASE & CACHING
  // -------------------------------------------------------------
  {
    id: 'postgres-jsonb-cte',
    title: 'PostgreSQL 16: Transaksi Aman, JSONB, Indexing & QA Queries',
    category: 'database',
    platform: 'PostgreSQL 16',
    description:
      'Sintaks query tingkat lanjut PostgreSQL untuk transaksi atomik, manipulasi JSONB, GIN index, dan query validasi QA.',
    setupSteps: [
      'Nyalakan via Docker PRD Studio: dev up (otomatis jalan di port 5432 + Adminer di 8080).',
      'Atau akses via terminal: psql -U devuser -d my_db.',
    ],
    cliCommands: [
      { label: 'Start Docker DB', cmd: 'dev up' },
      { label: 'Connect CLI', cmd: 'psql -U devuser -d my_db' },
      { label: 'Backup SQL', cmd: 'pg_dump -U devuser my_db > backup.sql' },
    ],
    language: 'sql',
    codeSnippet: `-- 1. Transaksi Bank Aman (Sukses Semua atau Batal Semua)
BEGIN;
UPDATE accounts SET balance = balance - 250000 WHERE id = 101;
UPDATE accounts SET balance = balance + 250000 WHERE id = 202;
COMMIT;

-- 2. Query mencari data di dalam kolom JSONB + GIN Index
CREATE INDEX idx_logs_meta ON audit_logs USING GIN (metadata);
SELECT id, metadata->>'ip_address' AS ip
FROM audit_logs
WHERE metadata->>'event' = 'PAYMENT_SUCCESS';

-- 3. Pagination Sekaligus Hitung Total Baris (Window Function)
SELECT id, title, price, COUNT(*) OVER() AS total_records
FROM products
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;`,
    keyTakeaways: [
      'Gunakan operator ->> untuk mengambil nilai JSON sebagai text, atau -> untuk JSON object.',
      'GIN Index wajib dibuat jika sering melakukan pencarian di dalam kolom JSONB.',
      'Selalu bungkus mutasi multi-tabel (seperti potong saldo & buat order) di dalam blok BEGIN ... COMMIT.',
    ],
    gotchas: [
          "Lupa membuat Index pada Foreign Key column (Postgres TIDAK otomatis membuat index untuk FK), menyebabkan Table Lock saat CASCADE delete.",
          "Menggunakan SELECT * di tabel bertrafik tinggi dengan column JSONB besar membuat bandwidth network jebol.",
          "Lupa menjalankan VACUUM ANALYZE setelah import data besar sehingga query planner memakai estimasi biaya yang keliru."
    ],
    tags: ['PostgreSQL', 'SQL', 'Database', 'JSONB', 'Indexing', 'Query'],
    docsUrl: 'https://www.postgresql.org/docs/current/',
  },
  {
    id: 'redis-cache-ratelimit',
    title: 'Redis 7: Caching Strategy & Sliding Window Rate Limiter',
    category: 'database',
    platform: 'Redis 7',
    description:
      'Strategi caching data dengan TTL (Time-To-Live) dan implementasi pembatas akses (Rate Limiter) 100 request/menit untuk melindungi backend dari serangan DDoS/spam.',
    cliCommands: [
      { label: 'Redis CLI', cmd: 'redis-cli' },
      { label: 'Monitor Live', cmd: 'redis-cli monitor' },
    ],
    language: 'typescript',
    codeSnippet: `import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// 1. Cache-Aside Pattern (Ambil dari RAM, jika kosong baru query DB)
export async function getCachedData<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const fresh = await fetcher();
  await redis.set(key, JSON.stringify(fresh), 'EX', ttlSeconds);
  return fresh;
}

// 2. Simple Rate Limiter (Max 100 req per 60 detik per IP)
export async function checkRateLimit(clientIp: string): Promise<boolean> {
  const key = \`rate:\${clientIp}\`;
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, 60);
  }
  return current <= 100; // true jika masih boleh request
}`,
    keyTakeaways: [
      'Cache-Aside: Cek cache dulu; jika miss, ambil dari database lalu simpan ke Redis dengan TTL.',
      'Gunakan parameter EX untuk memasang masa kedaluwarsa (TTL) agar memori RAM tidak jebol.',
      'Redis incr adalah operasi atomik yang aman dari race condition.',
    ],
    gotchas: [
          "Menjalankan perintah KEYS * di server Redis production yang memiliki jutaan data (akan memblokir seluruh server hingga hitungan menit! Selalu gunakan SCAN).",
          "Menyimpan key tanpa TTL / Expiration time sehingga memori RAM server perlahan habis (OOM)."
    ],
    tags: ['Redis', 'Caching', 'Rate Limiter', 'Performance', 'Backend'],
    docsUrl: 'https://redis.io/docs/latest/',
  },

  // -------------------------------------------------------------
  // DEVOPS, CLOUD & GIT
  // -------------------------------------------------------------
  {
    id: 'docker-multistage-build',
    title: 'Docker: Multi-Stage Production Dockerfile',
    category: 'devops',
    platform: 'Docker',
    description:
      'Dockerfile standar produksi menggunakan teknik Multi-Stage Build untuk memangkas ukuran image dari 1GB menjadi hanya 40MB tanpa menyertakan compiler di production.',
    cliCommands: [
      { label: 'Build Image', cmd: 'docker build -t my-app:prod .' },
      { label: 'Run Container', cmd: 'docker run -d -p 8080:8080 --name app my-app:prod' },
      { label: 'View Logs', cmd: 'docker logs -f app' },
    ],
    language: 'dockerfile',
    codeSnippet: `# Stage 1: Build stage (Berisi compiler lengkap)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production runtime stage (Super ringan, hanya file build)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
RUN npm ci --only=production

USER appuser
EXPOSE 8080
CMD ["node", "dist/index.js"]`,
    keyTakeaways: [
      'Multi-stage build memisahkan alat kompilasi dengan hasil binary akhir.',
      'Gunakan user non-root (USER appuser) untuk keamanan container.',
      'Gunakan base image Alpine untuk ukuran minimal dan attack-surface terkecil.',
    ],
    gotchas: [
          "Lupa membuat .dockerignore sehingga node_modules lokal dan folder .git ter-copy ke context image (ukuran image membengkak ratusan MB).",
          "Menjalankan container sebagai root user di lingkungan production."
    ],
    tags: ['Docker', 'DevOps', 'Containers', 'Security', 'Production'],
    docsUrl: 'https://docs.docker.com/build/building/multi-stage/',
  },
  {
    id: 'git-emergency-cheatsheet',
    title: 'Git & Terminal Survival: Atasi Port Bentrok & Undo Commit',
    category: 'devops',
    platform: 'Git & OS CLI',
    description:
      'Kumpulan perintah penyelamat saat ngoding: membatalkan commit tanpa hapus kode, mengatasi error "Port 8000 already in use", dan manajemen branch.',
    cliCommands: [
      { label: 'Undo Commit (Soft)', cmd: 'git reset --soft HEAD~1' },
      { label: 'Cek Port (Win)', cmd: 'netstat -ano | findstr :8000' },
      { label: 'Kill PID (Win)', cmd: 'taskkill /PID <NOMOR_PID> /F' },
      { label: 'Kill Port (Mac/Linux)', cmd: 'lsof -ti:8000 | xargs kill -9' },
    ],
    language: 'bash',
    codeSnippet: `# ==========================================
# 1. SOLUSI ERROR "PORT 8000 ALREADY IN USE"
# ==========================================
# Di Windows (CMD / PowerShell):
netstat -ano | findstr :8000
taskkill /PID 12345 /F

# Di Linux / macOS:
lsof -i :8000
kill -9 12345

# ==========================================
# 2. PERINTAH DARURAT GIT
# ==========================================
# Salah commit dan mau edit lagi kodingannya (kode TIDAK hilang!)
git reset --soft HEAD~1

# Simpan kodingan sementara saat harus pindah branch mendadak
git stash push -m "wip fitur pembayaran"
git checkout main
# ... kembali ke branch kerja:
git stash pop

# Ubah pesan commit terakhir yang typo
git commit --amend -m "feat(auth): tambah validasi token JWT"`,
    keyTakeaways: [
      'git reset --soft HEAD~1 membatalkan commit namun semua kodingan Anda tetap utuh di editor.',
      'Saat server gagal jalan karena port terpakai (EADDRINUSE), gunakan netstat/lsof lalu matikan PID-nya.',
      'Jangan pernah melakukan git push --force di branch main bersama tim!',
    ],
    gotchas: [
          "Menjalankan git reset --hard tanpa memastikan perubahan yang belum di-commit sudah di-stash (data yang belum di-track bisa hilang permanen).",
          "Melakukan git push --force ke branch utama (main/master) yang dipakai tim kolaborasi."
    ],
    tags: ['Git', 'Terminal', 'Port Conflict', 'DevOps', 'Troubleshooting'],
    docsUrl: 'https://git-scm.com/doc',
  },

  // -------------------------------------------------------------
  // CORE ALGORITHMS & REAL-WORLD UTILS
  // -------------------------------------------------------------
  {
    id: 'jwt-auth-middleware-pattern',
    title: 'Auth Recipe: JWT Token Sign, Verify & RBAC Guard',
    category: 'algorithms',
    platform: 'Universal Architecture',
    description:
      'Pola standar pembuatan token akses JWT (JSON Web Token), ekstraksi Bearer header, dan middleware verifikasi hak akses role-based.',
    cliCommands: [
      { label: 'Install Jose/JWT', cmd: 'npm install jsonwebtoken bcryptjs' },
    ],
    language: 'typescript',
    codeSnippet: `import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const SECRET_KEY = process.env.JWT_SECRET || 'dev-secret-minimum-32-characters-long';

interface AuthPayload {
  userId: number;
  email: string;
  role: 'admin' | 'member';
}

// 1. Generate Token saat Login
export function generateAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '7d' });
}

// 2. Middleware Verifikasi Bearer Token
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <TOKEN>"

  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak: Token tidak disertakan' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token tidak valid atau telah kedaluwarsa' });
    }
    (req as any).user = decoded as AuthPayload;
    next();
  });
}`,
    keyTakeaways: [
      'HTTP 401 Unauthorized dipakai saat token TIDAK ADA.',
      'HTTP 403 Forbidden dipakai saat token ADA tetapi SALAH atau role kurang tinggi.',
      'Jangan pernah menyimpan password hash di dalam payload JWT karena JWT bisa di-decode siapa saja.',
    ],
    gotchas: [
          "Menaruh data rahasia seperti password atau credit card di dalam payload JWT (payload JWT hanya di-encode Base64, bukan dienkripsi dan bisa dibaca siapa saja di jwt.io).",
          "Menggunakan secret key yang pendek atau hardcoded di source code repo.",
          "Tidak menerapkan token revocation / blacklist saat user logout atau ganti password."
    ],
    tags: ['Auth', 'JWT', 'Security', 'Middleware', 'Architecture'],
  },
  {
    id: 'api-response-pagination-recipe',
    title: 'API Envelope & Pagination Calculator (Standard JSON Contract)',
    category: 'algorithms',
    platform: 'REST Architecture',
    description:
      'Format pembungkus JSON standar industri ({ success, data, meta, error }) beserta rumus matematika kalkulasi Offset & Total Halaman pagination.',
    cliCommands: [],
    language: 'typescript',
    codeSnippet: `export interface PaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  meta?: PaginationMeta;
  error: { code: string; message: string } | null;
}

// Rumus Kalkulasi Pagination yang Selalu Dipakai di Backend:
export function calculatePagination(pageInput = 1, limitInput = 20, totalRecords = 0) {
  const page = Math.max(1, Number(pageInput) || 1);
  const limit = Math.min(100, Math.max(1, Number(limitInput) || 20));
  const offset = (page - 1) * limit; // Dipakai di SQL: LIMIT {limit} OFFSET {offset}
  const totalPages = Math.ceil(totalRecords / limit) || 1;

  return {
    offset,
    limit,
    meta: {
      page,
      limit,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}`,
    keyTakeaways: [
      'Rumus wajib SQL Offset: offset = (page - 1) * limit. (Halaman 1 = offset 0, Halaman 2 = offset 20).',
      'Selalu batasi limit maksimum (Math.min(100, limit)) agar user nakal tidak meminta 1 juta baris sekaligus.',
      'Format response seragam memudahkan frontend menampilkan tabel dan tombol Next/Prev.',
    ],
    gotchas: [
          "OFFSET besar di SQL (misal OFFSET 1000000) lambat karena database harus memindai 1 juta baris sebelum membuangnya. Gunakan Keysheet/Cursor Pagination (WHERE id > last_seen_id) untuk jutaan data.",
          "Lupa membatasi limit maksimum (misal user request ?limit=9999999) yang bisa memicu Out of Memory (OOM) di backend."
    ],
    tags: ['Pagination', 'REST API', 'Architecture', 'SQL Offset', 'JSON'],
  },
  {
    id: 'essential-utils-collection',
    title: 'Top 6 Fungsi Utilitas yang Selalu Dipakai di Koding Nyata',
    category: 'algorithms',
    platform: 'TypeScript / JavaScript',
    description:
      'Koleksi fungsi alat tempur wajib: Format Rupiah, Waktu Lampau (Time Ago), Debounce pencarian, Retry Backoff, Slugify URL, dan Array GroupBy.',
    cliCommands: [],
    language: 'typescript',
    codeSnippet: `// 1. Format Rupiah: 150000 -> "Rp 150.000"
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

// 2. Debounce: Cegah spam pemanggilan API pada kotak pencarian live
export function debounce<T extends (...args: any[]) => void>(fn: T, delayMs = 300) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

// 3. Slugify: "Judul Artikel Keren!" -> "judul-artikel-keren"
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\\s-]/g, '')
    .replace(/[\\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// 4. Waktu Lampau (Time Ago): "2 jam yang lalu"
export function timeAgo(date: Date | string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'baru saja';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return \`\${minutes} menit yang lalu\`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return \`\${hours} jam yang lalu\`;
  const days = Math.floor(hours / 24);
  return \`\${days} hari yang lalu\`;
}

// 5. Group Array of Objects: groupBy(users, 'role')
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const group = String(item[key]);
    acc[group] = acc[group] || [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

// 6. Auto-Retry Fetch saat Koneksi Flaky (Exponential Backoff)
export async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 500 * Math.pow(2, i)));
    }
  }
  throw new Error('Retry failed');
}`,
    keyTakeaways: [
      'Gunakan Intl.NumberFormat bawaan browser untuk performa pemformatan tercepat tanpa library tambahan.',
      'Debounce sangat krusial di kolom pencarian agar server tidak jebol diterpa request tiap ketikan huruf.',
      'withRetry otomatis mencoba ulang request yang gagal dengan jeda 500ms -> 1000ms -> 2000ms.',
    ],
    gotchas: [
          "Menggunakan fungsi rekursif deep clone sederhana pada objek yang memiliki circular reference yang memicu stack overflow.",
          "Lupa memanggil clearTimeout(timer) saat komponen unmount pada fungsi debounce."
    ],
    tags: ['Utils', 'Algorithms', 'TypeScript', 'Formatters', 'Debounce'],
  },
]

/**
 * Generates full Markdown export of the entire Dev Vault Playbook for offline reading
 */
export function exportVaultPlaybookMarkdown(): string {
  const lines: string[] = [
    '# DEV VAULT & SYNTAX PLAYBOOK (BLUEPRINTDEV KNOWLEDGE BASE)',
    '',
    '> Diekspor langsung dari BlueprintDev — Contekan Setup dari Nol, Struktur Folder, CLI Commands, dan Resep Sintaks Produksi.',
    '',
    '## Kamus Cepat Kode Status HTTP',
    '| Kode | Nama | Kapan Digunakan |',
    '| :--- | :--- | :--- |',
    ...HTTP_STATUS_CHEATSHEET.map((s) => `| **${s.code}** | ${s.name} | ${s.whenToUse} |`),
    '',
    '## Contekan Kompleksitas Algoritma (Big-O)',
    '| Notasi | Nama | Contoh | Operasi pada 1 Juta Data |',
    '| :--- | :--- | :--- | :--- |',
    ...BIG_O_CHEATSHEET.map((b) => `| \`${b.notation}\` | ${b.name} | ${b.realWorldExample} | ${b.opsAtOneMillion} |`),
    '',
    '---',
    '',
  ]

  for (const item of VAULT_ENTRIES) {
    lines.push(`## ${item.title} (${item.platform})`)
    lines.push(`**Kategori:** \`${item.category.toUpperCase()}\` | **Tags:** ${item.tags.map((t) => `\`#${t}\``).join(' ')}`)
    lines.push('')
    lines.push(item.description)
    lines.push('')

    if (item.setupSteps && item.setupSteps.length > 0) {
      lines.push('### Langkah Setup dari Nol:')
      item.setupSteps.forEach((step, idx) => {
        lines.push(`${idx + 1}. ${step}`)
      })
      lines.push('')
    }

    if (item.folderStructure) {
      lines.push('### Struktur Folder Standar:')
      lines.push('```text')
      lines.push(item.folderStructure)
      lines.push('```')
      lines.push('')
    }

    if (item.cliCommands && item.cliCommands.length > 0) {
      lines.push('### Perintah Terminal Wajib:')
      lines.push('```bash')
      for (const c of item.cliCommands) {
        lines.push(`# ${c.label}`)
        lines.push(c.cmd)
      }
      lines.push('```')
      lines.push('')
    }

    lines.push('### Pola Sintaks Produksi:')
    lines.push(`\`\`\`${item.language}`)
    lines.push(item.codeSnippet)
    lines.push('```')
    lines.push('')

    lines.push('### Aturan Emas & Pro Tips:')
    for (const tip of item.keyTakeaways) {
      lines.push(`- ${tip}`)
    }
    lines.push('')

    if (item.gotchas && item.gotchas.length > 0) {
      lines.push('### ⚠️ Jebakan Batman & Anti-Patterns:')
      for (const gotcha of item.gotchas) {
        lines.push(`- ${gotcha}`)
      }
      lines.push('')
    }
    lines.push('---')
    lines.push('')
  }

  return lines.join('\n')
}
