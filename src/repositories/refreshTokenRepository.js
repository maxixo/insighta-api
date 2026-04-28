import { REFRESH_TOKEN_COLLECTION } from '../constants/auth.js';
import { mongoManager } from '../db/mongo.js';
import { DatabaseError } from '../utils/appError.js';

function rethrowDatabaseError(error) {
  if (error instanceof DatabaseError) {
    throw error;
  }

  throw new DatabaseError('Database error', error);
}

class RefreshTokenRepository {
  getCollection() {
    return mongoManager.getCollection(REFRESH_TOKEN_COLLECTION);
  }

  async ensureIndexes() {
    try {
      await this.getCollection().createIndexes([
        { key: { id: 1 }, unique: true },
        { key: { token_hash: 1 }, unique: true },
        { key: { user_id: 1, created_at: -1 } },
        { key: { expires_at: 1 }, expireAfterSeconds: 0 }
      ]);
    } catch (error) {
      rethrowDatabaseError(error);
    }
  }

  async insertRefreshToken(refreshTokenRecord) {
    try {
      await this.getCollection().insertOne(refreshTokenRecord);
      return refreshTokenRecord;
    } catch (error) {
      rethrowDatabaseError(error);
    }
  }

  async findByTokenHash(tokenHash) {
    try {
      return await this.getCollection().findOne({ token_hash: tokenHash });
    } catch (error) {
      rethrowDatabaseError(error);
    }
  }

  async deleteById(id) {
    try {
      return await this.getCollection().deleteOne({ id });
    } catch (error) {
      rethrowDatabaseError(error);
    }
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
