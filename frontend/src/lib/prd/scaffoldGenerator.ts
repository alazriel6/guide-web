import type { PrdModel } from './sections'
import { generateAgentFromPrd } from './agentGenerators'
import { generateOpenApiDocument, stringifyYaml } from './openapiGenerator'
import { generateSqlFromPrd } from './sqlGenerator'
import { generateHttpFile, generateQaTestPlan } from './qaGenerator'

export type ScaffoldTargetId =
  | 'fullstack-go-vue'
  | 'fullstack-fastapi-react'
  | 'fullstack-rust-axum'
  | 'fullstack-node-express'
  | 'fullstack-laravel-blade'
  | 'nextjs-fullstack'
  | 'firebase-webapp'
  | 'supabase-webapp'
  | 'vue-vite'
  | 'react-vite'

export interface ScaffoldTargetDef {
  id: ScaffoldTargetId
  name: string
  category: 'Full-Stack' | 'Frontend' | 'BaaS & Cloud' | 'Microservice'
  badge: string
  backendTech: string
  frontendTech: string
  description: string
  tags: string[]
}

export const SCAFFOLD_TARGETS: ScaffoldTargetDef[] = [
  {
    id: 'fullstack-go-vue',
    name: 'Go 1.22+ (Gin) & Vue 3 (Vite)',
    category: 'Full-Stack',
    badge: 'Go + Vue 3',
    backendTech: 'Go 1.22+ (Gin HTTP, GORM, PostgreSQL)',
    frontendTech: 'Vue 3 (<script setup>), TypeScript, Vite, Pinia',
    description: 'High-throughput compiled Go backend with reactive Vue 3 developer UI',
    tags: ['Go', 'Gin', 'GORM', 'PostgreSQL', 'Vue 3', 'TypeScript', 'Vite', 'Pinia'],
  },
  {
    id: 'fullstack-fastapi-react',
    name: 'Python 3.12 (FastAPI) & React 18',
    category: 'Full-Stack',
    badge: 'FastAPI + React',
    backendTech: 'Python 3.12 (FastAPI, Pydantic v2, SQLAlchemy 2, Uvicorn)',
    frontendTech: 'React 18/19, TypeScript, Vite, Tailwind CSS',
    description: 'High-speed Python REST API with async SQLAlchemy and modern React frontend',
    tags: ['Python', 'FastAPI', 'Pydantic', 'SQLAlchemy', 'React', 'TypeScript', 'Vite'],
  },
  {
    id: 'fullstack-rust-axum',
    name: 'Rust (Axum) & SvelteKit / React',
    category: 'Full-Stack',
    badge: 'Rust Axum',
    backendTech: 'Rust (Tokio, Axum, SQLx, Serde)',
    frontendTech: 'TypeScript, Vite (SvelteKit / React)',
    description: 'Ultra-low latency, zero-cost abstraction backend with memory safety guarantees',
    tags: ['Rust', 'Axum', 'Tokio', 'SQLx', 'TypeScript', 'Vite'],
  },
  {
    id: 'fullstack-node-express',
    name: 'Node.js (TypeScript Express) & Vue 3',
    category: 'Full-Stack',
    badge: 'Node + Express',
    backendTech: 'Node.js 20+, Express, Prisma ORM, TypeScript',
    frontendTech: 'Vue 3, TypeScript, Vite, Pinia',
    description: 'Universal end-to-end TypeScript stack with shared DTO validation interfaces',
    tags: ['Node.js', 'Express', 'Prisma', 'Vue 3', 'TypeScript'],
  },
  {
    id: 'fullstack-laravel-blade',
    name: 'PHP 8.3 (Laravel 11) & Blade UI',
    category: 'Full-Stack',
    badge: 'Laravel 11 + Blade',
    backendTech: 'PHP 8.3 (Laravel 11, Eloquent ORM, Artisan CLI)',
    frontendTech: 'Blade Templating Engine, Tailwind CSS, Vite',
    description: 'Battle-tested monolithic full-stack PHP with expressive Eloquent ORM and server-rendered Blade views',
    tags: ['PHP', 'Laravel', 'Blade', 'Eloquent', 'Artisan', 'Tailwind CSS', 'Vite'],
  },
  {
    id: 'nextjs-fullstack',
    name: 'Next.js 14/15 App Router (Prisma)',
    category: 'Full-Stack',
    badge: 'Next.js 14/15',
    backendTech: 'Next.js Server Actions, Route Handlers, Prisma ORM',
    frontendTech: 'React Server Components, Tailwind CSS, Zod',
    description: 'Full-stack monorepo with Server Actions and PostgreSQL persistence',
    tags: ['Next.js', 'React', 'Prisma', 'Tailwind', 'Zod', 'PostgreSQL'],
  },
  {
    id: 'firebase-webapp',
    name: 'Firebase BaaS & Vue/React Client',
    category: 'BaaS & Cloud',
    badge: 'Firebase BaaS',
    backendTech: 'Firebase Firestore, Firebase Auth, Cloud Functions (Node.js)',
    frontendTech: 'Vite (Vue 3 / React), Firebase Web SDK v10',
    description: 'Serverless real-time database with Google Auth, security rules, and cloud functions',
    tags: ['Firebase', 'Firestore', 'Cloud Functions', 'Auth', 'Vite'],
  },
  {
    id: 'supabase-webapp',
    name: 'Supabase BaaS (Postgres) & Web Client',
    category: 'BaaS & Cloud',
    badge: 'Supabase BaaS',
    backendTech: 'Supabase Managed PostgreSQL, Row-Level Security (RLS), Edge Functions',
    frontendTech: 'Vite (Vue 3 / React), Supabase JS Client',
    description: 'Open-source Firebase alternative with relational Postgres, RLS, and Auth',
    tags: ['Supabase', 'PostgreSQL', 'RLS', 'Edge Functions', 'Vite'],
  },
  {
    id: 'vue-vite',
    name: 'Vue 3 + Vite + TypeScript (SPA)',
    category: 'Frontend',
    badge: 'Vue 3 SPA',
    backendTech: 'None (Standalone Client)',
    frontendTech: 'Vue 3 Composition API, Pinia, Vue Router, Axios',
    description: 'Modern reactive frontend with strict TypeScript and Vite HMR',
    tags: ['Vue 3', 'Vite', 'TypeScript', 'Pinia', 'Axios'],
  },
  {
    id: 'react-vite',
    name: 'React 18 + Vite + TypeScript (SPA)',
    category: 'Frontend',
    badge: 'React SPA',
    backendTech: 'None (Standalone Client)',
    frontendTech: 'React 18, TypeScript, Vite, TanStack Query, Tailwind',
    description: 'Standard enterprise React frontend SPA with hooks and strict typing',
    tags: ['React', 'Vite', 'TypeScript', 'Tailwind', 'Axios'],
  },
]

