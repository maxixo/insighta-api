import { USER_COLLECTION } from '../constants/auth.js';
import { mongoManager } from '../db/mongo.js';
import { DatabaseError } from '../utils/appError.js';

function rethrowDatabaseError(error) {
  if (error instanceof DatabaseError) {
    throw error;
  }

  throw new DatabaseError('Database error', error);
}

class UserRepository {
  getCollection() {
    return mongoManager.getCollection(USER_COLLECTION);
  }

  async ensureIndexes() {
    try {
      await this.getCollection().createIndexes([
        { key: { id: 1 }, unique: true },
        { key: { github_id: 1 }, unique: true },
        { key: { created_at: -1 } },
        { key: { last_login_at: -1 } }
      ]);
    } catch (error) {
      rethrowDatabaseError(error);
    }
  }

  async findByGithubId(githubId) {
    try {
      return await this.getCollection().findOne({ github_id: githubId });
    } catch (error) {
      rethrowDatabaseError(error);
    }
  }

  async insertUser(user) {
    try {
      await this.getCollection().insertOne(user);
      return user;
    } catch (error) {
      rethrowDatabaseError(error);
    }
  }

  async updateUserByGithubId(githubId, updates) {
    try {
      await this.getCollection().updateOne(
        { github_id: githubId },
        {
          $set: updates
        }
      );

      return this.findByGithubId(githubId);
    } catch (error) {
      rethrowDatabaseError(error);
    }
  }
}

export const userRepository = new UserRepository();
