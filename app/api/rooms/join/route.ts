import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebase-admin";
import { auth as betterAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await betterAuth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const roomId = body?.roomId;
    if (!roomId)
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });

    const userId = session.user.id;
    const userName = session.user.name || session.user.email || null;

    const roomRef = admin.firestore().collection("rooms").doc(roomId);
    const roomSnap = await roomRef.get();
    if (!roomSnap.exists) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const batch = admin.firestore().batch();
    batch.update(roomRef, {
      members: admin.firestore.FieldValue.arrayUnion(userId),
      [`memberNames.${userId}`]: userName,
    });

    await batch.commit();
    return NextResponse.json({ ok: true, roomId });
  } catch (err) {
    console.error("[API] Join room failed", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
