import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const sqlite = new Database("./my-api-chat.db");

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
