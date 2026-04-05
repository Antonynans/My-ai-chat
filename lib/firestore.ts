import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  getDoc,
  getDocs,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  deleteField,
  Timestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Room, Message } from "./types";

function toDate(val: unknown): Date {
  if (!val) return new Date();
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val as number);
}

function roomFromDoc(doc: QueryDocumentSnapshot | DocumentSnapshot): Room {
  const d = doc.data()!;
  return {
    id: doc.id,
    name: d.name,
    description: d.description,
    createdBy: d.createdBy,
    members: d.members || [],
    memberNames: d.memberNames || {},
    isPrivate: d.isPrivate ?? false,
    createdAt: toDate(d.createdAt),
    lastMessage: d.lastMessage,
    lastMessageAt: d.lastMessageAt ? toDate(d.lastMessageAt) : undefined,
    aiResponding: d.aiResponding ?? false,
  };
}

function messageFromDoc(
  doc: QueryDocumentSnapshot | DocumentSnapshot,
): Message {
  const d = doc.data()!;
  return {
    id: doc.id,
    roomId: d.roomId,
    content: d.content,
    type: d.type || "human",
    senderId: d.senderId,
    senderName: d.senderName,
    senderAvatar: d.senderAvatar,
    createdAt: toDate(d.createdAt),
    isAIResponse: d.isAIResponse ?? false,
    isStreaming: d.isStreaming ?? false,
    streamFailed: d.streamFailed ?? false,
    audioUrl: d.audioUrl,
    voiceTranscript: d.voiceTranscript,
    reactions: d.reactions || {},
  };
}

export async function createRoom(
  name: string,
  description: string,
  creatorId: string,
  creatorName: string,
  isPrivate = false,
): Promise<string> {
  const ref = await addDoc(collection(db, "rooms"), {
    name,
    description,
    createdBy: creatorId,
    members: [creatorId],
    memberNames: { [creatorId]: creatorName },
    isPrivate,
    createdAt: serverTimestamp(),
    aiResponding: false,
  });
  return ref.id;
}

export interface Invite {
  id: string;
  roomId: string;
  roomName?: string;
  email: string;
  inviterId: string;
  inviterName: string;
  createdAt?: Date;
  accepted?: boolean;
  acceptedAt?: Date;
  acceptedBy?: string;
}

export async function sendInvite(
  roomId: string,
  roomName: string | undefined,
  email: string,
  inviterId: string,
  inviterName: string,
) {
  // prevent duplicate pending invites
  const q = query(
    collection(db, "invites"),
    where("roomId", "==", roomId),
    where("email", "==", email),
    where("accepted", "==", false),
  );
  const snap = await getDocs(q);
  if (!snap.empty)
    throw new Error("An invite has already been sent to this email");

  const ref = await addDoc(collection(db, "invites"), {
    roomId,
    roomName: roomName || null,
    email,
    inviterId,
    inviterName,
    createdAt: serverTimestamp(),
    accepted: false,
  });
  return ref.id;
}

export async function getPendingInvitesByEmail(email: string) {
  const q = query(
    collection(db, "invites"),
    where("email", "==", email),
    where("accepted", "==", false),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Invite[];
}

export async function markInviteAccepted(inviteId: string, userId: string) {
  await updateDoc(doc(db, "invites", inviteId), {
    accepted: true,
    acceptedAt: serverTimestamp(),
    acceptedBy: userId,
  });
}

export function subscribeToInvitesByEmail(
  email: string,
  callback: (invites: Invite[]) => void,
): () => void {
  const q = query(
    collection(db, "invites"),
    where("email", "==", email.toLowerCase()),
    where("accepted", "==", false),
  );
  return onSnapshot(q, (snap) => {
    const invites = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    })) as Invite[];
    callback(invites);
  });
}

export function subscribeToRooms(
  userId: string,
  callback: (rooms: Room[]) => void,
): () => void {
  const q = query(
    collection(db, "rooms"),
    where("members", "array-contains", userId),
  );
  return onSnapshot(q, (snap) => {
    const rooms = snap.docs.map(roomFromDoc);
    // Sort in memory instead of at query level
    rooms.sort(
      (a, b) =>
        (b.lastMessageAt?.getTime() || 0) - (a.lastMessageAt?.getTime() || 0),
    );
    callback(rooms);
  });
}

export function subscribeToPublicRooms(
  callback: (rooms: Room[]) => void,
): () => void {
  const q = query(collection(db, "rooms"), where("isPrivate", "==", false));
  return onSnapshot(q, (snap) => {
    const rooms = snap.docs.map(roomFromDoc);
    // Sort in memory instead of at query level
    rooms.sort(
      (a, b) =>
        (b.lastMessageAt?.getTime() || 0) - (a.lastMessageAt?.getTime() || 0),
    );
    callback(rooms);
  });
}

