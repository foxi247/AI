# PROJECT STATUS — AI SaaS App Builder
> Этот файл обновляется при каждом изменении. Всегда читай его в начале сессии.

---

## ПРАВИЛО ДЛЯ CLAUDE
> **При каждой сессии:** прочитай этот файл ПЕРВЫМ. Обнови его ПОСЛЕДНИМ.
> Пиши сюда всё: что сделано, что в процессе, что надо сделать, баги, идеи.

---

## Текущий статус: 🚧 В РАЗРАБОТКЕ — Фаза 1 (MVP)

**Ветка:** `claude/ai-saas-app-builder-VJpFB`
**Стек:** Next.js 14, TypeScript, Tailwind CSS, Monaco Editor, Mistral Codestral API
**Последнее обновление:** 2026-03-18

---

## Архитектура проекта

```
/home/user/AI/
├── PROJECT_STATUS.md          ← этот файл
└── app/                       ← Next.js приложение
    ├── src/
    │   ├── app/               ← App Router
    │   │   ├── page.tsx       ← Landing page
    │   │   ├── pricing/       ← Pricing page
    │   │   ├── docs/          ← Documentation
    │   │   ├── auth/          ← Login / Signup
    │   │   ├── dashboard/     ← Dashboard (проекты)
    │   │   └── workspace/     ← Project Workspace
    │   ├── components/
    │   │   ├── landing/       ← Landing page компоненты
    │   │   ├── workspace/     ← Workspace компоненты
    │   │   │   ├── Editor/    ← Monaco Code Editor
    │   │   │   ├── AIChat/    ← AI Chat Panel
    │   │   │   ├── Preview/   ← Live Preview
    │   │   │   ├── Terminal/  ← Terminal
    │   │   │   └── FileExplorer/
    │   │   ├── ai-config/     ← Custom AI Configuration Panel
    │   │   └── ui/            ← Общие UI компоненты
    │   ├── lib/
    │   │   ├── mistral.ts     ← Mistral Codestral API клиент
    │   │   ├── ai-router.ts   ← Роутер запросов между AI агентами
    │   │   └── types.ts       ← TypeScript типы
    │   └── store/             ← Zustand state management
```

---

## ✅ Сделано

- [x] Создан файл PROJECT_STATUS.md
- [x] Next.js проект создан
- [x] Landing page (Hero, Features, How it works, CTA)
- [x] Pricing page (Free / Pro / Team тиры)
- [x] Навигация (Navbar + Footer)
- [x] Auth страницы (Login / Signup)
- [x] Dashboard (список проектов + создание нового)
- [x] Project Workspace layout
- [x] File Explorer компонент
- [x] Monaco Code Editor
- [x] AI Chat Panel
- [x] Live Preview (iframe)
- [x] Terminal (симулированный)
- [x] AI Configuration Panel (Custom AI API + роли)
- [x] Mistral Codestral интеграция (дефолтный AI)
- [x] Multi-agent система (роли: Planner, Coder, Architect, Reviewer, Fullstack)
- [x] API роуты для AI запросов

---

## 🔄 В процессе

- [ ] Тестирование всех компонентов
- [ ] Финальный коммит и пуш

---

## 📋 TODO (Следующие фазы)

### Фаза 2 (приоритет)
- [ ] Реальная аутентификация (NextAuth / Supabase Auth)
- [ ] База данных (Supabase / PostgreSQL) — хранение проектов
- [ ] WebContainers интеграция — реальный запуск кода в браузере
- [ ] Git интеграция — импорт/экспорт GitHub
- [ ] Environment Variables менеджер
- [ ] Diff view — показывать что изменил AI

### Фаза 3
- [ ] Real-time collaboration (Y.js / Liveblocks)
- [ ] История версий / снапшоты
- [ ] Deployment система — генерация публичных URL
- [ ] Custom domains
- [ ] Template marketplace

### Фаза 4 (бизнес)
- [ ] Stripe интеграция — платные планы
- [ ] Usage tracking (AI запросы, ресурсы)
- [ ] Team management
- [ ] Analytics dashboard

---

## 🐛 Известные баги / Ограничения

- Terminal — симулированный, не реальный bash (нужен WebContainers для реального)
- Preview — статический iframe, не полноценный sandbox
- Проекты хранятся в localStorage (временно, нужна БД)
- Аутентификация — мок (нужен реальный провайдер)

---

## 💡 Идеи для улучшения

- "Error Auto-Fix" — если в терминале ошибка, AI сам предлагает починить
- Streaming генерация — код появляется постепенно
- Onboarding без регистрации (как v0.dev)
- Стартовые промпты-подсказки для новых пользователей
- AI объясняет свои изменения после каждой генерации

---

## 🔑 API Ключи (тестовые)

- **Mistral Codestral (дефолт):** `Ra3flT4bkJdLOkh0OoNRkEVhz1byTlaU`
  - Модель: `codestral-latest`
  - Endpoint: `https://codestral.mistral.ai/v1`

---

## AI Агент Система

По умолчанию используется Mistral Codestral как "Fullstack Coder".
Пользователь может добавить своих AI агентов:

| Роль | Описание | System Prompt |
|------|----------|---------------|
| **Planner** | Планирует архитектуру и структуру | "You are a software architect..." |
| **Coder** | Пишет и изменяет код | "You are an expert programmer..." |
| **Architect** | Проектирует системы | "You are a system architect..." |
| **Reviewer** | Ревьюит и улучшает код | "You are a code reviewer..." |
| **Fullstack** | Делает всё | "You are a fullstack developer..." |

---

## Заметки по дизайну

- Цветовая схема: тёмная тема (dark mode first)
- Акцентный цвет: фиолетовый/синий градиент
- Шрифт: Inter (текст) + JetBrains Mono (код)
- Стиль: минималистичный, профессиональный
