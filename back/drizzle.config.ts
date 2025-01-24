import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './src/database/migration',
    schema: './src/database/schema',
    dialect: 'postgresql',
    dbCredentials: {
      url: process.env['DATABASE_URL']!,
    },
  });