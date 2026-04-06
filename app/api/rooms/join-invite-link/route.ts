import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebase-admin";
import { auth as betterAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await betterAuth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const db = admin.firestore();
    const inviteRef = db.collection("inviteLinks").doc(token);
    const inviteSnap = await inviteRef.get();

    if (!inviteSnap.exists) {
      return NextResponse.json(
        { error: "Invalid invite link" },
        { status: 404 },
      );
    }

    const invite = inviteSnap.data()!;

    // Check expiry
    if (invite.expiresAt.toDate() < new Date()) {
      return NextResponse.json(
        { error: "Invite link has expired" },
        { status: 410 },
      );
    }

    // Check max uses
    if (invite.uses >= invite.maxUses) {
      return NextResponse.json(
        { error: "Invite link has reached max uses" },
        { status: 410 },
      );
    }

    const { roomId } = invite;
    const userId = session.user.id;
    const userName = session.user.name || session.user.email || "Unknown";

    const roomRef = db.collection("rooms").doc(roomId);
    const roomSnap = await roomRef.get();

    if (!roomSnap.exists) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const roomData = roomSnap.data()!;

    // Already a member — just redirect
    if (roomData.members.includes(userId)) {
      return NextResponse.json({ ok: true, roomId, alreadyMember: true });
    }

    // Add to room and increment invite uses atomically
    const batch = db.batch();
    batch.update(roomRef, {
      members: admin.firestore.FieldValue.arrayUnion(userId),
      [`memberNames.${userId}`]: userName,
    });
    batch.update(inviteRef, {
      uses: admin.firestore.FieldValue.increment(1),
    });
    await batch.commit();

    return NextResponse.json({ ok: true, roomId, roomName: roomData.name });
  } catch (err) {
    console.error("[join-room]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
