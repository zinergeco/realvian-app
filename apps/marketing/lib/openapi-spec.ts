/**
 * OpenAPI 3.0 spec, kept as data rather than hand-written YAML so it
 * can be typechecked against the same response shapes the routes
 * actually return (lib/api-shapes.ts) — the goal is that this file
 * can never silently drift from reality the way hand-maintained API
 * docs usually do.
 */

const AreaSummarySchema = {
  type: "object",
  properties: {
    slug: { type: "string", example: "didsbury-m20" },
    district: { type: "string", example: "Didsbury" },
    city: { type: "string", example: "Manchester" },
    region: { type: "string", example: "North West" },
    outcode: { type: "string", example: "M20" },
    realvianScore: { type: "integer", minimum: 0, maximum: 100 },
    investmentScore: { type: "integer", minimum: 0, maximum: 100 },
    avgPrice: { type: "number" },
    avgRent: { type: "number" },
    grossYield: { type: "number" },
    fiveYearGrowth: { type: "number" },
    dataStatus: {
      type: "string",
      enum: ["dimensions-live", "geography-live", "illustrative"],
      description:
        "Honesty flag: dimensions-live means the six liveability scores are computed from live public data; geography-live means only location is real and scores are still illustrative; illustrative means both are placeholder.",
    },
  },
  required: [
    "slug", "district", "city", "region", "outcode",
    "realvianScore", "investmentScore", "avgPrice", "avgRent",
    "grossYield", "fiveYearGrowth", "dataStatus",
  ],
} as const;

const AreaDetailSchema = {
  allOf: [
    { $ref: "#/components/schemas/AreaSummary" },
    {
      type: "object",
      properties: {
        lat: { type: "number" },
        lng: { type: "number" },
        timeOnMarket: { type: "integer", description: "Median days on market" },
        dimensions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: { type: "string" },
              label: { type: "string" },
              value: { type: "number", minimum: 0, maximum: 100 },
              detail: { type: "string" },
            },
          },
        },
        summary: { type: "string" },
        highlights: { type: "array", items: { type: "string" } },
        watchouts: { type: "array", items: { type: "string" } },
        lastRefreshedAt: { type: "string", format: "date-time" },
      },
    },
  ],
} as const;

const PostSummarySchema = {
  type: "object",
  properties: {
    slug: { type: "string" },
    kind: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    excerpt: { type: "string" },
    dataDate: { type: "string", format: "date" },
    readMinutes: { type: "integer" },
    tags: { type: "array", items: { type: "string" } },
    areaSlugs: { type: "array", items: { type: "string" } },
  },
} as const;

const ErrorSchema = {
  type: "object",
  properties: {
    error: { type: "string", example: "not_found" },
    message: { type: "string" },
  },
  required: ["error", "message"],
} as const;

const PaginationMetaProps = {
  limit: { type: "integer" },
  offset: { type: "integer" },
  total: { type: "integer" },
  count: { type: "integer", description: "Alias for total, kept for backward compatibility" },
  hasMore: { type: "boolean" },
  generatedAt: { type: "string", format: "date-time" },
} as const;

const rateLimitResponseHeaders = {
  "X-RateLimit-Limit": { schema: { type: "integer" }, description: "30 anonymous, 120 with a valid API key" },
  "X-RateLimit-Remaining": { schema: { type: "integer" } },
  "X-RateLimit-Reset": { schema: { type: "integer" }, description: "Unix timestamp, seconds" },
} as const;

const rateLimitedResponse = {
  description: "Rate limit exceeded",
  headers: {
    ...rateLimitResponseHeaders,
    "Retry-After": { schema: { type: "integer" }, description: "Seconds to wait" },
  },
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
};

