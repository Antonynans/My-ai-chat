import admin from "firebase-admin";

if (!admin.apps.length) {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKeyStr = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyStr) {
    throw new Error("Missing Firebase Admin credentials. Check env vars.");
  }

  let privateKey = privateKeyStr;
  if (privateKeyStr.includes("\\n")) {
    privateKey = privateKeyStr.replace(/\\n/g, "\n");
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
    console.log("[Firebase Admin] Initialized successfully");
  } catch (err) {
    console.error("[Firebase Admin] Init failed:", err);
    throw err;
  }
}

export default admin;
