import {
  signInWithCustomToken,
  signOut,
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";
import app from "./firebase";

const firebaseAuth = getAuth(app);

let authPromise: Promise<void> | null = null;

export async function authenticateWithFirebase(): Promise<void> {
  if (authPromise) return authPromise;

  authPromise = (async () => {
    try {
      if (firebaseAuth.currentUser) {
        console.log(
          "[Firebase] Already signed in as",
          firebaseAuth.currentUser.uid,
        );
        return;
      }

      const res = await fetch("/api/firebase-token");
      if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
      const { token } = await res.json();

      await signInWithCustomToken(firebaseAuth, token);

      await new Promise<void>((resolve, reject) => {
        const unsub = onAuthStateChanged(firebaseAuth, (user) => {
          unsub();
          if (user) {
            console.log("[Firebase] Authenticated as", user.uid);
            resolve();
          } else {
            reject(new Error("Auth state is null after signInWithCustomToken"));
          }
        });
      });
    } catch (err) {
      authPromise = null;
      throw err;
    }
  })();

  return authPromise;
}

export async function signOutFromFirebase() {
  authPromise = null;
  await signOut(firebaseAuth);
}

export { firebaseAuth };