const cityParam = {
  name: "city", in: "query", required: false,
  schema: { type: "string" }, example: "Manchester",
  description: "Case-insensitive exact match.",
};
const regionParam = {
  name: "region", in: "query", required: false,
  schema: { type: "string" }, example: "North West",
};
const limitParam = {
  name: "limit", in: "query", required: false,
  schema: { type: "integer", default: 50, maximum: 100 },
};
const offsetParam = {
  name: "offset", in: "query", required: false,
  schema: { type: "integer", default: 0 },
};

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Realvian API",
    version: "1.0.0",
    description:
      "Read-only JSON access to the UK area intelligence data behind realvian.co.uk. Free, beta, rate-limited. See https://realvian.co.uk/developers for the human-readable guide.",
    contact: { url: "https://realvian.co.uk/developers" },
  },
  servers: [{ url: "https://realvian.co.uk" }],
  security: [{}, { ApiKeyAuth: [] }],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "rv_...",
        description: "Optional. Free, self-serve from /account. Raises the rate limit from 30/min to 120/min.",
      },
    },
    schemas: {
      AreaSummary: AreaSummarySchema,
      AreaDetail: AreaDetailSchema,
      PostSummary: PostSummarySchema,
      Error: ErrorSchema,
    },
  },
  paths: {
    "/api/v1/areas": {
      get: {
        summary: "List areas",
        parameters: [cityParam, regionParam, limitParam, offsetParam,
          { name: "format", in: "query", required: false, schema: { type: "string", enum: ["json", "csv"] } }],
        responses: {
          "200": {
            description: "OK",
            headers: rateLimitResponseHeaders,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/AreaSummary" } },
                    meta: { type: "object", properties: PaginationMetaProps },
                  },
                },
              },
              "text/csv": { schema: { type: "string" } },
            },
          },
          "429": rateLimitedResponse,
        },
      },
    },
    "/api/v1/areas/{slug}": {
      get: {
        summary: "Get one area's full detail",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "OK",
            headers: rateLimitResponseHeaders,
            content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/AreaDetail" } } } } },
          },
          "404": { description: "No area for that slug", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": rateLimitedResponse,
        },
      },
    },
    "/api/v1/areas/batch": {
      get: {
        summary: "Fetch up to 50 areas in one request",
        parameters: [{ name: "slugs", in: "query", required: true, schema: { type: "string" }, example: "didsbury-m20,chorlton-m21", description: "Comma-separated slugs" }],
        responses: {
          "200": {
            description: "OK — partial success by design; unresolved slugs are listed in meta.notFound rather than failing the request.",
            headers: rateLimitResponseHeaders,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/AreaDetail" } },
                    meta: {
                      type: "object",
                      properties: {
                        requested: { type: "integer" },
                        found: { type: "integer" },
                        notFound: { type: "array", items: { type: "string" } },
                        generatedAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Missing ?slugs= or more than 50 slugs requested", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": rateLimitedResponse,
        },
      },
    },
    "/api/v1/reports": {
      get: {
        summary: "List market reports (metadata only, not full article body)",
        parameters: [
          { name: "area", in: "query", required: false, schema: { type: "string" } },
          { name: "kind", in: "query", required: false, schema: { type: "string" } },
          limitParam, offsetParam,
        ],
        responses: {
          "200": {
            description: "OK",
            headers: rateLimitResponseHeaders,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/PostSummary" } },
                    meta: { type: "object", properties: PaginationMetaProps },
                  },
                },
              },
            },
          },
          "429": rateLimitedResponse,
        },
      },
    },
    "/api/v1/compare": {
      get: {
        summary: "Full detail for two areas side by side",
        parameters: [
          { name: "a", in: "query", required: true, schema: { type: "string" } },
          { name: "b", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "OK",
            headers: rateLimitResponseHeaders,
            content: { "application/json": { schema: { type: "object", properties: { data: { type: "object", properties: { a: { $ref: "#/components/schemas/AreaDetail" }, b: { $ref: "#/components/schemas/AreaDetail" } } } } } } },
          },
          "400": { description: "Missing ?a= or ?b=", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "One or both slugs not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": rateLimitedResponse,
        },
      },
    },
    "/api/v1/lookup": {
      get: {
        summary: "Resolve a UK postcode/outcode to its Realvian area, if covered",
        parameters: [{ name: "postcode", in: "query", required: true, schema: { type: "string" }, example: "M20 2RN" }],
        responses: {
          "200": {
            description: "OK — check data.covered; area is null when Realvian doesn't cover the exact outcode, with city/region still resolved where possible via a neighbouring covered outcode.",
            headers: rateLimitResponseHeaders,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        postcode: { type: "string" },
                        outcode: { type: "string" },
                        covered: { type: "boolean" },
                        area: { nullable: true, allOf: [{ $ref: "#/components/schemas/AreaDetail" }] },
                        city: { type: "string", nullable: true },
                        region: { type: "string", nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Missing or invalid postcode", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": rateLimitedResponse,
        },
      },
    },
    "/api/v1/status": {
      get: {
        summary: "API health and honest data-coverage numbers",
        description: "Deliberately not rate-limited — intended for monitoring/polling.",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        status: { type: "string", example: "ok" },
                        apiVersion: { type: "string" },
                        areasCovered: { type: "integer" },
                        dataCoverage: {
                          type: "object",
                          properties: {
                            dimensionsLive: { type: "integer" },
                            geographyLive: { type: "integer" },
                            illustrative: { type: "integer" },
                          },
                        },
                        liveDataGeneratedAt: { type: "string", format: "date-time", nullable: true },
                        checkedAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
