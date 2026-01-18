import "dotenv/config";
import { defineConfig, env } from "prisma/config"; // Import 'env' helper

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    // Replace process.env with the Prisma env() helper
    url: env("DATABASE_URL"), 
  },
});
