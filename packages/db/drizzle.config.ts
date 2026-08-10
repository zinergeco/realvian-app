import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // PostGIS types are declared via customType and managed manually
  verbose: true,
  strict: true,
} satisfies Config;
