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

export default {
  openapi: '3.0.3',
  info: {
    title: 'Profile Intelligence API',
    version: '1.0.0',
    description: 'Standalone Express.js backend for profile enrichment, storage, filtering, and natural-language search.'
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Local development server'
    }
  ],
  components: {
    schemas: {
      Profile: profileSchema,
      CreateProfileRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'ella' }
        }
      },
      AuthLoginRequest: {
        type: 'object',
        minProperties: 1,
        additionalProperties: true,
        description:
          'Planned credential payload. Exact login fields will be finalized when runtime auth support is implemented.'
      },
      AuthRefreshRequest: {
        type: 'object',
        required: ['refresh_token'],
        properties: {
          refresh_token: { type: 'string', example: 'refresh-token' }
        }
      },
      AuthTokenData: {
        type: 'object',
        required: ['access_token', 'refresh_token', 'token_type', 'expires_in'],
        properties: {
          access_token: { type: 'string', example: 'token' },
          refresh_token: { type: 'string', example: 'token' },
          token_type: { type: 'string', example: 'Bearer' },
          expires_in: { type: 'integer', example: 900 }
        }
      },
      AuthSuccessResponse: {
        type: 'object',
        required: ['status', 'data'],
        properties: {
          status: { type: 'string', example: 'success' },
          data: { $ref: '#/components/schemas/AuthTokenData' }
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
        properties: {
          status: { type: 'string', example: 'success' },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 1 },
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
            description: 'Service health information'
          }
        }
      }
    },
    '/api/v1/auth/login': {
      post: {
        summary: 'Planned auth login contract',
        description:
          'This route is documented for client contract planning only. The current backend does not yet implement runtime auth support.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthLoginRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Access and refresh tokens issued',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthSuccessResponse' }
              }
            }
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/auth/refresh': {
      post: {
        summary: 'Planned token refresh contract',
        description:
          'This route is documented for client contract planning only. Successful refresh rotates both the access token and the refresh token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthRefreshRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'New access and refresh tokens issued',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthSuccessResponse' }
              }
            }
          },
          401: {
            description: 'Invalid or expired refresh token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/profiles': {
      get: {
        summary: 'List profiles',
        parameters: [
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
          { in: 'query', name: 'order', schema: { type: 'string', enum: ['asc', 'desc'] } },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } }
        ],
        responses: {
          200: {
            description: 'Paginated profile list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ListResponse' }
              }
            }
          },
          400: {
            description: 'Invalid query parameters',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create or reuse a profile by normalized name',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateProfileRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Existing profile returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          201: {
            description: 'New profile created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          400: {
            description: 'Missing name or invalid JSON body',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          422: {
            description: 'Invalid name type',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          502: {
            description: 'Upstream enrichment failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/profiles/search': {
      get: {
        summary: 'Deterministic natural-language profile search',
        parameters: [
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
                schema: { $ref: '#/components/schemas/ListResponse' }
              }
            }
          },
          400: {
            description: 'Query could not be interpreted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/profiles/{id}': {
      get: {
        summary: 'Get a profile by UUID v7 id',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Profile found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          404: {
            description: 'Profile not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Delete a profile by UUID v7 id',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          204: {
            description: 'Profile deleted'
          },
          404: {
            description: 'Profile not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    }
  }
};