export function getScaffoldTarget(id: ScaffoldTargetId): ScaffoldTargetDef {
  return SCAFFOLD_TARGETS.find((t) => t.id === id) || SCAFFOLD_TARGETS[0]!
}

/**
 * Escapes string for Windows batch echo with Set-Content / powershell injection.
 */
function escapeForBat(content: string): string {
  // Base64 encoding is the cleanest and 100% bug-free way to write multiline files in .bat!
  const utf8Bytes = new TextEncoder().encode(content)
  let binary = ''
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]!)
  }
  return btoa(binary)
}

/**
 * Generates ready-to-run docker-compose.yml for local database & Adminer browser UI
 */
export function generateDockerCompose(slug: string): string {
  const dbName = slug.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() + '_db'
  return `services:
  postgres:
    image: postgres:16-alpine
    container_name: ${slug}-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: devuser
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: ${dbName}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/init.sql

  # Lightweight Web Database Browser UI (No installation needed, port 8080)
  adminer:
    image: adminer:latest
    container_name: ${slug}-adminer
    restart: unless-stopped
    ports:
      - "8080:8080"
    depends_on:
      - postgres

volumes:
  pgdata:
`
}

/**
 * Generates pre-configured .env.example
 */
export function generateEnvExample(slug: string): string {
  const dbName = slug.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() + '_db'
  return `# Application Environment Configuration
NODE_ENV=development
PORT=8000

# Primary PostgreSQL Database (Local Docker or Native)
DATABASE_URL=postgresql://devuser:devpassword@localhost:5432/${dbName}?schema=public

# Optional SQLite Database (Zero-Docker Mode)
# SQLITE_URL=sqlite://./dev.db

# Authentication Secret
JWT_SECRET=dev-secret-key-change-in-production-min-32-chars
JWT_EXPIRATION=7d

# CORS Allowed Origins
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
`
}

