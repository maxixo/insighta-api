import { z } from 'zod';

import { getCountryNameByCode, normalizeCountryCode } from '../utils/country.js';
import { UpstreamServiceError } from '../utils/appError.js';

const genderizeSchema = z.object({
  gender: z.enum(['male', 'female']),
  probability: z.number().finite().min(0).max(1)
});

const agifySchema = z.object({
  age: z.number().int().min(0)
});

const nationalizeSchema = z.object({
  country: z
    .array(
      z.object({
        country_id: z.string(),
        probability: z.number().finite().min(0).max(1)
      })
    )
    .min(1)
});

async function fetchJson(url) {
  let response;

  try {
    response = await fetch(url);
  } catch (error) {
    throw new UpstreamServiceError('Upstream enrichment service failed', error);
  }

  if (!response.ok) {
    throw new UpstreamServiceError('Upstream enrichment service failed');
  }

  try {
    return await response.json();
  } catch (error) {
    throw new UpstreamServiceError('Upstream enrichment service failed', error);
  }
}

export async function enrichProfileName(name) {
  try {
    const [genderizePayload, agifyPayload, nationalizePayload] = await Promise.all([
      fetchJson(`https://api.genderize.io?name=${encodeURIComponent(name)}`),
      fetchJson(`https://api.agify.io?name=${encodeURIComponent(name)}`),
      fetchJson(`https://api.nationalize.io?name=${encodeURIComponent(name)}`)
    ]);

    const genderize = genderizeSchema.parse(genderizePayload);
    const agify = agifySchema.parse(agifyPayload);
    const nationalize = nationalizeSchema.parse(nationalizePayload);

    const topCountry = [...nationalize.country].sort((left, right) => right.probability - left.probability)[0];
    const countryId = normalizeCountryCode(topCountry.country_id);
    const countryName = getCountryNameByCode(countryId);

    if (!countryId || !countryName) {
      throw new UpstreamServiceError('Upstream enrichment service failed');
    }

    return {
      gender: genderize.gender,
      gender_probability: genderize.probability,
      age: agify.age,
      country_id: countryId,
      country_name: countryName,
      country_probability: topCountry.probability
    };
  } catch (error) {
    if (error instanceof UpstreamServiceError) {
      throw error;
    }

    throw new UpstreamServiceError('Upstream enrichment service failed', error);
  }
}
