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
    const inviteId = body?.inviteId;
    if (!inviteId)
      return NextResponse.json({ error: "Missing inviteId" }, { status: 400 });

    const invRef = admin.firestore().collection("invites").doc(inviteId);
    const invSnap = await invRef.get();
    if (!invSnap.exists)
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });

    const inv = invSnap.data() as any;
    const inviteEmail = String(inv.email || "").toLowerCase();
    const userEmail = String(session.user.email || "").toLowerCase();
    if (inviteEmail !== userEmail) {
      return NextResponse.json(
        { error: "Invite email does not match current user" },
        { status: 403 },
      );
    }

    const userId = session.user.id;
    const userName = session.user.name || session.user.email || null;
    const roomId = inv.roomId;

    const roomRef = admin.firestore().collection("rooms").doc(roomId);
    const batch = admin.firestore().batch();
    batch.update(roomRef, {
      members: admin.firestore.FieldValue.arrayUnion(userId),
      [`memberNames.${userId}`]: userName,
    });
    batch.update(invRef, {
      accepted: true,
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      acceptedBy: userId,
    });

    await batch.commit();
    return NextResponse.json({ ok: true, roomId });
  } catch (err) {
    console.error("[API] Accept invite failed", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
