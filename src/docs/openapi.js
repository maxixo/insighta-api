const profileSchema = {
  type: 'object',
  required: [
    'id',
    'name',
    'gender',
    'gender_probability',
    'age',
    'age_group',
    'country_id',
    'country_name',
    'country_probability',
    'created_at'
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', example: 'ella' },
    gender: { type: 'string', enum: ['male', 'female'] },
    gender_probability: { type: 'number', example: 0.98 },
    age: { type: 'integer', example: 28 },
    age_group: { type: 'string', enum: ['child', 'teenager', 'adult', 'senior'] },
    country_id: { type: 'string', example: 'NG' },
    country_name: { type: 'string', example: 'Nigeria' },
    country_probability: { type: 'number', example: 0.64 },
    created_at: { type: 'string', format: 'date-time', example: '2026-04-15T08:00:00Z' }
  }
};

const exampleProfiles = {
  ella: {
    id: '018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7a',
    name: 'ella',
    gender: 'female',
    gender_probability: 0.98,
    age: 28,
    age_group: 'adult',
    country_id: 'NG',
    country_name: 'Nigeria',
    country_probability: 0.64,
    created_at: '2026-04-15T08:00:00Z'
  },
  john: {
    id: '018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7b',
    name: 'john',
    gender: 'male',
    gender_probability: 0.88,
    age: 17,
    age_group: 'teenager',
    country_id: 'US',
    country_name: 'United States of America',
    country_probability: 0.72,
    created_at: '2026-04-16T08:00:00Z'
  },
  martha: {
    id: '018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7c',
    name: 'martha',
    gender: 'female',
    gender_probability: 0.9,
    age: 67,
    age_group: 'senior',
    country_id: 'GB',
    country_name: 'United Kingdom',
    country_probability: 0.83,
    created_at: '2026-04-17T08:00:00Z'
  }
};

const exampleResponses = {
  health: {
    status: 'success',
    data: {
      environment: 'development',
      database: 'ready'
    }
  },
  authRefreshRequest: {
    refresh_token: 'refresh-token'
  },
  authSuccess: {
    status: 'success',
    access_token: 'token',
    refresh_token: 'token'
  },
  list: {
    status: 'success',
    page: 1,
    limit: 2,
    total: 2,
    total_pages: 1,
    links: {
      self: '/api/v1/profiles?gender=female&sort_by=age&order=desc&page=1&limit=2',
      next: null,
      prev: null
    },
    data: [exampleProfiles.martha, exampleProfiles.ella]
  },
  search: {
    status: 'success',
    page: 1,
    limit: 10,
    total: 1,
    total_pages: 1,
    links: {
      self: '/api/v1/profiles/search?q=older+than+30+from+united+kingdom&page=1&limit=10',
      next: null,
      prev: null
    },
    data: [exampleProfiles.martha]
  },
  createNew: {
    status: 'success',
    data: exampleProfiles.ella
  },
  createExisting: {
    status: 'success',
    data: exampleProfiles.ella,
    message: 'Profile already exists'
  },
  getById: {
    status: 'success',
    data: exampleProfiles.ella
  }
};

const exampleErrors = {
  authRequired: {
    status: 'error',
    message: 'Authentication required'
  },
  inactiveUser: {
    status: 'error',
    message: 'User account is inactive'
  },
  forbidden: {
    status: 'error',
    message: 'Forbidden'
  },
  apiVersionRequired: {
    status: 'error',
    message: 'API version header required'
  },
  invalidRefreshToken: {
    status: 'error',
    message: 'Invalid or expired refresh token'
  },
  refreshTokenRequired: {
    status: 'error',
    message: 'Refresh token is required'
  },
  refreshTokenMustBeString: {
    status: 'error',
    message: 'Refresh token must be a string'
  },
  githubNotConfigured: {
    status: 'error',
    message: 'GitHub OAuth is not configured'
  },
  githubNotFullyConfigured: {
    status: 'error',
    message: 'GitHub OAuth is not fully configured'
  },
  githubCodeRequired: {
    status: 'error',
    message: 'GitHub OAuth code is required'
  },
  githubStateRequired: {
    status: 'error',
    message: 'GitHub OAuth state is required'
  },
  invalidGithubState: {
    status: 'error',
    message: 'Invalid GitHub OAuth state'
  },
  githubVerifierMissing: {
    status: 'error',
    message: 'GitHub OAuth verifier is missing'
  },
  githubExchangeFailed: {
    status: 'error',
    message: 'GitHub OAuth exchange failed'
  },
  invalidQuery: {
    status: 'error',
    message: 'Invalid query parameters'
  },
  unableToInterpretQuery: {
    status: 'error',
    message: 'Unable to interpret query'
  },
  nameRequired: {
    status: 'error',
    message: 'Name is required'
  },
  invalidNameType: {
    status: 'error',
    message: 'Name must be a string'
  },
  invalidJsonBody: {
    status: 'error',
    message: 'Invalid JSON body'
  },
  upstreamEnrichmentFailed: {
    status: 'error',
    message: 'Upstream enrichment service failed'
  },
  profileNotFound: {
    status: 'error',
    message: 'Profile not found'
  }
};

