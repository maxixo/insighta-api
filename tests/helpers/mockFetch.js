import { vi } from 'vitest';

function createJsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return payload;
    }
  };
}

export function mockEnrichmentFetch({
  gender = 'female',
  genderProbability = 0.98,
  age = 28,
  countryId = 'NG',
  countryProbability = 0.64,
  status = 200
} = {}) {
  return vi.fn(async (input) => {
    const url = new URL(String(input));

    if (url.hostname === 'api.genderize.io') {
      return createJsonResponse(
        {
          gender,
          probability: genderProbability
        },
        status
      );
    }

    if (url.hostname === 'api.agify.io') {
      return createJsonResponse(
        {
          age
        },
        status
      );
    }

    if (url.hostname === 'api.nationalize.io') {
      return createJsonResponse(
        {
          country: [{ country_id: countryId, probability: countryProbability }]
        },
        status
      );
    }

    throw new Error(`Unexpected URL: ${url.toString()}`);
  });
}
