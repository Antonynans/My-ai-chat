import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/auth";
import { sql } from "kysely";

interface UserRow {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users from the database directly
    const users = await sql`
      SELECT id, name, email, image FROM user
    `.execute(db);

    const userMap = new Map<
      string,
      { id: string; name: string; email: string; image: string | null }
    >();
    (users.rows as UserRow[]).forEach((user) => {
      const email = user.email;
      const existing = userMap.get(email);
      if (!existing || (!existing.image && user.image)) {
        userMap.set(email, {
          id: user.id,
          name: user.name || user.email,
          email: user.email,
          image: user.image,
        });
      }
    });

    const userList = Array.from(userMap.values());

    return NextResponse.json({ users: userList });
  } catch (err) {
    console.error("Failed to get users:", err);
    return NextResponse.json({ error: "Failed to get users" }, { status: 500 });
  }
}
