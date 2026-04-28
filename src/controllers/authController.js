import { authService } from '../services/authService.js';
import { githubOAuthService, GITHUB_STATE_COOKIE, GITHUB_VERIFIER_COOKIE } from '../services/githubOAuthService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const redirectToGithub = asyncHandler(async (_req, res) => {
  const authorizationRequest = githubOAuthService.createAuthorizationRequest();

  res.set('Cache-Control', 'no-store');
  res.cookie(GITHUB_STATE_COOKIE, authorizationRequest.state, authorizationRequest.cookieOptions);
  res.cookie(GITHUB_VERIFIER_COOKIE, authorizationRequest.codeVerifier, authorizationRequest.cookieOptions);
  res.redirect(302, authorizationRequest.authorizationUrl);
});

export const handleGithubCallback = asyncHandler(async (req, res) => {
  const session = await authService.handleGithubCallback({
    query: req.query,
    cookieHeader: req.headers.cookie
  });
  const { maxAge: _maxAge, ...cookieOptions } = githubOAuthService.getPkceCookieOptions();

  res.set('Cache-Control', 'no-store');
  res.clearCookie(GITHUB_STATE_COOKIE, cookieOptions);
  res.clearCookie(GITHUB_VERIFIER_COOKIE, cookieOptions);
  res.status(200).json({
    status: 'success',
    access_token: session.accessToken,
    refresh_token: session.refreshToken
  });
});