/**
 * Generates Windows 1-command developer runner (dev.bat)
 */
export function generateDevBat(slug: string): string {
  const dbName = slug.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() + '_db'
  return `@echo off
setlocal
set CMD=%1

if "%CMD%"=="" goto help
if "%CMD%"=="help" goto help
if "%CMD%"=="up" goto docker_up
if "%CMD%"=="down" goto docker_down
if "%CMD%"=="test" goto run_tests
if "%CMD%"=="reset" goto reset_db

echo Unknown command: %CMD%
echo Type "dev help" for available commands.
exit /b 1

:docker_up
echo [DEV] Starting PostgreSQL and Adminer in Docker...
docker compose up -d
echo [DEV] Database active on localhost:5432
echo [DEV] Open Adminer Web UI in browser: http://localhost:8080
echo       (System: PostgreSQL, Server: postgres, User: devuser, Pass: devpassword, DB: ${dbName})
exit /b 0

:docker_down
echo [DEV] Stopping Docker containers...
docker compose down
exit /b 0

:run_tests
echo [DEV] Running automated API test suite (tests\\api.http)...
where httpyac >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    httpyac tests\\api.http --all
) else (
    echo [TIP] Open tests\\api.http in VS Code / Cursor with REST Client extension.
    echo       Or install CLI runner: npm i -g httpyac
)
exit /b 0

:reset_db
echo [DEV] Resetting database volume and re-applying schema.sql...
docker compose down -v
docker compose up -d
echo [DEV] Database reset complete!
exit /b 0

:help
echo ===============================================================================
echo                 PROJECT SHORTCUT RUNNER (dev.bat)
echo ===============================================================================
echo   dev up       - Start local PostgreSQL + Adminer database containers in Docker
echo   dev down     - Stop Docker database containers
echo   dev test     - Execute automated QA test suite (tests\\api.http)
echo   dev reset    - Reset database volume and re-run schema.sql from scratch
echo ===============================================================================
exit /b 0
`
}

/**
 * Generates Linux / macOS Makefile
 */
export function generateMakefile(): string {
  return `.PHONY: help up down test reset

help:
	@echo "Available commands:"
	@echo "  make up     - Start local PostgreSQL + Adminer in Docker"
	@echo "  make down   - Stop Docker database containers"
	@echo "  make test   - Run automated API test suite"
	@echo "  make reset  - Reset database and re-seed from scratch"

up:
	docker compose up -d
	@echo "Database ready on localhost:5432. Web UI: http://localhost:8080"

down:
	docker compose down

test:
	@which httpyac > /dev/null 2>&1 && httpyac tests/api.http --all || echo "Tip: Open tests/api.http in VS Code/Cursor REST Client"

reset:
	docker compose down -v
	docker compose up -d
`
}

