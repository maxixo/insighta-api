import { uuidv7 } from 'uuidv7';

import { profileRepository } from '../repositories/profileRepository.js';
import { classifyAgeGroup, toUtcIsoSeconds } from '../utils/date.js';
import { AppError, DatabaseError } from '../utils/appError.js';
import { enrichProfileName } from './enrichmentService.js';
import { interpretSearchQuery } from './searchService.js';

function isDuplicateKeyError(error) {
  return error && typeof error === 'object' && error.code === 11000;
}

class ProfileService {
  async queryProfiles(options) {
    const { filter, sort, skip, limit } = options;
    const [total, data] = await Promise.all([
      profileRepository.countProfiles(filter),
      profileRepository.findMany(filter, sort, skip, limit)
    ]);

    return { total, data };
  }

  async createProfile(name) {
    const existingProfile = await profileRepository.findByName(name);

    if (existingProfile) {
      return {
        created: false,
        profile: existingProfile
      };
    }

    const enrichment = await enrichProfileName(name);
    const profile = {
      id: uuidv7(),
      name,
      gender: enrichment.gender,
      gender_probability: enrichment.gender_probability,
      age: enrichment.age,
      age_group: classifyAgeGroup(enrichment.age),
      country_id: enrichment.country_id,
      country_name: enrichment.country_name,
      country_probability: enrichment.country_probability,
      created_at: toUtcIsoSeconds()
    };

    try {
      await profileRepository.insertProfile(profile);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        const duplicate = await profileRepository.findByName(name);

        if (duplicate) {
          return {
            created: false,
            profile: duplicate
          };
        }
      }

      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError('Database error', error);
    }

    return {
      created: true,
      profile
    };
  }

  async listProfiles(options) {
    return this.queryProfiles(options);
  }

  async searchProfiles(options) {
    const interpretedFilters = interpretSearchQuery(options.q);
    const combinedFilter = { ...options.filter };

    if (interpretedFilters.gender) {
      combinedFilter.gender = interpretedFilters.gender;
    }

    if (interpretedFilters.age_group) {
      combinedFilter.age_group = interpretedFilters.age_group;
    }

    if (interpretedFilters.country_id) {
      combinedFilter.country_id = interpretedFilters.country_id;
    }

    if (interpretedFilters.min_age !== undefined || interpretedFilters.max_age !== undefined) {
      combinedFilter.age = {
        ...(combinedFilter.age ?? {})
      };

      if (interpretedFilters.min_age !== undefined) {
        combinedFilter.age.$gte = interpretedFilters.min_age;
      }

      if (interpretedFilters.max_age !== undefined) {
        combinedFilter.age.$lte = interpretedFilters.max_age;
      }
    }

    if (
      combinedFilter.age &&
      combinedFilter.age.$gte !== undefined &&
      combinedFilter.age.$lte !== undefined &&
      combinedFilter.age.$gte > combinedFilter.age.$lte
    ) {
      throw new AppError(400, 'Unable to interpret query');
    }

    return this.queryProfiles({
      ...options,
      filter: combinedFilter
    });
  }

  async getProfileById(id) {
    const profile = await profileRepository.findById(id);

    if (!profile) {
      throw new AppError(404, 'Profile not found');
    }

    return profile;
  }

  async deleteProfileById(id) {
    const result = await profileRepository.deleteById(id);

    if (!result || result.deletedCount === 0) {
      throw new AppError(404, 'Profile not found');
    }
  }
}

export const profileService = new ProfileService();
