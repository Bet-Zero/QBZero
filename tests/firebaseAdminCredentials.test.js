import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadServiceAccount } from '../scripts/firebaseAdmin.js';

// The maintenance scripts have to run in two places: the owner's machine, where
// the key is a gitignored file, and a cloud session, which has no durable
// filesystem to keep one on and supplies it as an environment variable instead.
// These cover the variable, since the file path is the one already in use.
//
// Nothing here is a real credential -- the point is how the value is read, not
// whether Firebase accepts it.

const FAKE_KEY = {
  type: 'service_account',
  project_id: 'qbzero-test',
  private_key_id: 'not-a-real-key',
  client_email: 'nobody@qbzero-test.iam.gserviceaccount.com',
};

describe('service account credentials', () => {
  let original;

  beforeEach(() => {
    original = process.env.FIREBASE_SERVICE_ACCOUNT;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.FIREBASE_SERVICE_ACCOUNT;
    else process.env.FIREBASE_SERVICE_ACCOUNT = original;
  });

  it('reads the JSON straight out of the environment', () => {
    process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify(FAKE_KEY);
    expect(loadServiceAccount().project_id).toBe('qbzero-test');
  });

  it('accepts base64, which survives a paste into a settings field', () => {
    process.env.FIREBASE_SERVICE_ACCOUNT = Buffer.from(
      JSON.stringify(FAKE_KEY)
    ).toString('base64');
    expect(loadServiceAccount().client_email).toBe(FAKE_KEY.client_email);
  });

  it('tolerates the stray whitespace a copy-paste leaves behind', () => {
    process.env.FIREBASE_SERVICE_ACCOUNT = `\n  ${JSON.stringify(FAKE_KEY)}  \n`;
    expect(loadServiceAccount().project_id).toBe('qbzero-test');
  });

  it('says the value is the problem when it will not parse', () => {
    process.env.FIREBASE_SERVICE_ACCOUNT = 'paste went wrong';
    expect(() => loadServiceAccount()).toThrow(/not valid JSON/);
  });

  it('explains how to get one when nothing is set at all', () => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT;
    expect(() => loadServiceAccount()).toThrow(/No Firebase credentials found/);
  });
});
