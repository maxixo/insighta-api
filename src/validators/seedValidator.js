import { z } from 'zod';

import { AGE_GROUPS, GENDERS } from '../constants/profile.js';
import { getCountryNameByCode, normalizeCountryCode } from '../utils/country.js';
import { classifyAgeGroup } from '../utils/date.js';
import { normalizeName } from '../utils/normalization.js';
import { SeedValidationError } from '../utils/appError.js';

const seedProfileSchema = z
  .object({
    name: z.string(),
    gender: z.enum(GENDERS),
    gender_probability: z.number().finite().min(0).max(1),
    age: z.number().int().min(0),
    age_group: z.enum(AGE_GROUPS),
    country_id: z.string(),
    country_name: z.string(),
    country_probability: z.number().finite().min(0).max(1)
  })
  .strict();

const seedPayloadSchema = z
  .object({
    profiles: z.array(seedProfileSchema)
  })
  .strict();

export function validateSeedPayload(input) {
  const parsed = seedPayloadSchema.safeParse(input);

  if (!parsed.success) {
    throw new SeedValidationError('Invalid seed payload');
  }

  const seenNames = new Set();

  return parsed.data.profiles.map((profile) => {
    const normalizedName = normalizeName(profile.name);

    if (!normalizedName) {
      throw new SeedValidationError('Invalid seed payload');
    }

    if (seenNames.has(normalizedName)) {
      throw new SeedValidationError('Duplicate names found in seed payload');
    }

    seenNames.add(normalizedName);

    const countryId = normalizeCountryCode(profile.country_id);
    const countryName = getCountryNameByCode(countryId);

    if (!countryId || !countryName) {
      throw new SeedValidationError('Invalid seed payload');
    }

    if (profile.age_group !== classifyAgeGroup(profile.age)) {
      throw new SeedValidationError('Invalid seed payload');
    }

    if (profile.country_name !== countryName) {
      throw new SeedValidationError('Invalid seed payload');
    }

    return {
      ...profile,
      name: normalizedName,
      country_id: countryId,
      country_name: countryName
    };
  });
}
