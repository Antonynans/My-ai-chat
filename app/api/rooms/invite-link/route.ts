import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebase-admin";
import { auth as betterAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await betterAuth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await req.json();
    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    }

    const roomRef = admin.firestore().collection("rooms").doc(roomId);
    const roomSnap = await roomRef.get();
    if (!roomSnap.exists) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const roomData = roomSnap.data()!;
    if (!roomData.members.includes(session.user.id)) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    // Generate a secure random token
    const token = Buffer.from(
      `${roomId}:${Date.now()}:${Math.random().toString(36).slice(2)}`,
    ).toString("base64url");

    // Store invite token in Firestore with 7-day expiry
    await admin
      .firestore()
      .collection("inviteLinks")
      .doc(token)
      .set({
        roomId,
        roomName: roomData.name,
        createdBy: session.user.id,
        createdByName: session.user.name || session.user.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        uses: 0,
        maxUses: 50,
      });

    return NextResponse.json({ token });
  } catch (err) {
    console.error("[invite-link]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