const exportCsvExample = [
  'id,name,gender,gender_probability,age,age_group,country_id,country_name,country_probability,created_at',
  '018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7c,martha,female,0.9,67,senior,GB,United Kingdom,0.83,2026-04-17T08:00:00Z',
  '018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7a,ella,female,0.98,28,adult,NG,Nigeria,0.64,2026-04-15T08:00:00Z'
].join('\n');

const apiVersionHeader = {
  in: 'header',
  name: 'X-API-Version',
  required: true,
  description: 'Required version header for profile routes. The current runtime only accepts `1`.',
  schema: {
    type: 'string',
    enum: ['1']
  }
};

const profileQueryParameters = [
  { $ref: '#/components/parameters/ApiVersionHeader' },
  { in: 'query', name: 'gender', schema: { type: 'string', enum: ['male', 'female'] } },
  {
    in: 'query',
    name: 'age_group',
    schema: { type: 'string', enum: ['child', 'teenager', 'adult', 'senior'] }
  },
  { in: 'query', name: 'country_id', schema: { type: 'string', example: 'NG' } },
  { in: 'query', name: 'min_age', schema: { type: 'integer' } },
  { in: 'query', name: 'max_age', schema: { type: 'integer' } },
  { in: 'query', name: 'min_gender_probability', schema: { type: 'number' } },
  { in: 'query', name: 'min_country_probability', schema: { type: 'number' } },
  { in: 'query', name: 'sort_by', schema: { type: 'string', enum: ['age', 'created_at', 'gender_probability'] } },
  { in: 'query', name: 'order', schema: { type: 'string', enum: ['asc', 'desc'] } }
];

const paginatedProfileQueryParameters = [
  ...profileQueryParameters,
  { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
  { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } }
];

