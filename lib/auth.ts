import path from "path";
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const databasePath =
  (process.env.SQLITE_DB_PATH ?? (process.env.VERCEL || process.env.NETLIFY))
    ? path.join("/tmp", "my-api-chat.db")
    : path.join(process.cwd(), "my-api-chat.db");

const sqlite = new Database(databasePath);

const db = new Kysely({
  dialect: new SqliteDialect({
    database: sqlite,
  }),
});

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  database: {
    db: db,
    type: "sqlite",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
});

export type Auth = typeof auth;
