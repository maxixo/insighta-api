import { readFile } from 'node:fs/promises';

import { uuidv7 } from 'uuidv7';

import { env } from '../config/env.js';
import { mongoManager } from '../db/mongo.js';
import { profileRepository } from '../repositories/profileRepository.js';
import { toUtcIsoSeconds } from '../utils/date.js';
import { SeedValidationError } from '../utils/appError.js';
import { validateSeedPayload } from '../validators/seedValidator.js';

function isHttpSource(source) {
  return /^https?:\/\//i.test(source);
}

async function loadSeedPayloadFromUrl(source) {
  const response = await fetch(source);

  if (!response.ok) {
    throw new Error(`Unable to load seed source: ${response.status}`);
  }

  return response.json();
}

async function loadSeedPayloadFromFile(source) {
  const content = await readFile(source, 'utf-8');
  return JSON.parse(content);
}

export async function loadSeedPayload(source = env.SEED_PROFILES_SOURCE) {
  try {
    if (isHttpSource(source)) {
      return await loadSeedPayloadFromUrl(source);
    }

    return await loadSeedPayloadFromFile(source);
  } catch (error) {
    if (error instanceof SeedValidationError) {
      throw error;
    }

    throw new Error('Unable to load seed payload');
  }
}

export async function seedProfilesPayload(payload) {
  const validatedProfiles = validateSeedPayload(payload).map((profile) => ({
    ...profile,
    id: uuidv7(),
    created_at: toUtcIsoSeconds()
  }));

  return profileRepository.bulkUpsertByName(validatedProfiles);
}

export async function runSeed(options = {}) {
  const source = options.source ?? env.SEED_PROFILES_SOURCE;
  const payload = options.payload ?? (await loadSeedPayload(source));

  await mongoManager.connect(options.connection);
  await profileRepository.ensureIndexes();

  return seedProfilesPayload(payload);
}
