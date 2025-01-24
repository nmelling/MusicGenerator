import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './src/database/migration',
    schema: './src/database/schema/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
      url: process.env['DATABASE_URL']!,
    },
  });