/**
 * Generates a ready-to-run Windows batch script (`setup.bat`).
 * Double-clicking this script initializes the workspace, writes all spec files,
 * scaffolds project directories, and prepares git.
 */
export function generateWindowsBatchScript(
  model: PrdModel,
  targetId: ScaffoldTargetId = 'fullstack-go-vue',
): string {
  const target = getScaffoldTarget(targetId)
  const slug = (model.title || 'project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'prd-project'

  const agentsMd = generateAgentFromPrd('antigravity', model)
  const cursorRules = generateAgentFromPrd('cursor', model)
  const copilotMd = generateAgentFromPrd('copilot', model)
  const openApiYaml = stringifyYaml(generateOpenApiDocument(model))
  const schemaSql = generateSqlFromPrd(model, 'postgresql')
  const httpTestSuite = generateHttpFile(model)
  const qaTestPlan = generateQaTestPlan(model)
  const dockerCompose = generateDockerCompose(slug)
  const envExample = generateEnvExample(slug)
  const devBat = generateDevBat(slug)
  const makefile = generateMakefile()

  // Base64 payloads for clean file injection
  const b64Agents = escapeForBat(agentsMd)
  const b64Cursor = escapeForBat(cursorRules)
  const b64Copilot = escapeForBat(copilotMd)
  const b64OpenApi = escapeForBat(openApiYaml)
  const b64Schema = escapeForBat(schemaSql)
  const b64Http = escapeForBat(httpTestSuite)
  const b64QaPlan = escapeForBat(qaTestPlan)
  const b64Docker = escapeForBat(dockerCompose)
  const b64Env = escapeForBat(envExample)
  const b64DevBat = escapeForBat(devBat)
  const b64Makefile = escapeForBat(makefile)

  const readmeContent = `# ${model.title || 'Software Engineering Project'}

> **Generated via BlueprintDev Workbench**  
> Primary Stack Target: **${target.name}**  
> Category: **${model.category}**

## Project Overview
${model.overview}

## Problem Statement
${model.problem}

## Core Features & MVP Deliverables
${(model.features || []).map((f) => `- **${f.name}** [${f.priority.toUpperCase()}]: ${f.description}`).join('\n')}

## Architecture & System Guardrails
- **Antigravity Directives:** See \`./AGENTS.md\`
- **Cursor Rules:** See \`./.cursorrules\`
- **API Specification:** See \`./openapi.yaml\`
- **Database Schema:** See \`./schema.sql\`
- **Automated QA Test Suite:** See \`./tests/api.http\` (Execute via VS Code REST Client or \`dev test\`)
- **QA Master Test Plan:** See \`./docs/QA_TEST_PLAN.md\`
- **Container Infrastructure:** See \`./docker-compose.yml\` (Run \`dev up\` for local PostgreSQL + Adminer)

## Developer Quickstart Commands
\`\`\`bat
dev up       :: Start local PostgreSQL + Adminer database in Docker
dev test     :: Run automated QA tests from tests\\api.http
dev down     :: Stop Docker containers
\`\`\`

---
*Generated automatically by BlueprintDev on ${new Date().toLocaleDateString('en-US')}.*
`
  const b64Readme = escapeForBat(readmeContent)

  return `@echo off
setlocal enabledelayedexpansion
title BlueprintDev Project Scaffolder - ${slug}

color 0B
echo ===============================================================================
echo                BLUEPRINTDEV WORKBENCH: AUTOMATED REPO SCAFFOLDER
echo ===============================================================================
echo  Project Title : ${model.title || 'Untitled Project'}
echo  Target Stack  : ${target.name}
echo  Target Folder : %CD%\\${slug}
echo ===============================================================================
echo.

:: 1. Check Pre-requisites
echo [1/6] Checking runtime prerequisites...
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Git not found in PATH. Version control will not be initialized.
) else (
    echo  [OK] Git detected.
)

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Node.js not found in PATH. Frontend dependencies cannot be installed.
) else (
    echo  [OK] Node.js detected.
)

${target.id.includes('go') ? `where go >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Go compiler not found in PATH.
) else (
    echo  [OK] Go compiler detected.
)` : ''}

${target.id.includes('fastapi') ? `where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Python interpreter not found in PATH.
) else (
    echo  [OK] Python detected.
)` : ''}

${target.id.includes('rust') ? `where cargo >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Rust Cargo compiler not found in PATH.
) else (
    echo  [OK] Cargo detected.
)` : ''}

echo.

:: 2. Create Project Directory Structure
echo [2/6] Scaffolding directory tree...
if not exist "${slug}" mkdir "${slug}"
cd "${slug}"

${generateBatDirectoryTree(targetId)}

echo  [OK] Directories created.
echo.

:: 3. Injecting Architecture & AI Agent Specs
echo [3/6] Injecting AI Agent Guidelines and Specifications...

powershell -Command "[System.IO.File]::WriteAllBytes('README.md', [System.Convert]::FromBase64String('${b64Readme}'))"
powershell -Command "[System.IO.File]::WriteAllBytes('AGENTS.md', [System.Convert]::FromBase64String('${b64Agents}'))"
powershell -Command "[System.IO.File]::WriteAllBytes('.cursorrules', [System.Convert]::FromBase64String('${b64Cursor}'))"
if not exist ".github" mkdir ".github"
powershell -Command "[System.IO.File]::WriteAllBytes('.github\\copilot-instructions.md', [System.Convert]::FromBase64String('${b64Copilot}'))"
powershell -Command "[System.IO.File]::WriteAllBytes('openapi.yaml', [System.Convert]::FromBase64String('${b64OpenApi}'))"
powershell -Command "[System.IO.File]::WriteAllBytes('schema.sql', [System.Convert]::FromBase64String('${b64Schema}'))"
powershell -Command "[System.IO.File]::WriteAllBytes('docker-compose.yml', [System.Convert]::FromBase64String('${b64Docker}'))"
powershell -Command "[System.IO.File]::WriteAllBytes('.env.example', [System.Convert]::FromBase64String('${b64Env}'))"
powershell -Command "[System.IO.File]::WriteAllBytes('dev.bat', [System.Convert]::FromBase64String('${b64DevBat}'))"
powershell -Command "[System.IO.File]::WriteAllBytes('Makefile', [System.Convert]::FromBase64String('${b64Makefile}'))"
if not exist "tests" mkdir "tests"
powershell -Command "[System.IO.File]::WriteAllBytes('tests\\api.http', [System.Convert]::FromBase64String('${b64Http}'))"
if not exist "docs" mkdir "docs"
powershell -Command "[System.IO.File]::WriteAllBytes('docs\\QA_TEST_PLAN.md', [System.Convert]::FromBase64String('${b64QaPlan}'))"

:: Write default .gitignore
(
echo # Dependencies
echo node_modules/
echo vendor/
echo .venv/
echo target/
echo.
echo # Build artifacts
echo dist/
echo build/
echo *.exe
echo *.dll
echo.
echo # Environment variables
echo .env
echo .env.local
echo.
echo # IDE and OS files
echo .DS_Store
echo Thumbs.db
echo .idea/
echo .vscode/*.log
) > .gitignore

echo  [OK] Spec files written: README.md, AGENTS.md, .cursorrules, openapi.yaml, schema.sql, docker-compose.yml, tests\\api.http, docs\\QA_TEST_PLAN.md.
echo.

:: 4. Framework Project Initializer
echo [4/6] Bootstrapping target framework templates...
${generateBatFrameworkCommands(targetId, slug)}

echo  [OK] Framework templates initialized.
echo.

:: 5. Initialize Git Repository
echo [5/6] Initializing local Git repository...
where git >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    if not exist ".git" (
        git init -b main
        git add .
        git commit -m "feat: initial project scaffold from BlueprintDev"
        echo  [OK] Git repository initialized with initial architectural commit.
    ) else (
        echo  [INFO] Git repository already present.
    )
)
echo.

:: 6. Completion Summary & Launch
echo [6/6] Scaffold Complete!
echo ===============================================================================
echo  Project successfully bootstrapped at: %CD%
echo  AI Coding Guardrails: AGENTS.md, .cursorrules
echo  API Specification   : openapi.yaml
echo  Database Schema     : schema.sql
echo ===============================================================================
echo.
echo Launching your code editor...
where cursor >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Opening Cursor IDE...
    cursor .
) else (
    where code >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo Opening VS Code...
        code .
    ) else (
        echo Open this directory with: cd "${slug}"
    )
)

echo.
pause
`
}

