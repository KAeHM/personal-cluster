# Wrapper fino sobre os npm scripts: fonte unica de comandos com paridade dev/CI.

.PHONY: help install dev build start lint lint-fix format format-check typecheck \
        test test-watch test-coverage test-e2e check ci \
        db-generate db-migrate db-seed db-seed-rosane-cluster db-studio clean

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

test-e2e: ## Testes E2E (Playwright; precisa de build + banco)
	npm run test:e2e

check: format-check lint typecheck test build ## Portao de qualidade (CI)

ci: install check ## Instala do zero e checa (conveniencia local)

db-generate: ## Gera migration a partir do schema
	npm run db:generate

db-migrate: ## Aplica migrations
	npm run db:migrate

db-seed: ## Popula dados de exemplo
	npm run db:seed

db-seed-rosane-cluster: ## Seed Rosane no Postgres do cluster (kubectl port-forward)
	npm run db:seed-rosane:cluster

db-studio: ## Abre o Drizzle Studio
	npm run db:studio

clean: ## Remove artefatos de build e deps
	rm -rf .next node_modules
