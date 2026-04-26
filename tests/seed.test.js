import { mongoManager } from '../src/db/mongo.js';
import { seedProfilesPayload } from '../src/services/seedService.js';
import { validateSeedPayload } from '../src/validators/seedValidator.js';

describe('seed validation and upsert behavior', () => {
  const payload = {
    profiles: [
      {
        name: 'ella',
        gender: 'female',
        gender_probability: 0.98,
        age: 28,
        age_group: 'adult',
        country_id: 'NG',
        country_name: 'Nigeria',
        country_probability: 0.64
      }
    ]
  };

  it('validates a seed payload', () => {
    const result = validateSeedPayload(payload);

    expect(result).toEqual(payload.profiles);
  });

  it('rejects duplicate normalized names', () => {
    expect(() =>
      validateSeedPayload({
        profiles: [payload.profiles[0], { ...payload.profiles[0], name: ' Ella ' }]
      })
    ).toThrow('Duplicate names found in seed payload');
  });

  it('bulk upserts and preserves existing id and created_at', async () => {
    const collection = mongoManager.getCollection('profiles');

    await collection.insertOne({
      id: '018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7a',
      name: 'ella',
      gender: 'female',
      gender_probability: 0.4,
      age: 20,
      age_group: 'adult',
      country_id: 'US',
      country_name: 'United States of America',
      country_probability: 0.2,
      created_at: '2026-04-01T00:00:00Z'
    });

    const summary = await seedProfilesPayload(payload);
    const savedProfile = await collection.findOne({ name: 'ella' });

    expect(summary.processed).toBe(1);
    expect(savedProfile.id).toBe('018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7a');
    expect(savedProfile.created_at).toBe('2026-04-01T00:00:00Z');
    expect(savedProfile.country_id).toBe('NG');
    expect(savedProfile.country_name).toBe('Nigeria');
  });
});
