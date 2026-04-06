"use server";

import admin from "./firebase-admin";

export async function adminCreateAIMessageDoc(roomId: string): Promise<string> {
  try {
    const ref = await admin
      .firestore()
      .collection("rooms")
      .doc(roomId)
      .collection("messages")
      .add({
        roomId,
        content: "",
        type: "ai",
        senderId: "ai-assistant",
        senderName: "Assistant",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isAIResponse: true,
        isStreaming: true,
        streamFailed: false,
        reactions: {},
      });
    return ref.id;
  } catch (err) {
    console.error("[Admin] Failed to create AI message doc:", err);
    throw err;
  }
}

export async function adminUpdateAIMessage(
  roomId: string,
  messageId: string,
  content: string,
  isStreaming: boolean,
  streamFailed = false,
) {
  try {
    await admin
      .firestore()
      .collection("rooms")
      .doc(roomId)
      .collection("messages")
      .doc(messageId)
      .update({
        content,
        isStreaming,
        streamFailed,
      });
  } catch (err) {
    console.error("[Admin] Failed to update AI message:", err);
    throw err;
  }
}

export async function adminUpdateRoomLastMessage(
  roomId: string,
  content: string,
) {
  try {
    await admin
      .firestore()
      .collection("rooms")
      .doc(roomId)
      .update({
        lastMessage: content.slice(0, 100),
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  } catch (err) {
    console.error("[Admin] Failed to update room last message:", err);
    throw err;
  }
}

export async function adminSetAIResponding(roomId: string, value: boolean) {
  try {
    await admin
      .firestore()
      .collection("rooms")
      .doc(roomId)
      .update({ aiResponding: value });
  } catch (err) {
    console.error("[Admin] Failed to update AI responding status:", err);
    throw err;
  }
}
