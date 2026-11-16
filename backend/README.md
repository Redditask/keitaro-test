# Backend

FastAPI читает и обновляет кампании через Keitaro Admin API. PostgreSQL хранит известные привязки офферов и параметры закрепления долей.

## Локальный запуск

Для запуска всего приложения используйте [Docker Compose](../README.md#запуск-через-docker-compose). Для отдельного запуска API нужны Python 3.12 или новее, PostgreSQL и доступ к Keitaro. В PowerShell из корня проекта выполните команды.

```powershell
Set-Location backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
```

В Linux и macOS используйте `cd` и `.venv/bin/python`. Создайте базу `relay` и задайте переменные окружения процесса. В PowerShell используйте `$env:ИМЯ = 'значение'`, в Linux и macOS — `export ИМЯ='значение'`.

| Переменная | Формат |
| --- | --- |
| `DATABASE_URL` | `postgresql+psycopg://USER:PASSWORD@127.0.0.1:5432/relay` |
| `KEITARO_BASE_URL` | Адрес Admin API с путём `/admin_api/v1/` |
| `KEITARO_API_KEY` | Ключ Keitaro Admin API |

Из каталога `backend` примените миграции и запустите API.

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Схемы запросов и ответов доступны в [Swagger UI](http://127.0.0.1:8000/docs). API возвращает сообщения об ошибках на английском.

## API

| Метод и путь | Назначение |
| --- | --- |
| `GET /api/campaigns?page=1` | Список кампаний напрямую из Keitaro |
| `GET /api/campaign-options` | Справочники для создания кампании |
| `GET /api/offers?search_term=…` | Поиск офферов |
| `POST /api/campaigns` | Создание кампании с двумя потоками |
| `POST /api/campaigns/{campaign_id}/sync` | Чтение кампании и обновление истории привязок |
| `PUT /api/campaigns/{campaign_id}/streams/{stream_id}/offers` | Публикация полного набора привязок потока |

В `app/campaigns` находятся запросы списка, справочников и создание кампании. `app/editor` отвечает за синхронизацию, публикацию и историю привязок. `app/keitaro` содержит HTTP-клиент и схемы ответов Keitaro. Служебный маршрут `GET /health` проверяет доступность процесса API.

## Хранение и миграции

Таблица `known_stream_offers` хранит последнее известное название оффера и признак закрепления. Составной первичный ключ `(stream_id, offer_id)` позволяет хранить отдельную настройку для каждого потока. Синхронизация читает актуальные доли из Keitaro, а публикация сохраняет закрепления после подтверждения состава и долей в Keitaro.

`alembic upgrade head` создаёт таблицу на чистой базе. `alembic downgrade base` удаляет её вместе с историей привязок и закреплениями. После повторного применения миграции синхронизация добавит привязки, которые сейчас есть в Keitaro.

## Проверки

```powershell
.\.venv\Scripts\python.exe -m pytest -rs
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe -m ruff format --check .
```

Для проверок с PostgreSQL задайте `TEST_DATABASE_URL` в терминале перед запуском pytest. Используйте отдельную тестовую базу с правом создавать схемы.
