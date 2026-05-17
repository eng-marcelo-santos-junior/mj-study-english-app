import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // DIRECT_URL bypasses PgBouncer — required for migrations
    // Falls back to DATABASE_URL in local dev (where both point to the same DB)
    url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'],
  },
})