/**
 * Generates directory scaffolding lines for Windows batch.
 */
function generateBatDirectoryTree(targetId: ScaffoldTargetId): string {
  const common = `if not exist "docs" mkdir "docs"
if not exist "tests" mkdir "tests"`
  switch (targetId) {
    case 'fullstack-go-vue':
      return `${common}
if not exist "backend\\cmd\\api" mkdir "backend\\cmd\\api"
if not exist "backend\\internal\\handlers" mkdir "backend\\internal\\handlers"
if not exist "backend\\internal\\services" mkdir "backend\\internal\\services"
if not exist "backend\\internal\\models" mkdir "backend\\internal\\models"
if not exist "backend\\internal\\config" mkdir "backend\\internal\\config"
if not exist "frontend" mkdir "frontend"`

    case 'fullstack-fastapi-react':
      return `${common}
if not exist "backend\\app\\api\\v1" mkdir "backend\\app\\api\\v1"
if not exist "backend\\app\\models" mkdir "backend\\app\\models"
if not exist "backend\\app\\services" mkdir "backend\\app\\services"
if not exist "backend\\app\\core" mkdir "backend\\app\\core"
if not exist "frontend" mkdir "frontend"`

    case 'fullstack-rust-axum':
      return `${common}
if not exist "backend\\src\\handlers" mkdir "backend\\src\\handlers"
if not exist "backend\\src\\models" mkdir "backend\\src\\models"
if not exist "frontend" mkdir "frontend"`

    case 'fullstack-node-express':
      return `${common}
if not exist "backend\\src\\controllers" mkdir "backend\\src\\controllers"
if not exist "backend\\src\\models" mkdir "backend\\src\\models"
if not exist "backend\\src\\routes" mkdir "backend\\src\\routes"
if not exist "frontend" mkdir "frontend"`

    case 'fullstack-laravel-blade':
      return `${common}
if not exist "app\\Http\\Controllers" mkdir "app\\Http\\Controllers"
if not exist "app\\Models" mkdir "app\\Models"
if not exist "database\\migrations" mkdir "database\\migrations"
if not exist "resources\\views\\layouts" mkdir "resources\\views\\layouts"
if not exist "routes" mkdir "routes"`

    case 'nextjs-fullstack':
      return `${common}
if not exist "app\\actions" mkdir "app\\actions"
if not exist "app\\api" mkdir "app\\api"
if not exist "components\\ui" mkdir "components\\ui"
if not exist "lib\\services" mkdir "lib\\services"
if not exist "prisma" mkdir "prisma"`

    case 'firebase-webapp':
      return `${common}
if not exist "functions\\src" mkdir "functions\\src"
if not exist "src\\services\\firebase" mkdir "src\\services\\firebase"`

    case 'supabase-webapp':
      return `${common}
if not exist "supabase\\migrations" mkdir "supabase\\migrations"
if not exist "src\\services\\supabase" mkdir "src\\services\\supabase"`

    case 'vue-vite':
    case 'react-vite':
    default:
      return `${common}
if not exist "src\\components" mkdir "src\\components"
if not exist "src\\views" mkdir "src\\views"
if not exist "src\\stores" mkdir "src\\stores"
if not exist "src\\services" mkdir "src\\services"`
  }
}

