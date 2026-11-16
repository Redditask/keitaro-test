# Frontend

Relay использует React, TypeScript, SCSS Modules, React Router и TanStack Query.

## Локальная разработка

Установите Node.js 24 с npm и [запустите FastAPI](../backend/README.md#локальный-запуск). В отдельном терминале из корня проекта выполните команды.

```text
cd frontend
npm ci
npm run dev
```

Откройте [список кампаний](http://127.0.0.1:5173/campaigns). Vite проксирует `/api` на `http://127.0.0.1:8000`.

## Структура

- `src/routing/routes.ts` задаёт адреса и формирует ссылки с параметром страницы списка. `src/routing/router.tsx` связывает адреса с экранами.
- `src/pages` содержит экраны и их компоненты, включая `CampaignCreationForm`. Общие компоненты, включая `AppHeader`, лежат в `src/components`. SCSS-модули лежат рядом с компонентами, которые их используют.
- `src/api` содержит общий HTTP-клиент и отдельные папки `campaigns`, `offers` и `editor` для запросов и их DTO. Типы, которые используют экраны, лежат в `src/entities`. TanStack Query управляет серверными запросами и кэшем.
- `src/hooks` содержит состояние формы создания и редактора, а также предупреждение при уходе с несохранёнными изменениями. `useReducer` собирает переходы формы в одном месте. Правила пересчёта долей вынесены в чистые функции.

## Проверки и сборка

```text
npm run check
npm test
npm run build
```

`check` проверяет типы приложения и тестов, затем запускает ESLint и Prettier. `test` проверяет пересчёт долей и правки черновика. `build` проверяет типы и создаёт сборку в `dist`. В [Docker Compose](../README.md#запуск-через-docker-compose) сборку отдаёт Nginx. При прямом переходе на адрес любого из трёх экранов Nginx отдаёт `index.html`, запросы `/api` передаёт FastAPI.
