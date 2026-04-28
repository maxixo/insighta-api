import { uuidv7 } from 'uuidv7';

import { USER_ROLES } from '../constants/auth.js';
import { env } from '../config/env.js';
import { refreshTokenRepository } from '../repositories/refreshTokenRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { AppError } from '../utils/appError.js';
import { toUtcIsoSeconds } from '../utils/date.js';
import { hashToken, issueAccessToken, issueRefreshToken, verifyToken } from '../utils/tokens.js';
import { githubOAuthService } from './githubOAuthService.js';

class AuthService {
  getRefreshTokenSecret() {
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET?.trim();
    return refreshTokenSecret || env.REFRESH_TOKEN_SECRET;
  }

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

  decodeRefreshToken(refreshToken) {
    try {
      const payload = verifyToken(refreshToken, this.getRefreshTokenSecret());

      if (payload.type !== 'refresh' || typeof payload.jti !== 'string' || typeof payload.sub !== 'string') {
        throw new AppError(401, 'Invalid or expired refresh token');
      }

      return payload;
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 401) {
        throw new AppError(401, 'Invalid or expired refresh token');
      }

      throw error;
    }
  }

  async refreshSession(refreshToken) {
    const payload = this.decodeRefreshToken(refreshToken);
    const storedRefreshToken = await refreshTokenRepository.findByTokenHash(hashToken(refreshToken));

    if (!storedRefreshToken || storedRefreshToken.id !== payload.jti) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    const user = await userRepository.findById(payload.sub);

    if (!user) {
      await refreshTokenRepository.deleteById(storedRefreshToken.id);
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    await refreshTokenRepository.deleteById(storedRefreshToken.id);

    return this.issueSessionTokens(user);
  }

  async logout(refreshToken) {
    const payload = this.decodeRefreshToken(refreshToken);
    const storedRefreshToken = await refreshTokenRepository.findByTokenHash(hashToken(refreshToken));

    if (!storedRefreshToken || storedRefreshToken.id !== payload.jti) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    await refreshTokenRepository.deleteById(storedRefreshToken.id);
  }
}

export const authService = new AuthService();
