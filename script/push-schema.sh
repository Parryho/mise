#\!/bin/bash
source /opt/mise/.env
docker run --rm   --network mise_default   -e DATABASE_URL="postgresql://${PGUSER}:${PGPASSWORD}@db:5432/${PGDATABASE}"   -v /opt/mise:/app   -w /app   node:22-alpine   sh -c "npm install drizzle-kit drizzle-orm pg dotenv drizzle-zod zod tsx typescript 2>/dev/null && npx drizzle-kit push"