/**
 * Generates initial scaffolding CLI commands for Windows batch.
 */
function generateBatFrameworkCommands(targetId: ScaffoldTargetId, slug: string): string {
  switch (targetId) {
    case 'fullstack-go-vue':
      return `cd backend
if not exist "go.mod" (
    echo Initializing Go module...
    go mod init ${slug}/backend 2>nul
)
cd ..`

    case 'fullstack-fastapi-react':
      return `cd backend
(
echo fastapi>=0.110.0
echo uvicorn[standard]>=0.28.0
echo pydantic>=2.6.0
echo sqlalchemy>=2.0.28
echo psycopg2-binary>=2.9.9
) > requirements.txt
cd ..`

    case 'fullstack-rust-axum':
      return `cd backend
(
echo [package]
echo name = "${slug}-backend"
echo version = "0.1.0"
echo edition = "2021"
echo.
echo [dependencies]
echo axum = "0.7"
echo tokio = { version = "1.0", features = ["full"] }
echo serde = { version = "1.0", features = ["derive"] }
echo serde_json = "1.0"
) > Cargo.toml
cd ..`

    case 'fullstack-laravel-blade':
      return `if not exist "artisan" (
    echo Note: To scaffold complete Laravel core, run: composer create-project laravel/laravel .
    echo Setting up environment file...
    if exist ".env.example" copy /y ".env.example" ".env" >nul
)`

    case 'firebase-webapp':
      return `(
echo {
echo   "firestore": {
echo     "rules": "firestore.rules",
echo     "indexes": "firestore.indexes.json"
echo   },
echo   "functions": {
echo     "source": "functions"
echo   }
echo }
) > firebase.json`

    default:
      return `echo Skipping runtime-specific bundle download (pre-configured for IDE execution).`
  }
}

