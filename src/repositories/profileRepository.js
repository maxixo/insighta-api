import { PROFILE_COLLECTION } from '../constants/profile.js';
import { mongoManager } from '../db/mongo.js';
import { DatabaseError } from '../utils/appError.js';

function rethrowDatabaseError(error) {
  if (error instanceof DatabaseError) {
    throw error;
  }

  throw new DatabaseError('Database error', error);
}

class ProfileRepository {
  getCollection() {
    return mongoManager.getCollection(PROFILE_COLLECTION);
  }

  async ensureIndexes() {
    try {
      const collection = this.getCollection();

      await collection.createIndexes([
        { key: { name: 1 }, unique: true },
        { key: { id: 1 }, unique: true },
        { key: { gender: 1, country_id: 1, age: 1 } },
        { key: { age_group: 1, age: 1 } },
        { key: { created_at: -1 } },
        { key: { gender_probability: -1 } },
        { key: { country_probability: -1 } }
      ]);
    } catch (error) {
      rethrowDatabaseError(error);
    }
  }

  async findByName(name) {
    try {
      return await this.getCollection().findOne({ name });
    } catch (error) {
      rethrowDatabaseError(error);
    }
  }

  async findById(id) {
    try {
      return await this.getCollection().findOne({ id });
    } catch (error) {
      rethrowDatabaseError(error);
    }
  }

  async insertProfile(profile) {
    try {
      await this.getCollection().insertOne(profile);
      return profile;
    } catch (error) {
      throw error;
    }
  }

  async countProfiles(filter) {
    try {
      return await this.getCollection().countDocuments(filter);
    } catch (error) {
      rethrowDatabaseError(error);
    }
  }

  async findMany(filter, sort, skip, limit) {
    try {
      return await this.getCollection().find(filter).sort(sort).skip(skip).limit(limit).toArray();
    } catch (error) {
      rethrowDatabaseError(error);
    }
  }

  async findAll(filter, sort) {
    try {
      return await this.getCollection().find(filter).sort(sort).toArray();
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

  async bulkUpsertByName(profiles) {
    try {
      const operations = profiles.map((profile) => ({
        updateOne: {
          filter: { name: profile.name },
          update: {
            $set: {
              name: profile.name,
              gender: profile.gender,
              gender_probability: profile.gender_probability,
              age: profile.age,
              age_group: profile.age_group,
              country_id: profile.country_id,
              country_name: profile.country_name,
              country_probability: profile.country_probability
            },
            $setOnInsert: {
              id: profile.id,
              created_at: profile.created_at
            }
          },
          upsert: true
        }
      }));

      const result = await this.getCollection().bulkWrite(operations, { ordered: false });

      return {
        processed: profiles.length,
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount
      };
    } catch (error) {
      rethrowDatabaseError(error);
    }
  }
}

export const profileRepository = new ProfileRepository();