export async function joinRoom(
  roomId: string,
  userId: string,
  displayName: string,
) {
  const ref = doc(db, "rooms", roomId);
  await updateDoc(ref, {
    members: arrayUnion(userId),
    [`memberNames.${userId}`]: displayName,
  });
}

export async function leaveRoom(roomId: string, userId: string) {
  const ref = doc(db, "rooms", roomId);
  await updateDoc(ref, {
    members: arrayRemove(userId),
    [`memberNames.${userId}`]: deleteField(),
  });
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const snap = await getDoc(doc(db, "rooms", roomId));
  return snap.exists() ? roomFromDoc(snap) : null;
}

export function subscribeToRoom(
  roomId: string,
  callback: (room: Room | null) => void,
): () => void {
  return onSnapshot(doc(db, "rooms", roomId), (snap) => {
    callback(snap.exists() ? roomFromDoc(snap) : null);
  });
}

export async function searchPublicRooms(query_str: string): Promise<Room[]> {
  const snap = await getDocs(
    query(collection(db, "rooms"), where("isPrivate", "==", false)),
  );
  const rooms = snap.docs.map(roomFromDoc);
  if (!query_str) return rooms;
  const q = query_str.toLowerCase();
  return rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q),
  );
}

export async function setAIResponding(roomId: string, value: boolean) {
  await updateDoc(doc(db, "rooms", roomId), { aiResponding: value });
}

export const MESSAGES_PAGE_SIZE = 50;

export function subscribeToMessages(
  roomId: string,
  callback: (messages: Message[]) => void,
): () => void {
  const q = query(
    collection(db, "rooms", roomId, "messages"),
    orderBy("createdAt", "asc"),
    limit(MESSAGES_PAGE_SIZE),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(messageFromDoc));
  });
}

export async function sendMessage(
  roomId: string,
  content: string,
  senderId: string,
  senderName: string,
  senderAvatar?: string,
  type: "human" | "voice" = "human",
  audioUrl?: string,
): Promise<string> {
  const batch = writeBatch(db);

  const msgRef = doc(collection(db, "rooms", roomId, "messages"));
  batch.set(msgRef, {
    roomId,
    content,
    type,
    senderId,
    senderName,
    senderAvatar: senderAvatar || null,
    createdAt: serverTimestamp(),
    isAIResponse: false,
    isStreaming: false,
    streamFailed: false,
    audioUrl: audioUrl || null,
    reactions: {},
  });

  const roomRef = doc(db, "rooms", roomId);
  batch.update(roomRef, {
    lastMessage: content.slice(0, 100),
    lastMessageAt: serverTimestamp(),
  });

  await batch.commit();
  return msgRef.id;
}

export async function createAIMessageDoc(roomId: string): Promise<string> {
  const ref = await addDoc(collection(db, "rooms", roomId, "messages"), {
    roomId,
    content: "",
    type: "ai",
    senderId: "ai-assistant",
    senderName: "Assistant",
    createdAt: serverTimestamp(),
    isAIResponse: true,
    isStreaming: true,
    streamFailed: false,
    reactions: {},
  });
  return ref.id;
}

export async function updateAIMessage(
  roomId: string,
  messageId: string,
  content: string,
  isStreaming: boolean,
  streamFailed = false,
) {
  await updateDoc(doc(db, "rooms", roomId, "messages", messageId), {
    content,
    isStreaming,
    streamFailed,
  });
}

export async function updateRoomLastMessage(roomId: string, content: string) {
  await updateDoc(doc(db, "rooms", roomId), {
    lastMessage: content.slice(0, 100),
    lastMessageAt: serverTimestamp(),
  });
}

export async function loadMoreMessages(
  roomId: string,
  beforeDate: Date,
): Promise<Message[]> {
  const snap = await getDocs(
    query(
      collection(db, "rooms", roomId, "messages"),
      orderBy("createdAt", "desc"),
      startAfter(Timestamp.fromDate(beforeDate)),
      limit(MESSAGES_PAGE_SIZE),
    ),
  );
  return snap.docs.map(messageFromDoc).reverse();
}

export async function searchMessages(
  roomId: string,
  searchQuery: string,
): Promise<Message[]> {
  const snap = await getDocs(
    query(
      collection(db, "rooms", roomId, "messages"),
      orderBy("createdAt", "desc"),
      limit(200),
    ),
  );
  const messages = snap.docs.map(messageFromDoc);
  const q = searchQuery.toLowerCase();
  return messages.filter((m) => m.content.toLowerCase().includes(q));
}
