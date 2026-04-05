import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebase-admin";
import { auth as betterAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await betterAuth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const snap = await admin
      .firestore()
      .collection("rooms")
      .where("members", "array-contains", userId)
      .get();
    const rooms = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        name: data.name,
        description: data.description || null,
        isPrivate: data.isPrivate ?? false,
        members: data.members || [],
        memberNames: data.memberNames || {},
        createdBy: data.createdBy || null,
        lastMessage: data.lastMessage || null,
        lastMessageAt: data.lastMessageAt
          ? data.lastMessageAt.toDate().toISOString()
          : null,
      };
    });
    return NextResponse.json({ ok: true, rooms });
  } catch (err) {
    console.error("[API] Fetch my rooms failed", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
