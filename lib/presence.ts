import {
  ref,
  set,
  remove,
  onValue,
  onDisconnect,
  serverTimestamp,
  off,
  DatabaseReference,
} from "firebase/database";
import { rtdb } from "./firebase";
import type { PresenceData, TypingUser } from "./types";

export function setupPresence(uid: string, displayName: string) {
  const presenceRef = ref(rtdb, `presence/${uid}`);
  const connectedRef = ref(rtdb, ".info/connected");

  const unsubscribe = onValue(connectedRef, (snap) => {
    if (!snap.val()) return;

    onDisconnect(presenceRef).set({
      online: false,
      lastSeen: serverTimestamp(),
      displayName,
    });

    set(presenceRef, {
      online: true,
      lastSeen: serverTimestamp(),
      displayName,
    });
  });

  return () => {
    off(connectedRef);
    set(presenceRef, {
      online: false,
      lastSeen: serverTimestamp(),
      displayName,
    });
  };
}

export function subscribeToPresence(
  callback: (presence: Record<string, PresenceData>) => void,
): () => void {
  const presenceRef = ref(rtdb, "presence");
  onValue(presenceRef, (snap) => {
    callback(snap.val() || {});
  });
  return () => off(presenceRef);
}

export function subscribeToUserPresence(
  uid: string,
  callback: (data: PresenceData | null) => void,
): () => void {
  const userRef = ref(rtdb, `presence/${uid}`);
  onValue(userRef, (snap) => {
    callback(snap.val());
  });
  return () => off(userRef);
}

let typingTimeout: NodeJS.Timeout | null = null;
let currentTypingRef: DatabaseReference | null = null;

export function setTyping(roomId: string, uid: string, displayName: string) {
  if (typingTimeout) clearTimeout(typingTimeout);

  const typingRef = ref(rtdb, `typing/${roomId}/${uid}`);
  currentTypingRef = typingRef;

  set(typingRef, {
    isTyping: true,
    displayName,
    timestamp: Date.now(),
  });

  typingTimeout = setTimeout(() => {
    remove(typingRef);
    currentTypingRef = null;
  }, 3000);
}

export function clearTyping(roomId: string, uid: string) {
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }
  const typingRef = ref(rtdb, `typing/${roomId}/${uid}`);
  remove(typingRef);
}

export function subscribeToTyping(
  roomId: string,
  currentUid: string,
  callback: (users: TypingUser[]) => void,
): () => void {
  const typingRef = ref(rtdb, `typing/${roomId}`);
  onValue(typingRef, (snap) => {
    const data = snap.val() || {};
    const typingUsers: TypingUser[] = Object.entries(data)
      .filter(([uid, val]) => {
        const v = val as { isTyping: boolean; timestamp: number };
        return (
          uid !== currentUid && v.isTyping && Date.now() - v.timestamp < 5000
        );
      })
      .map(([uid, val]) => {
        const v = val as { displayName: string; timestamp: number };
        return { uid, displayName: v.displayName, timestamp: v.timestamp };
      });
    callback(typingUsers);
  });
  return () => off(typingRef);
}
