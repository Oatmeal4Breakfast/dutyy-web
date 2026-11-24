set dotenv-load := true

# Install frontend dependencies.
install:
    npm install

# Start backend containers, then run the Vite development server.
dev:
    docker compose -f compose.dev.yml up -d
    npm run dev

# Stop the backend development containers.
down:
    docker compose -f compose.dev.yml down

# Run selected Vitest tests or filters.
test-targeted *args:
    npm test -- {{args}}

# Check formatting without modifying files.
format-check:
    npm run format:check

# Run the linter.
lint:
    npm run lint

# Run the complete test suite.
test:
    npm test

# Type-check and build the production application.
build:
    npm run build

# Create pull request.
pr:
    gh pr create --fill