/**
 * Generates a ready-to-run Linux / macOS Bash script (`setup.sh`).
 */
export function generateBashScript(
  model: PrdModel,
  targetId: ScaffoldTargetId = 'fullstack-go-vue',
): string {
  const target = getScaffoldTarget(targetId)
  const slug = (model.title || 'project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'prd-project'

  const agentsMd = generateAgentFromPrd('antigravity', model)
  const cursorRules = generateAgentFromPrd('cursor', model)
  const copilotMd = generateAgentFromPrd('copilot', model)
  const openApiYaml = stringifyYaml(generateOpenApiDocument(model))
  const schemaSql = generateSqlFromPrd(model, 'postgresql')
  const httpTestSuite = generateHttpFile(model)
  const qaTestPlan = generateQaTestPlan(model)
  const dockerCompose = generateDockerCompose(slug)
  const envExample = generateEnvExample(slug)
  const devBat = generateDevBat(slug)
  const makefile = generateMakefile()

  const readmeContent = `# ${model.title || 'Software Engineering Project'}

> **Generated via BlueprintDev Workbench**  
> Primary Stack Target: **${target.name}**  
> Category: **${model.category}**

## Project Overview
${model.overview}

## Problem Statement
${model.problem}

## Core Features & MVP Deliverables
${(model.features || []).map((f) => `- **${f.name}** [${f.priority.toUpperCase()}]: ${f.description}`).join('\n')}

## Architecture & System Guardrails
- **Antigravity Directives:** See \`./AGENTS.md\`
- **Cursor Rules:** See \`./.cursorrules\`
- **API Specification:** See \`./openapi.yaml\`
- **Database Schema:** See \`./schema.sql\`
- **Automated QA Test Suite:** See \`./tests/api.http\` (Execute via VS Code REST Client or \`dev test\`)
- **QA Master Test Plan:** See \`./docs/QA_TEST_PLAN.md\`
- **Container Infrastructure:** See \`./docker-compose.yml\` (Run \`dev up\` or \`make up\`)

## Developer Quickstart Commands
\`\`\`bash
# Start local PostgreSQL and Adminer Web UI in Docker
dev up       # on Windows
make up      # on Linux / macOS

# Execute automated QA API tests
dev test     # on Windows
make test    # on Linux / macOS
\`\`\`
`

  return `#!/usr/bin/env bash
set -euo pipefail

echo "==============================================================================="
echo "               BLUEPRINTDEV WORKBENCH: AUTOMATED REPO SCAFFOLDER"
echo "==============================================================================="
echo " Project Title : ${model.title || 'Untitled Project'}"
echo " Target Stack  : ${target.name}"
echo " Target Folder : $(pwd)/${slug}"
echo "==============================================================================="
echo ""

mkdir -p "${slug}"
cd "${slug}"

# 1. Directory Scaffolding
echo "[1/4] Scaffolding directory tree..."
${generateBashDirectoryTree(targetId)}

# 2. Write Architectural Specifications & Agent Rules
echo "[2/4] Writing AI agent directives and API contracts..."
cat << 'EOF' > README.md
${readmeContent}
EOF

cat << 'EOF' > AGENTS.md
${agentsMd}
EOF

cat << 'EOF' > .cursorrules
${cursorRules}
EOF

mkdir -p .github
cat << 'EOF' > .github/copilot-instructions.md
${copilotMd}
EOF

cat << 'EOF' > openapi.yaml
${openApiYaml}
EOF

cat << 'EOF' > schema.sql
${schemaSql}
EOF

cat << 'EOF' > docker-compose.yml
${dockerCompose}
EOF

cat << 'EOF' > .env.example
${envExample}
EOF

cat << 'EOF' > dev.bat
${devBat}
EOF

cat << 'EOF' > Makefile
${makefile}
EOF

mkdir -p tests docs
cat << 'EOF' > tests/api.http
${httpTestSuite}
EOF

cat << 'EOF' > docs/QA_TEST_PLAN.md
${qaTestPlan}
EOF

cat << 'EOF' > .gitignore
node_modules/
vendor/
.venv/
target/
dist/
build/
*.exe
.env
.env.local
.DS_Store
EOF

echo "[3/4] Initializing Git repository..."
if command -v git &> /dev/null; then
  git init -b main
  git add .
  git commit -m "feat: initial project scaffold from BlueprintDev"
  echo " [OK] Git repo initialized."
fi

echo "[4/4] Project Scaffolding Complete!"
echo "Target directory: $(pwd)"
if command -v cursor &> /dev/null; then
  cursor .
elif command -v code &> /dev/null; then
  code .
fi
`
}

function generateBashDirectoryTree(targetId: ScaffoldTargetId): string {
  const common = `mkdir -p docs tests`
  switch (targetId) {
    case 'fullstack-go-vue':
      return `${common}\nmkdir -p backend/cmd/api backend/internal/handlers backend/internal/services backend/internal/models backend/internal/config frontend`
    case 'fullstack-fastapi-react':
      return `${common}\nmkdir -p backend/app/api/v1 backend/app/models backend/app/services backend/app/core frontend`
    case 'fullstack-rust-axum':
      return `${common}\nmkdir -p backend/src/handlers backend/src/models frontend`
    case 'fullstack-laravel-blade':
      return `${common}\nmkdir -p app/Http/Controllers app/Models database/migrations resources/views/layouts routes`
    case 'nextjs-fullstack':
      return `${common}\nmkdir -p app/actions app/api components/ui lib/services prisma`
    case 'firebase-webapp':
      return `${common}\nmkdir -p functions/src src/services/firebase`
    case 'supabase-webapp':
      return `${common}\nmkdir -p supabase/migrations src/services/supabase`
    default:
      return `${common}\nmkdir -p src/components src/views src/stores src/services`
  }
}
