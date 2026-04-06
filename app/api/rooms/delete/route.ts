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
    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    }

    const roomRef = admin.firestore().collection("rooms").doc(roomId);
    const roomSnap = await roomRef.get();
    if (!roomSnap.exists) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const roomData = roomSnap.data();
    if (roomData?.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messagesCollection = roomRef.collection("messages");
    while (true) {
      const messagesSnap = await messagesCollection.limit(500).get();
      if (messagesSnap.empty) break;

      const batch = admin.firestore().batch();
      messagesSnap.docs.forEach((messageDoc) => batch.delete(messageDoc.ref));
      await batch.commit();

      if (messagesSnap.size < 500) break;
    }

    await roomRef.delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] Delete room failed", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
