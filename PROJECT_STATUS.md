# PROJECT STATUS — AI SaaS App Builder
> Этот файл обновляется при каждом изменении. **Всегда читай его в начале сессии.**

---

## ПРАВИЛО ДЛЯ CLAUDE
> **При каждой сессии:** прочитай этот файл ПЕРВЫМ. Обнови его ПОСЛЕДНИМ.
> Пиши сюда всё: что сделано, что в процессе, что надо сделать, баги, идеи.

---

## Текущий статус: ✅ Фаза 2 завершена

**Ветка:** `claude/ai-saas-app-builder-VJpFB`
**Стек:** Next.js 16, TypeScript, Tailwind CSS, Monaco Editor, Mistral Codestral, Supabase, WebContainers
**Последнее обновление:** 2026-03-18

---

## Архитектура проекта

```
/home/user/AI/
├── PROJECT_STATUS.md          ← этот файл
└── app/                       ← Next.js приложение
    ├── .env.local             ← Supabase URL + Anon Key
    ├── next.config.ts         ← COOP/COEP headers для WebContainers
    ├── supabase/
    │   └── schema.sql         ← SQL для запуска в Supabase Dashboard
    └── src/
        ├── proxy.ts           ← Auth middleware (Next.js 16 proxy)
        ├── app/
        │   ├── page.tsx           ← Landing page
        │   ├── pricing/           ← Pricing page
        │   ├── auth/login/        ← Login (Supabase Auth)
        │   ├── auth/signup/       ← Signup (Supabase Auth, no email confirm)
        │   ├── dashboard/         ← Dashboard (проекты из Supabase DB)
        │   ├── workspace/[id]/    ← Project Workspace
        │   └── api/ai/            ← AI API route (Mistral proxy)
        ├── components/
        │   ├── workspace/
        │   │   ├── WorkspaceLayout.tsx   ← Главный layout, auto-save в Supabase
        │   │   ├── CodeEditor.tsx        ← Monaco Editor
        │   │   ├── AIChat.tsx            ← AI Chat с streaming
        │   │   ├── LivePreview.tsx       ← iframe preview + WebContainer mode
        │   │   ├── Terminal.tsx          ← Real WebContainer terminal + fallback
        │   │   ├── FileExplorer.tsx      ← File tree
        │   │   └── WebContainerProvider.tsx ← WebContainer context
        │   ├── ai-config/
        │   │   └── AIConfigPanel.tsx     ← Custom AI agents
        │   └── ui/Button.tsx
        ├── lib/
        │   ├── supabase/
        │   │   ├── client.ts     ← Browser Supabase client
        │   │   ├── server.ts     ← Server Supabase client
        │   │   └── db.ts         ← DB операции (projects, files)
        │   ├── mistral.ts        ← Mistral API client
        │   └── types.ts          ← TypeScript типы + AI roles
        └── store/workspace.ts    ← Zustand store (UI state)
```

---

## ✅ Сделано (Фаза 1 + 2)

### Фаза 1 — MVP
- [x] Landing page, Pricing, Navbar
- [x] Auth pages (Login/Signup)
- [x] Dashboard с проектами
- [x] Project Workspace (Editor + Chat + Preview + Terminal + FileExplorer)
- [x] Monaco Code Editor
- [x] AI Chat с streaming (Mistral Codestral)
- [x] Live Preview (iframe)
- [x] Terminal (симулированный)
- [x] AI Configuration Panel (custom agents + роли)
- [x] Multi-agent система (5 ролей с system prompts)

### Фаза 2 — Supabase + WebContainers
- [x] **Supabase Auth** — email/password без подтверждения email
- [x] **Supabase DB** — projects + project_files таблицы с RLS
- [x] **Auth middleware** (`proxy.ts`) — защита `/dashboard`, `/workspace`
- [x] **Auto-save** — файлы сохраняются в Supabase с debounce 1.5с
- [x] **Dashboard** загружает проекты из Supabase
- [x] **WebContainers** — реальный Node.js в браузере (`@webcontainer/api`)
  - Автоматически бутается при открытии workspace
  - Монтирует файлы проекта
  - Реальные команды: npm install, node, ls, cat...
  - Fallback на симулированный терминал если WC недоступен
- [x] **COOP/COEP headers** в next.config.ts (требование WebContainers)
- [x] **Preview mode** — статический iframe + WebContainer server URL

---

## ⚠️ ВАЖНО — Нужно сделать вручную

### 1. Запустить SQL в Supabase Dashboard
**Supabase Dashboard** → SQL Editor → New query → вставить содержимое `supabase/schema.sql`

Это создаст таблицы: `profiles`, `projects`, `project_files`

### 2. Отключить email confirmation в Supabase
**Supabase Dashboard** → Authentication → Email → **отключить "Confirm email"**

Иначе при регистрации будет требоваться подтверждение по email.

---

## 📋 TODO (Фаза 3)

### Приоритет высокий
- [ ] **Stripe интеграция** — платные планы (уточнить у пользователя когда готов)
- [ ] **Git интеграция** — импорт/экспорт GitHub репозитория
- [ ] **Diff view** — показывать что именно изменил AI
- [ ] **Streaming в WebContainers** — AI сразу пишет в реальный файл
- [ ] **Environment Variables** — менеджер .env через UI

### Приоритет средний
- [ ] **Real-time collaboration** (Y.js / Liveblocks)
- [ ] **История версий** — снапшоты файлов
- [ ] **Deploy система** — реальный deploy (Vercel/Netlify API или собственный)
- [ ] **Custom domains**
- [ ] **Template marketplace**
- [ ] **AI error fix** — кнопка "Fix with AI" при ошибке в терминале

### UX
- [ ] **Resizable panels** — пользователь может двигать разделители
- [ ] **Keyboard shortcuts** — Ctrl+S сохранить, Ctrl+Enter запустить
- [ ] **Onboarding без регистрации** (как v0.dev)

---

## 🐛 Известные баги / Ограничения

- **WebContainers** требуют Chrome/Edge, HTTPS и правильных COOP/COEP заголовков. На localhost работает если сервер настроен правильно.
- **Preview** в WebContainer режиме: serverUrl пишется в sessionStorage — это временное решение, нужно через Context или store
- **Supabase schema** нужно создать вручную (нет auto-migration)
- **Mock deploy** — кнопка Deploy сейчас симулированная, нужна реальная интеграция

---

## 🔑 Credentials (тестовые)

### Supabase
- **URL:** `https://pumoltcbbjvstyoljbxi.supabase.co`
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (в .env.local)

### Mistral Codestral (дефолтный AI)
- **API Key:** `Ra3flT4bkJdLOkh0OoNRkEVhz1byTlaU`
- **Model:** `codestral-latest`
- **Endpoint:** `https://codestral.mistral.ai/v1`

---

## AI Агент Система

По умолчанию: Mistral Codestral как "Fullstack Coder" (готов к работе).

| Роль | Цвет | Назначение |
|------|------|-----------|
| **Planner** | Оранжевый | Планирует архитектуру |
| **Coder** | Зелёный | Пишет код |
| **Architect** | Голубой | Проектирует системы |
| **Reviewer** | Розовый | Ревьюит код |
| **Fullstack** | Фиолетовый | Делает всё (дефолт) |

Пользователь может добавить любой OpenAI-совместимый API.
