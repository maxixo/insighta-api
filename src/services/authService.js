import { uuidv7 } from 'uuidv7';

import { USER_ROLES } from '../constants/auth.js';
import { refreshTokenRepository } from '../repositories/refreshTokenRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { toUtcIsoSeconds } from '../utils/date.js';
import { hashToken, issueAccessToken, issueRefreshToken } from '../utils/tokens.js';
import { githubOAuthService } from './githubOAuthService.js';

class AuthService {
  async handleGithubCallback({ query, cookieHeader }) {
    const { code, codeVerifier } = githubOAuthService.validateCallbackRequest({ query, cookieHeader });
    const githubAccessToken = await githubOAuthService.exchangeCodeForAccessToken({
      code,
      codeVerifier
    });
    const githubUser = await githubOAuthService.fetchGithubUser(githubAccessToken);
    const user = await this.persistGithubUser(githubUser);
    const tokenBundle = await this.issueSessionTokens(user);

    return {
      user,
      accessToken: tokenBundle.accessToken,
      refreshToken: tokenBundle.refreshToken
    };
  }

  async persistGithubUser(githubUser) {
    const timestamp = toUtcIsoSeconds();
    const existingUser = await userRepository.findByGithubId(githubUser.githubId);

    if (!existingUser) {
      return userRepository.insertUser({
        id: uuidv7(),
        github_id: githubUser.githubId,
        username: githubUser.username,
        email: githubUser.email,
        avatar_url: githubUser.avatarUrl,
        role: USER_ROLES.analyst,
        is_active: true,
        last_login_at: timestamp,
        created_at: timestamp
      });
    }

    return userRepository.updateUserByGithubId(githubUser.githubId, {
      username: githubUser.username,
      email: githubUser.email,
      avatar_url: githubUser.avatarUrl,
      last_login_at: timestamp
    });
  }

  async issueSessionTokens(user) {
    const refreshTokenId = uuidv7();
    const refreshTokenRecord = issueRefreshToken({
      user,
      refreshTokenId
    });
    const accessToken = issueAccessToken(user);
    const refreshToken = refreshTokenRecord.token;

    await refreshTokenRepository.insertRefreshToken({
      id: refreshTokenId,
      user_id: user.id,
      token_hash: hashToken(refreshToken),
      created_at: toUtcIsoSeconds(),
      expires_at: new Date(Date.now() + refreshTokenRecord.expiresInSeconds * 1000)
    });

    return {
      accessToken,
      refreshToken
    };
  }
}

export const authService = new AuthService();
