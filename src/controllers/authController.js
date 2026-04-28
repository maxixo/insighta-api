import { githubOAuthService, GITHUB_STATE_COOKIE, GITHUB_VERIFIER_COOKIE } from '../services/githubOAuthService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const redirectToGithub = asyncHandler(async (_req, res) => {
  const authorizationRequest = githubOAuthService.createAuthorizationRequest();

  res.set('Cache-Control', 'no-store');
  res.cookie(GITHUB_STATE_COOKIE, authorizationRequest.state, authorizationRequest.cookieOptions);
  res.cookie(GITHUB_VERIFIER_COOKIE, authorizationRequest.codeVerifier, authorizationRequest.cookieOptions);
  res.redirect(302, authorizationRequest.authorizationUrl);
});
