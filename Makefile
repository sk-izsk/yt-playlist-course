# Tubewise — common tasks. Run `make` (or `make help`) to list them.
# Package manager is bun; Next and the agent CLI run on Node (better-sqlite3 is a Node addon).

.DEFAULT_GOAL := help
.PHONY: help install dev build start stop lint typecheck selfcheck check clean \
        list pending show add sync fill report transcripts db-path db-backup db-shell

DB ?= $(HOME)/.courseit/app.db
PORT ?= 3000

help: ## Show this list
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z_-]+:.*## / {printf "  \033[32m%-12s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ---------------------------------------------------------------- app
install: ## Install dependencies
	bun install

dev: ## Start the dev server on http://localhost:3000 (override: PORT=4000)
	bun run dev --port $(PORT)

build: ## Production build (also catches broken imports)
	bun run build

start: build ## Build, then serve the production build
	bun run start --port $(PORT)

stop: ## Stop whatever is listening on the dev port
	@lsof -ti tcp:$(PORT) | xargs kill 2>/dev/null && echo "stopped :$(PORT)" || echo "nothing on :$(PORT)"

# ---------------------------------------------------------------- quality
lint: ## ESLint
	bunx eslint src scripts

typecheck: ## TypeScript, no emit
	bunx next typegen >/dev/null 2>&1; bunx tsc --noEmit

selfcheck: ## Run the small *.check.ts self-tests
	@for f in $$(find src -name '*.check.ts'); do bunx tsx $$f || exit 1; done

check: typecheck lint selfcheck ## Everything an agent should run before saying "done"

clean: ## Remove build caches (keeps your data)
	rm -rf .next tsconfig.tsbuildinfo

# ---------------------------------------------------------------- agent CLI
# Ids are full UUIDs (the app's copy buttons copy them). Examples:
#   make pending ID=a3450f88-54e6-4a03-adce-cbda5fb844e2
#   make add URL="https://www.youtube.com/playlist?list=..."
list: ## All courses with ids and progress
	bun run --silent agent list

pending: ## Lessons still needing notes (ID=course-id optional)
	bun run --silent agent pending $(ID)

show: ## Full context for a course or lesson (ID=…)
	@test -n "$(ID)" || (echo "usage: make show ID=<course-or-lesson-id>" && exit 1)
	bun run --silent agent show $(ID)

add: ## Import a video/playlist (URL="…")
	@test -n "$(URL)" || (echo 'usage: make add URL="https://youtube.com/..."' && exit 1)
	bun run --silent agent add "$(URL)"

sync: ## Add new videos from a playlist (ID=course-id)
	@test -n "$(ID)" || (echo "usage: make sync ID=<course-id>" && exit 1)
	bun run --silent agent sync $(ID)

fill: ## Fill all pending lessons, one fresh agent session each (ID=course-id AGENT=codex|claude|echo MAX=n)
	@test -n "$(ID)" || (echo "usage: make fill ID=<course-id> [AGENT=codex] [MAX=5]"; exit 1)
	scripts/fill-course.sh $(ID) $(or $(AGENT),codex) $(or $(MAX),1000)

report: ## Per-lesson notes table for a course (ID=course-id)
	bun run --silent agent report $(ID)

transcripts: ## Retry missing/failed transcripts (ID=course-id)
	@test -n "$(ID)" || (echo "usage: make transcripts ID=<course-id>" && exit 1)
	bun run --silent agent transcripts $(ID)

# ---------------------------------------------------------------- data
db-path: ## Where the SQLite database lives
	@echo $(DB)

db-backup: ## Copy the database to ~/.courseit/backups/ (safe while the app runs)
	@mkdir -p $(dir $(DB))backups
	sqlite3 $(DB) ".backup '$(dir $(DB))backups/app-$$(date +%Y%m%d-%H%M%S).db'"
	@ls -t $(dir $(DB))backups | head -1

db-shell: ## Open the database in sqlite3 (read it; write through the CLI)
	sqlite3 $(DB)
