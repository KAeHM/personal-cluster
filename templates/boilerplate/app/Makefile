# Wrapper fino sobre os npm scripts: fonte unica de comandos com paridade dev/CI.
# A logica real vive no package.json; os targets so chamam `npm run`.

.PHONY: help install dev build start lint lint-fix format format-check typecheck \
        test test-watch test-coverage test-integration test-e2e check ci \
        db-generate db-migrate db-seed db-studio errors-doc \
        docker-build docker-up docker-down docker-logs clean

help: ## Lista os targets disponiveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "} {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

install: ## Instala dependencias (npm ci)
	npm ci

dev: ## Servidor de desenvolvimento
	npm run dev

build: ## Build de producao
	npm run build

start: ## Sobe o build de producao
	npm run start

lint: ## Lint (ESLint)
	npm run lint

lint-fix: ## Lint com --fix
	npm run lint -- --fix

format: ## Formata o codigo (Prettier)
	npm run format

format-check: ## Checa formatacao sem alterar
	npm run format:check

typecheck: ## Checagem de tipos (tsc --noEmit)
	npm run typecheck

test: ## Testes unitarios (Vitest, single run)
	npm run test

test-watch: ## Testes em modo watch
	npm run test:watch

test-coverage: ## Testes com cobertura
	npm run test:coverage

test-integration: ## Testes de integracao (Testcontainers; precisa de Docker)
	npm run test:integration

test-e2e: ## Testes E2E (Playwright; precisa de build + banco)
	npm run test:e2e

check: format-check lint typecheck test-coverage build ## Portao de qualidade (rodado no CI: aplica o threshold de cobertura)

ci: install check ## Instala do zero e checa (conveniencia local)

db-generate: ## Gera migration a partir do schema
	npm run db:generate

db-migrate: ## Aplica migrations
	npm run db:migrate

db-seed: ## Popula dados de exemplo
	npm run db:seed

db-studio: ## Abre o Drizzle Studio
	npm run db:studio

errors-doc: ## Regenera docs/errors.md
	npm run errors:doc

docker-build: ## Build das imagens (compose)
	docker compose build

docker-up: ## Sobe db + migrate + app (compose)
	docker compose up -d

docker-down: ## Derruba os servicos (compose)
	docker compose down

docker-logs: ## Logs do app
	docker compose logs -f app

clean: ## Remove artefatos de build e deps
	rm -rf .next node_modules
