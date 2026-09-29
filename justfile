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
