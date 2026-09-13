// Shared admin-SDK credentials for the maintenance scripts.
//
// The scripts that write to Firestore need the admin SDK, not the client one:
// `players`, `qbRankings` and the rest are admin-write-only (see
// firestore.rules), and the client SDK authenticates as nobody, so every write
// comes back PERMISSION_DENIED.
//
// Two ways to supply the credential, so the same script runs on the owner's
// machine and in a cloud session:
//
//   serviceAccountKey.json      in the project root, gitignored -- the local way
//   FIREBASE_SERVICE_ACCOUNT    the same JSON in an environment variable, raw
//                               or base64-encoded -- the cloud way, where there
//                               is no durable filesystem to keep a key on
//
// The file wins if both are present, so a local run never picks up a stale
// variable by accident.
//
// Whichever it reads, this key bypasses firestore.rules entirely: it can read
// and rewrite every collection, not just the one a script touches. Generate a
// separate key for each place one runs, so a single key can be revoked without
// taking the others down with it.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const KEY_PATH = path.join(projectRoot, 'serviceAccountKey.json');

const HOW_TO_GET_ONE = `
No Firebase credentials found. Either:

  1. Save a service-account key as ${KEY_PATH}
     (Firebase console > Project settings > Service accounts >
      Generate new private key). It is gitignored.

  2. Or set FIREBASE_SERVICE_ACCOUNT to the contents of that same JSON file,
     raw or base64-encoded.
`.trim();

/** The parsed service account, from the file or the environment. */
export const loadServiceAccount = () => {
  if (fs.existsSync(KEY_PATH)) {
    return JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  }

  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (fromEnv?.trim()) {
    const raw = fromEnv.trim();
    // Pasting multi-line JSON into a settings field mangles it often enough
    // that base64 is worth accepting too.
    const text = raw.startsWith('{')
      ? raw
      : Buffer.from(raw, 'base64').toString('utf8');

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON (or valid ' +
          'base64 of JSON). Re-copy the whole file, braces included.'
      );
    }
  }

  throw new Error(HOW_TO_GET_ONE);
};

let firestore;

/** The admin Firestore handle, initialised once per process. */
export const getAdminDb = () => {
  if (!firestore) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(loadServiceAccount()),
      });
    }
    firestore = admin.firestore();
  }
  return firestore;
};

/** Which project the credential points at -- worth printing before a write. */
export const projectId = () => loadServiceAccount().project_id;
