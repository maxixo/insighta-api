import crypto from 'node:crypto';

function encodeBase64Url(buffer) {
  return buffer.toString('base64url');
}

export function createCodeVerifier(size = 32) {
  return encodeBase64Url(crypto.randomBytes(size));
}

export function createCodeChallenge(codeVerifier) {
  return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
}

export function createOAuthState(size = 32) {
  return encodeBase64Url(crypto.randomBytes(size));
}

export function createPkceSession() {
  const codeVerifier = createCodeVerifier();

  return {
    codeVerifier,
    codeChallenge: createCodeChallenge(codeVerifier),
    state: createOAuthState()
  };
}
