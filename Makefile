.PHONY: up down build migrate seed test lint

up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose build

# Run database migrations
migrate:
	docker-compose exec backend alembic upgrade head

# Seed the universe (S&P 500 tickers + GICS)
seed:
	docker-compose exec backend python -m app.data.seed_universe

# Run all tests
test:
	cd backend && python -m pytest app/tests/ -v

# Run backend locally without Docker
dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

# Run frontend locally without Docker
dev-frontend:
	cd frontend && npm run dev

# Install backend deps locally
install-backend:
	cd backend && pip install -r requirements.txt

# Install frontend deps locally
install-frontend:
	cd frontend && npm install

# Full local setup (no Docker)
setup-local:
	cp .env.example .env
	$(MAKE) install-backend
	$(MAKE) install-frontend
	cd backend && alembic upgrade head
	cd backend && python -m app.data.seed_universe

# Celery worker locally
worker:
	cd backend && celery -A app.tasks.celery_app worker --loglevel=info

# Trigger nightly price refresh manually
refresh-prices:
	docker-compose exec backend python -m app.tasks.price_refresh

lint:
	cd backend && ruff check app/ && mypy app/ --ignore-missing-imports
