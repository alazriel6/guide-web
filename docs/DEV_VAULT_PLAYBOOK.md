# DEV VAULT & SYNTAX PLAYBOOK (MASTER DEVELOPER BIBLE v2.0)

> **PRD Studio Comprehensive Engineering Knowledge Base**  
> *Buku Saku & Contekan Utama Software Engineer: Setup dari Nol, Struktur Folder Standar Industri, Perintah Terminal Wajib, Sintaks Produksi, dan Algoritma Inti Lintas Bahasa & Framework.*

---

## DAFTAR ISI
0. [Tabel Referensi Cepat (HTTP Status, Big-O, Package Manager Matrix)](#0-tabel-referensi-cepat-wajib-hafal)
1. [Web & Frontend Ecosystem (Vue 3, React 19/Next.js 15, Svelte 5, Angular 18, CSS Modern)](#1-web--frontend-ecosystem)
2. [Backend & Microservices (Python FastAPI, Go Chi, Node.js Express/TS, Rust Axum, C# .NET 8, Java Spring Boot 3, PHP Laravel 11, Elixir Phoenix)](#2-backend--microservices)
3. [Mobile App Development (Flutter/Dart, React Native Expo, Kotlin Jetpack Compose, Swift SwiftUI)](#3-mobile-app-development)
4. [Desktop Application Development (Tauri v2 Rust+Web, Electron IPC)](#4-desktop-application-development)
5. [Game Development (Unity C#, Unreal Engine 5 C++, Godot 4 GDScript)](#5-game-development)
6. [Systems & Low-Level Languages (Modern C++20, Zig, C)](#6-systems--low-level-languages)
7. [Database Topology & Caching (PostgreSQL 16, Redis 7, MongoDB, SQLite)](#7-database-topology--caching)
8. [DevOps, Linux Server & Git Mastery (Docker, Bash Port/Process CLI, Git Emergency)](#8-devops-linux-server--git-mastery)
9. [Core Algorithms, Auth, Pagination & Real-World Utility Recipes](#9-core-algorithms-auth-pagination--real-world-utility-recipes)

---

## 0. Tabel Referensi Cepat (Wajib Hafal)

### A. Kamus Kode Status HTTP (Standar REST API & QA Testing)
| Kode | Nama Status | Kapan Harus Dipakai di Backend / Dicek saat QA? |
| :--- | :--- | :--- |
| **`200 OK`** | Sukses Standar | `GET`, `PUT`, `PATCH` berhasil mengembalikan data. |
| **`201 Created`** | Berhasil Dibuat | `POST` berhasil membuat record baru di database. |
| **`204 No Content`** | Sukses Tanpa Body | `DELETE` berhasil menghapus data (response body kosong). |
| **`400 Bad Request`** | Request Rusak | JSON syntax salah, parameter query tidak valid. |
| **`401 Unauthorized`** | Belum Login / Token Kosong | Header `Authorization: Bearer` tidak dikirim atau format salah. |
| **`403 Forbidden`** | Dilarang (Role Kurang) | Sudah login, tapi role `member` mencoba akses halaman `admin`. |
| **`404 Not Found`** | Data Tidak Ditemukan | ID yang dicari (`GET /items/99999`) tidak ada di database. |
| **`409 Conflict`** | Duplikat Data | Register dengan email atau username yang sudah terdaftar (`UNIQUE` constraint). |
| **`422 Unprocessable`** | Gagal Validasi Input | Email salah format, password kurang dari 8 karakter (Pydantic / Zod error). |
| **`429 Too Many Req`** | Kena Rate Limit | User melakukan spam klik / brute-force melebihi batas per menit. |
| **`500 Server Error`** | Bug di Backend | Unhandled exception, query SQL salah syntax, null pointer. **(Harus 0 di Production!)** |

### B. Matriks Perintah Terminal Lintas Bahasa (Anti Lupa Setup)
| Bahasa / Stack | Init Project Baru | Install Package | Jalankan Dev Server | Jalankan Unit Test | Build Production |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Node / TS (pnpm)** | `pnpm init` | `pnpm add <pkg>` | `pnpm dev` | `pnpm test` | `pnpm build` |
| **Python (uv / pip)** | `python -m venv .venv` | `pip install <pkg>` | `uvicorn main:app --reload` | `pytest` | `docker build .` |
| **Go (Golang)** | `go mod init <nama>` | `go get <url>` | `go run ./cmd/api` | `go test ./...` | `go build -o app` |
| **Rust (Cargo)** | `cargo new <nama>` | `cargo add <pkg>` | `cargo run` | `cargo test` | `cargo build --release` |
| **C# (.NET 8+)** | `dotnet new webapi` | `dotnet add package <p>`| `dotnet watch run` | `dotnet test` | `dotnet publish -c Release`|
| **PHP (Laravel)** | `composer create-project`| `composer require <p>` | `php artisan serve` | `php artisan test` | `php artisan optimize` |
| **Flutter (Dart)** | `flutter create <app>` | `flutter pub add <p>` | `flutter run` | `flutter test` | `flutter build apk` |

### C. Contekan Kompleksitas Algoritma (Big-O Notation)
| Notasi | Nama | Contoh Operasi Nyata | Performa pada 1 Juta Data |
| :--- | :--- | :--- | :--- |
| `O(1)` | Constant | Akses HashMap / Object key (`map.get(id)`), Array index `arr[0]` | Instan (~1 operasi) |
| `O(log n)` | Logarithmic | Binary Search, Query SQL dengan **B-Tree Index** (`WHERE id = 500`) | Sangat Cepat (~20 operasi) |
| `O(n)` | Linear | Satu kali loop (`arr.filter()`, `arr.map()`, SQL Full Table Scan) | Cepat (~1.000.000 operasi) |
| `O(n log n)` | Linearithmic | Sorting standar (`arr.sort()`, Merge Sort, Quick Sort) | Sedang (~20 juta operasi) |
| `O(n^2)` | Quadratic | **Nested Loop** (`for` di dalam `for`, N+1 Query Problem di ORM) | **Lambat / Bahaya Freeze!** (1 Triliun!) |

---

## 1. Web & Frontend Ecosystem

### A. Vue 3 (Composition API + `<script setup>` + Pinia + Axios)
* **Setup dari Nol:**
  1. Jalankan `npm create vue@latest my-app` (Pilih: *TypeScript, Vue Router, Pinia, ESLint*).
  2. Masuk folder: `cd my-app && npm install && npm install axios`.
  3. Jalankan: `npm run dev`.
* **Struktur Folder Standar:**
  ```text
  src/
  ├── components/       # UI Komponen reusable (Button, Modal, Card)
  ├── views/            # Halaman utama yang terhubung ke Router
  ├── stores/           # State global Pinia (authStore.ts, prdStore.ts)
  ├── services/         # Axios instance & fungsi pemanggil API
  └── router/           # Konfigurasi rute & navigation guard
  ```
* **Pola Sintaks Inti:**
  ```vue
  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useAppStore } from '@/stores/appStore'

  const store = useAppStore()
  const searchQuery = ref('')
  const filteredData = computed(() =>
    store.items.filter(i => i.title.toLowerCase().includes(searchQuery.value.toLowerCase()))
  )

  onMounted(async () => {
    await store.fetchInitialData()
  })
  </script>

  <template>
    <input v-model="searchQuery" placeholder="Cari item..." />
    <ul>
      <li v-for="item in filteredData" :key="item.id">{{ item.title }}</li>
    </ul>
  </template>
  ```

### B. React 19 & Next.js 15 (App Router + Server Actions)
* **Setup dari Nol:**
  1. Jalankan `npx create-next-app@latest my-app --typescript --tailwind --app`.
  2. Tambah validasi & state: `npm install zod zustand lucide-react`.
  3. Jalankan: `npm run dev`.
* **Struktur Folder App Router:**
  ```text
  app/
  ├── (auth)/login/page.tsx     # Route group halaman login
  ├── dashboard/
  │   ├── page.tsx              # Server Component (fetch DB langsung)
  │   └── loading.tsx           # Skeleton UI otomatis saat loading
  ├── api/webhooks/route.ts     # REST API Route Handler
  └── actions/                  # Server Actions ('use server')
  ```
* **Pola Server Action & Client Form:**
  ```typescript
  // app/actions/workspace.ts
  'use server'
  import { revalidatePath } from 'next/cache'
  import { db } from '@/lib/db'

  export async function createWorkspaceAction(formData: FormData) {
    const name = String(formData.get('name') || '').trim()
    if (name.length < 3) return { error: 'Nama minimal 3 karakter' }

    await db.workspace.create({ data: { name } })
    revalidatePath('/dashboard')
    return { success: true }
  }
  ```

### C. Svelte 5 (Runes Reactivity)
* **Pola Sintaks Inti (`$state`, `$derived`, `$effect`, `$props`):**
  ```svelte
  <script lang="ts">
    let { initialCount = 0 }: { initialCount?: number } = $props();
    let count = $state(initialCount);
    let doubled = $derived(count * 2);

    $effect(() => {
      console.log(`Nilai berubah: ${count}`);
    });
  </script>

  <button onclick={() => count++}>Klik: {count} (2x = {doubled})</button>
  ```

### D. Angular 18+ (Signals & Standalone Components)
* **Setup dari Nol:** `npx @angular/cli@latest new my-ng-app --standalone`
* **Pola Sintaks Signals:**
  ```typescript
  import { Component, signal, computed } from '@angular/core';

  @Component({
    selector: 'app-counter',
    standalone: true,
    template: `
      <button (click)="increment()">Count: {{ count() }} (Double: {{ doubleCount() }})</button>
      @if (count() > 5) { <p>Target tercapai!</p> }
    `
  })
  export class CounterComponent {
    count = signal(0);
    doubleCount = computed(() => this.count() * 2);
    increment() { this.count.update(v => v + 1); }
  }
  ```

### E. CSS Modern Layout Recipes (Anti Lupa Flexbox & Grid)
```css
/* 1. Tengah Sempurna Vertikal & Horizontal */
.center-box {
  display: grid;
  place-items: center;
}

/* 2. Grid Responsif Otomatis Tanpa Media Query (Auto-Fit Cards) */
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

/* 3. App Shell Layout (Sidebar Kiri Tetap + Konten Kanan Scroll) */
.workbench-shell {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}
```

---

## 2. Backend & Microservices

### A. Python 3.12 (FastAPI + Pydantic v2 + SQLAlchemy 2 Async)
* **Setup dari Nol:**
  ```bash
  mkdir backend && cd backend
  python -m venv .venv
  .venv\Scripts\activate              # Windows (Linux/Mac: source .venv/bin/activate)
  pip install fastapi uvicorn[standard] pydantic[email] sqlalchemy asyncpg
  uvicorn app.main:app --reload --port 8000
  ```
* **Struktur Folder Standar:**
  ```text
  backend/
  ├── app/
  │   ├── api/v1/          # Route endpoints (users.py, orders.py)
  │   ├── core/            # Config env, JWT security, database connection
  │   ├── models/          # SQLAlchemy ORM tables
  │   ├── schemas/         # Pydantic DTO request/response
  │   ├── services/        # Business logic
  │   └── main.py          # Entry point FastAPI
  └── requirements.txt
  ```

### B. Go 1.22+ (Chi Router + Clean Architecture + Context Timeout)
* **Setup dari Nol:**
  ```bash
  mkdir backend && cd backend
  go mod init github.com/username/project
  go get github.com/go-chi/chi/v5 github.com/jackc/pgx/v5/pgxpool
  go run ./cmd/api/main.go
  ```
* **Struktur Folder Standar Go:**
  ```text
  backend/
  ├── cmd/api/main.go          # Entry point aplikasi
  ├── internal/
  │   ├── handlers/            # HTTP Handler (parse JSON, kirim response)
  │   ├── services/            # Business logic murni
  │   ├── repository/          # Query SQL / GORM / pgx
  │   └── middleware/          # Auth JWT, Logger, CORS
  └── go.mod
  ```

### C. Node.js 20+ (Express + TypeScript + Prisma ORM + Zod)
* **Setup dari Nol:**
  ```bash
  npm init -y
  npm install express cors dotenv zod @prisma/client
  npm install -D typescript tsx @types/node @types/express prisma
  npx tsc --init && npx prisma init
  npx tsx watch src/index.ts
  ```
* **Pola Validasi Zod + Async Handler:**
  ```typescript
  import express from 'express';
  import { z } from 'zod';

  const app = express();
  app.use(express.json());

  const CreateOrderSchema = z.object({
    productId: z.number().int().positive(),
    qty: z.number().int().min(1).max(100),
  });

  app.post('/api/orders', async (req, res) => {
    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.flatten() });
    }
    return res.status(201).json({ data: parsed.data });
  });
  ```

### D. Rust (Axum 0.7 + Tokio + SQLx)
* **Setup dari Nol:**
  ```bash
  cargo new backend --bin && cd backend
  cargo add axum tokio --features tokio/full
  cargo add serde serde_json --features serde/derive
  cargo run
  ```

### E. Java 21 + Spring Boot 3 (REST Controller + JPA)
```java
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService service;

    @GetMapping
    public ResponseEntity<List<ProductDTO>> listAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @PostMapping
    public ResponseEntity<ProductDTO> create(@Valid @RequestBody CreateProductReq req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }
}
```

### F. Elixir + Phoenix (Functional Pipeline & Fault-Tolerant Actor)
```elixir
defmodule MyAppWeb.OrderController do
  use MyAppWeb, :controller

  def create(conn, %{"order" => order_params}) do
    order_params
    |> Orders.validate_inventory()
    |> Orders.persist_order()
    |> case do
      {:ok, order} -> conn |> put_status(:created) |> json(%{data: order})
      {:error, reason} -> conn |> put_status(:unprocessable_entity) |> json(%{error: reason})
    end
  end
end
```

---

## 3. Mobile App Development

### A. Flutter 3 (Dart + Riverpod)
* **Setup dari Nol:** `flutter create my_app && cd my_app && flutter pub add flutter_riverpod dio`
* **Struktur Folder Feature-First:** `lib/features/{auth,home,orders}/{data,domain,presentation}/`

### B. React Native (Expo SDK 50+)
* **Setup dari Nol:** `npx create-expo-app@latest my-mobile && cd my-mobile && npx expo start`

### C. Kotlin Android (Jetpack Compose + ViewModel StateFlow)
```kotlin
@Composable
fun OrderScreen(viewModel: OrderViewModel = viewModel()) {
    val state by viewModel.uiState.collectAsState()
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text(text = "Total Order: ${state.count}", style = MaterialTheme.typography.headlineSmall)
        Button(onClick = { viewModel.increment() }) {
            Text("Tambah Order")
        }
    }
}
```

### D. Swift iOS (SwiftUI `@Observable` + `async/await`)
```swift
import SwiftUI
import Observation

@Observable
class FeedViewModel {
    var items: [String] = []
    var isLoading = false

    func loadData() async {
        isLoading = true
        try? await Task.sleep(for: .seconds(1))
        items = ["Item A", "Item B"]
        isLoading = false
    }
}

struct FeedView: View {
    @State private var vm = FeedViewModel()
    var body: some View {
        List(vm.items, id: \.self) { Text($0) }
            .task { await vm.loadData() }
    }
}
```

---

## 4. Desktop Application Development

### A. Tauri v2 (Rust Core + Vue/React Frontend)
* **Setup dari Nol:** `npm create tauri-app@latest` &rarr; `npm run tauri dev`

### B. Electron (Main Process + Secure Preload `contextBridge`)
```typescript
// preload.ts (Jembatan aman antara Node.js dan Browser UI)
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desktopApi', {
  saveFile: (content: string) => ipcRenderer.invoke('dialog:saveFile', content),
});
```

---

## 5. Game Development

### A. Unity 6 (C# MonoBehaviour Lifecycle)
* **Urutan Eksekusi Unity:** `Awake()` (Inisialisasi referensi) &rarr; `OnEnable()` &rarr; `Start()` &rarr; `FixedUpdate()` (Physics 50Hz) &rarr; `Update()` (Input & logic per frame) &rarr; `LateUpdate()` (Kamera).

### B. Unreal Engine 5 (C++ Actor Macros)
```cpp
UCLASS()
class MYGAME_API ACollectibleActor : public AActor {
    GENERATED_BODY()
public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
    int32 ScoreValue = 100;

    UFUNCTION(BlueprintCallable, Category = "Actions")
    void OnCollected();
};
```

### C. Godot 4 (GDScript `CharacterBody2D` & Signals)
```gdscript
signal health_changed(new_value: int)
@export var max_health: int = 100
```

---

## 6. Systems & Low-Level Languages

### A. Modern C++20 (RAII & Smart Pointers — Tanpa Memory Leak)
```cpp
#include <memory>
#include <vector>
#include <iostream>

struct SensorNode {
    int id;
    explicit SensorNode(int id) : id(id) {}
};

int main() {
    // Gunakan std::make_unique alih-alih raw 'new' dan 'delete'
    auto node = std::make_unique<SensorNode>(42);
    std::cout << "Sensor ID: " << node->id << "\n";
    return 0; // Otomatis di-free saat keluar scope!
}
```

### B. Zig (Explicit Allocator + `defer`)
```zig
const std = @import("std");
pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const buf = try gpa.allocator().alloc(u8, 256);
    defer gpa.allocator().free(buf);
}
```

---

## 7. Database Topology & Caching

### A. PostgreSQL 16 (Transaksi, JSONB, Indexing & QA Queries)
```sql
-- 1. Transaksi Aman (Atomicity: Sukses Semua atau Batal Semua)
BEGIN;
UPDATE accounts SET balance = balance - 100000 WHERE id = 1;
UPDATE accounts SET balance = balance + 100000 WHERE id = 2;
INSERT INTO ledger_entries (from_id, to_id, amount) VALUES (1, 2, 100000);
COMMIT;

-- 2. Pagination dengan Total Count
SELECT id, name, created_at, COUNT(*) OVER() AS total_count
FROM products
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

### B. Redis 7 (Cache-Aside & Rate Limiting)
```bash
SET session:user:101 "{\"role\":\"admin\"}" EX 3600
GET session:user:101
TTL session:user:101
```

---

## 8. DevOps, Linux Server & Git Mastery

### A. Perintah Terminal Survival (Saat Port Bentrok / Server Hang)
```bash
# Cari & matikan proses yang membuat port 8000 bentrok di Windows (PowerShell/CMD)
netstat -ano | findstr :8000
taskkill /PID <NOMOR_PID> /F

# Cari & matikan proses di port 8000 (Linux / macOS)
lsof -i :8000
kill -9 <PID>

# Cek penggunaan disk & RAM di server Linux
df -h
free -m
tail -f /var/log/nginx/error.log
```

### B. Git Cheatsheet Lengkap
```bash
git status -s                           # Cek file berubah secara ringkas
git checkout -b feat/nama-fitur         # Buat & pindah ke branch baru
git reset --soft HEAD~1                 # Batalkan commit terakhir, kodingan tetap aman
git stash push -m "wip" && git stash pop # Simpan sementara lalu kembalikan
git log --oneline --graph --all         # Visualisasi pohon branch
```

---

## 9. Core Algorithms, Auth, Pagination & Real-World Utility Recipes

### A. Standar Response JSON API & Global Error Envelope
Selalu gunakan struktur JSON yang seragam di semua endpoint agar frontend mudah menanganinya:
```json
{
  "success": true,
  "data": { "id": 1, "name": "Workspace Utama" },
  "meta": { "page": 1, "limit": 20, "total": 145, "totalPages": 8 },
  "error": null
}
```

### B. Algoritma Fetch Retry dengan Exponential Backoff
```typescript
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelayMs = 500
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries - 1) throw err;
      const waitTime = baseDelayMs * Math.pow(2, attempt); // 500ms, 1000ms, 2000ms
      await new Promise((r) => setTimeout(r, waitTime));
    }
  }
  throw new Error('Unreachable');
}
```

---
*Generated by PRD Studio Knowledge Base & Developer Playbook Engine v2.0.*