export default {
  openapi: '3.0.3',
  info: {
    title: 'Profile Intelligence API',
    version: '1.0.0',
    description: 'Standalone Express.js backend for GitHub OAuth authentication, profile enrichment, storage, filtering, deterministic natural-language search, and CSV export.'
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Local development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    parameters: {
      ApiVersionHeader: apiVersionHeader
    },
    schemas: {
      Profile: profileSchema,
      CreateProfileRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'ella' }
        }
      },
      AuthRefreshRequest: {
        type: 'object',
        required: ['refresh_token'],
        properties: {
          refresh_token: { type: 'string', example: 'refresh-token' }
        }
      },
      AuthSessionResponse: {
        type: 'object',
        required: ['status', 'access_token', 'refresh_token'],
        properties: {
          status: { type: 'string', example: 'success' },
          access_token: { type: 'string', example: 'token' },
          refresh_token: { type: 'string', example: 'token' }
        }
      },
      ListLinks: {
        type: 'object',
        required: ['self', 'next', 'prev'],
        properties: {
          self: { type: 'string', example: '/api/v1/profiles?page=1&limit=10' },
          next: { type: 'string', nullable: true, example: '/api/v1/profiles?page=2&limit=10' },
          prev: { type: 'string', nullable: true, example: null }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          data: { $ref: '#/components/schemas/Profile' },
          message: { type: 'string', example: 'Profile already exists' }
        }
      },
      ListResponse: {
        type: 'object',
        required: ['status', 'page', 'limit', 'total', 'total_pages', 'links', 'data'],
        properties: {
          status: { type: 'string', example: 'success' },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 1 },
          total_pages: { type: 'integer', example: 1 },
          links: { $ref: '#/components/schemas/ListLinks' },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Profile' }
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        required: ['status', 'message'],
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string', example: 'Invalid query parameters' }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          200: {
            description: 'Service health information',
            content: {
              'application/json': {
                example: exampleResponses.health
              }
            }
          }
        }
      }
    },
    '/health/ready': {
      get: {
        summary: 'Readiness check',
        responses: {
          200: {
            description: 'Service dependencies are ready',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  data: {
                    database: 'ready'
                  }
                }
              }
            }
          },
          503: {
            description: 'A required dependency is not ready',
            content: {
              'application/json': {
                example: {
                  status: 'error',
                  message: 'Database not ready'
                }
              }
            }
          }
        }
      }
    },
    '/auth/github': {
      get: {
        summary: 'Start GitHub OAuth with PKCE',
        description: 'Creates PKCE verifier and state cookies, then redirects the client to the GitHub authorization endpoint.',
        responses: {
          302: {
            description: 'Redirect to the GitHub OAuth authorize URL',
            headers: {
              Location: {
                description: 'GitHub authorization URL',
                schema: {
                  type: 'string',
                  example:
                    'https://github.com/login/oauth/authorize?client_id=github-client-id&redirect_uri=http%3A%2F%2Flocalhost%3A4000%2Fauth%2Fgithub%2Fcallback&scope=read%3Auser+user%3Aemail&state=oauth-state&code_challenge=challenge&code_challenge_method=S256'
                }
              },
              'Set-Cookie': {
                description: 'HTTP-only `github_oauth_state` and `github_oauth_code_verifier` cookies scoped to `/auth/github`.',
                schema: { type: 'string' }
              },
              'Cache-Control': {
                description: 'Response cache policy',
                schema: { type: 'string', example: 'no-store' }
              }
            }
          },
          500: {
            description: 'GitHub OAuth client ID is missing',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.githubNotConfigured
              }
            }
          }
        }
      }
    },
    '/auth/github/callback': {
      get: {
        summary: 'Exchange the GitHub OAuth callback for app tokens',
        description: 'Validates PKCE state and verifier cookies, exchanges the GitHub authorization code, persists the user, and returns app access and refresh tokens.',
        parameters: [
          { in: 'query', name: 'code', required: true, schema: { type: 'string', example: 'oauth-code' } },
          { in: 'query', name: 'state', required: true, schema: { type: 'string', example: 'oauth-state' } }
        ],
        responses: {
          200: {
            description: 'Access and refresh tokens issued',
            headers: {
              'Cache-Control': {
                description: 'Response cache policy',
                schema: { type: 'string', example: 'no-store' }
              },
              'Set-Cookie': {
                description: 'Clears the temporary PKCE cookies after a successful callback.',
                schema: { type: 'string' }
              }
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthSessionResponse' },
                example: exampleResponses.authSuccess
              }
            }
          },
          400: {
            description: 'Missing code, missing state, invalid state, or missing verifier cookie',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                examples: {
                  missingCode: {
                    summary: 'Missing OAuth code',
                    value: exampleErrors.githubCodeRequired
                  },
                  missingState: {
                    summary: 'Missing OAuth state',
                    value: exampleErrors.githubStateRequired
                  },
                  invalidState: {
                    summary: 'State cookie mismatch',
                    value: exampleErrors.invalidGithubState
                  },
                  missingVerifier: {
                    summary: 'Missing PKCE verifier cookie',
                    value: exampleErrors.githubVerifierMissing
                  }
                }
              }
            }
          },
          500: {
            description: 'GitHub OAuth client secret is missing',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.githubNotFullyConfigured
              }
            }
          },
          502: {
            description: 'GitHub upstream exchange or user lookup failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.githubExchangeFailed
              }
            }
          }
        }
      }
    },
    '/auth/refresh': {
      post: {
        summary: 'Rotate an access token and refresh token pair',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthRefreshRequest' },
              example: exampleResponses.authRefreshRequest
            }
          }
        },
        responses: {
          200: {
            description: 'New access and refresh tokens issued',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthSessionResponse' },
                example: exampleResponses.authSuccess
              }
            }
          },
          400: {
            description: 'Missing refresh token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.refreshTokenRequired
              }
            }
          },
          401: {
            description: 'Invalid or expired refresh token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.invalidRefreshToken
              }
            }
          },
          422: {
            description: 'Refresh token must be a string',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.refreshTokenMustBeString
              }
            }
          }
        }
      }
    },
    '/auth/logout': {
      post: {
        summary: 'Invalidate a refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthRefreshRequest' },
              example: exampleResponses.authRefreshRequest
            }
          }
        },
        responses: {
          204: {
            description: 'Refresh token invalidated'
          },
          400: {
            description: 'Missing refresh token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.refreshTokenRequired
              }
            }
          },
          401: {
            description: 'Invalid or expired refresh token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.invalidRefreshToken
              }
            }
          },
          422: {
            description: 'Refresh token must be a string',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.refreshTokenMustBeString
              }
            }
          }
        }
      }
    },
    '/api/v1/profiles': {
      get: {
        summary: 'List profiles',
        description: 'Requires a bearer access token, an active user, and `X-API-Version: 1`. Read access is allowed for `admin` and `analyst` roles.',
        security: [{ bearerAuth: [] }],
        parameters: paginatedProfileQueryParameters,
        responses: {
          200: {
            description: 'Paginated profile list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ListResponse' },
                example: exampleResponses.list
              }
            }
          },
          400: {
            description: 'Missing API version header or invalid query parameters',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                examples: {
                  missingVersion: {
                    summary: 'Missing X-API-Version header',
                    value: exampleErrors.apiVersionRequired
                  },
                  invalidQuery: {
                    summary: 'Semantic query validation error',
                    value: exampleErrors.invalidQuery
                  }
                }
              }
            }
          },
          401: {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.authRequired
              }
            }
          },
          403: {
            description: 'Inactive user or insufficient role',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                examples: {
                  inactiveUser: {
                    summary: 'User account is inactive',
                    value: exampleErrors.inactiveUser
                  },
                  forbidden: {
                    summary: 'Role is not allowed to read profiles',
                    value: exampleErrors.forbidden
                  }
                }
              }
            }
          },
          422: {
            description: 'Invalid numeric query parameter format',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.invalidQuery
              }
            }
          }
        }
      },
      post: {
        summary: 'Create or reuse a profile by normalized name',
        description: 'Requires a bearer access token, an active user, and `X-API-Version: 1`. Only `admin` users can create profiles.',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/ApiVersionHeader' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateProfileRequest' },
              example: { name: 'ella' }
            }
          }
        },
        responses: {
          200: {
            description: 'Existing profile returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
                example: exampleResponses.createExisting
              }
            }
          },
          201: {
            description: 'New profile created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
                example: exampleResponses.createNew
              }
            }
          },
          400: {
            description: 'Missing API version header, missing name, or invalid JSON body',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                examples: {
                  missingVersion: {
                    summary: 'Missing X-API-Version header',
                    value: exampleErrors.apiVersionRequired
                  },
                  missingName: {
                    summary: 'Required name missing',
                    value: exampleErrors.nameRequired
                  },
                  invalidJson: {
                    summary: 'Malformed JSON request body',
                    value: exampleErrors.invalidJsonBody
                  }
                }
              }
            }
          },
          401: {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.authRequired
              }
            }
          },
          403: {
            description: 'Inactive user or insufficient role',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                examples: {
                  inactiveUser: {
                    summary: 'User account is inactive',
                    value: exampleErrors.inactiveUser
                  },
                  forbidden: {
                    summary: 'Role is not allowed to create profiles',
                    value: exampleErrors.forbidden
                  }
                }
              }
            }
          },
          422: {
            description: 'Invalid name type',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.invalidNameType
              }
            }
          },
          502: {
            description: 'Upstream enrichment service failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.upstreamEnrichmentFailed
              }
            }
          }
        }
      }
    },
    '/api/v1/profiles/export': {
      get: {
        summary: 'Export matching profiles as CSV',
        description: 'Requires a bearer access token, an active user, and `X-API-Version: 1`. Read access is allowed for `admin` and `analyst` roles. Export uses the same filters and sort options as the list endpoint and requires `format=csv`.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/ApiVersionHeader' },
          { in: 'query', name: 'format', required: true, schema: { type: 'string', enum: ['csv'] } },
          ...profileQueryParameters.slice(1)
        ],
        responses: {
          200: {
            description: 'CSV export of matching profiles',
            headers: {
              'Content-Type': {
                description: 'CSV media type with UTF-8 charset',
                schema: { type: 'string', example: 'text/csv; charset=utf-8' }
              },
              'Content-Disposition': {
                description: 'Timestamped attachment filename for the exported file',
                schema: {
                  type: 'string',
                  example: 'attachment; filename=\"profiles_2026-04-17T08-00-00Z.csv\"'
                }
              }
            },
            content: {
              'text/csv': {
                schema: {
                  type: 'string',
                  example: exportCsvExample
                }
              }
            }
          },
          400: {
            description: 'Missing API version header or invalid query parameters',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                examples: {
                  missingVersion: {
                    summary: 'Missing X-API-Version header',
                    value: exampleErrors.apiVersionRequired
                  },
                  invalidQuery: {
                    summary: 'Semantic query validation error or missing `format=csv`',
                    value: exampleErrors.invalidQuery
                  }
                }
              }
            }
          },
          401: {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.authRequired
              }
            }
          },
          403: {
            description: 'Inactive user or insufficient role',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                examples: {
                  inactiveUser: {
                    summary: 'User account is inactive',
                    value: exampleErrors.inactiveUser
                  },
                  forbidden: {
                    summary: 'Role is not allowed to export profiles',
                    value: exampleErrors.forbidden
                  }
                }
              }
            }
          },
          422: {
            description: 'Invalid numeric query parameter format',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.invalidQuery
              }
            }
          }
        }
      }
    },
    '/api/v1/profiles/search': {
      get: {
        summary: 'Deterministic natural-language profile search',
        description: 'Requires a bearer access token, an active user, and `X-API-Version: 1`. Read access is allowed for `admin` and `analyst` roles.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/ApiVersionHeader' },
          { in: 'query', name: 'q', required: true, schema: { type: 'string', example: 'young females from nigeria' } },
          { in: 'query', name: 'sort_by', schema: { type: 'string', enum: ['age', 'created_at', 'gender_probability'] } },
          { in: 'query', name: 'order', schema: { type: 'string', enum: ['asc', 'desc'] } },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } }
        ],
        responses: {
          200: {
            description: 'Search results',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ListResponse' },
                example: exampleResponses.search
              }
            }
          },
          400: {
            description: 'Missing API version header or query could not be interpreted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                examples: {
                  missingVersion: {
                    summary: 'Missing X-API-Version header',
                    value: exampleErrors.apiVersionRequired
                  },
                  invalidQuery: {
                    summary: 'Search query could not be interpreted',
                    value: exampleErrors.unableToInterpretQuery
                  }
                }
              }
            }
          },
          401: {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.authRequired
              }
            }
          },
          403: {
            description: 'Inactive user or insufficient role',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                examples: {
                  inactiveUser: {
                    summary: 'User account is inactive',
                    value: exampleErrors.inactiveUser
                  },
                  forbidden: {
                    summary: 'Role is not allowed to search profiles',
                    value: exampleErrors.forbidden
                  }
                }
              }
            }
          },
          422: {
            description: 'Invalid numeric query parameter format',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.invalidQuery
              }
            }
          }
        }
      }
    },
    '/api/v1/profiles/{id}': {
      get: {
        summary: 'Get a profile by UUID v7 id',
        description: 'Requires a bearer access token, an active user, and `X-API-Version: 1`. Read access is allowed for `admin` and `analyst` roles.',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/ApiVersionHeader' }, { in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Profile found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
                example: exampleResponses.getById
              }
            }
          },
          400: {
            description: 'Missing API version header',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.apiVersionRequired
              }
            }
          },
          401: {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.authRequired
              }
            }
          },
          403: {
            description: 'Inactive user or insufficient role',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                examples: {
                  inactiveUser: {
                    summary: 'User account is inactive',
                    value: exampleErrors.inactiveUser
                  },
                  forbidden: {
                    summary: 'Role is not allowed to read profiles',
                    value: exampleErrors.forbidden
                  }
                }
              }
            }
          },
          404: {
            description: 'Profile not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.profileNotFound
              }
            }
          }
        }
      },
      delete: {
        summary: 'Delete a profile by UUID v7 id',
        description: 'Requires a bearer access token, an active user, and `X-API-Version: 1`. Only `admin` users can delete profiles.',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/ApiVersionHeader' }, { in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          204: {
            description: 'Profile deleted'
          },
          400: {
            description: 'Missing API version header',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.apiVersionRequired
              }
            }
          },
          401: {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.authRequired
              }
            }
          },
          403: {
            description: 'Inactive user or insufficient role',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                examples: {
                  inactiveUser: {
                    summary: 'User account is inactive',
                    value: exampleErrors.inactiveUser
                  },
                  forbidden: {
                    summary: 'Role is not allowed to delete profiles',
                    value: exampleErrors.forbidden
                  }
                }
              }
            }
          },
          404: {
            description: 'Profile not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: exampleErrors.profileNotFound
              }
            }
          }
        }
      }
    }
  }
};
