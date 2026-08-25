import { describe, it, expect } from "vitest";
import OpenAPISchemaValidator from "openapi-schema-validator";
import { openApiSpec } from "./openapi-spec";

/**
 * This is exactly the check that was run manually with a Python
 * validator when the spec was first written — it caught two real bugs
 * (invalid `type: ["string", "null"]` syntax and an invalid `oneOf`
 * with a `type: "null"` branch, both JSON-Schema-draft/OpenAPI-3.1
 * syntax that OpenAPI 3.0 doesn't support). Automating it here means
 * that class of error gets caught on every future edit to the spec,
 * not just the one time someone remembers to run a validator by hand.
 */
describe("openApiSpec", () => {
  it("passes full OpenAPI 3.0 schema validation", () => {
    const validator = new OpenAPISchemaValidator({ version: 3 });
    const result = validator.validate(openApiSpec as any);
    if (result.errors.length > 0) {
      // Print the actual errors on failure — a bare "expected 0, got 3"
      // sends whoever's debugging this straight to Google instead of
      // straight to the problem.
      console.error(JSON.stringify(result.errors, null, 2));
    }
    expect(result.errors).toEqual([]);
  });

  it("declares every path that the actual route handlers implement", () => {
    // A manually-maintained list, checked against the spec — if a new
    // route is added under app/api/v1/ without updating the spec, this
    // is the test that should fail and remind someone.
    const expectedPaths = [
      "/api/v1/areas",
      "/api/v1/areas/{slug}",
      "/api/v1/areas/batch",
      "/api/v1/reports",
      "/api/v1/compare",
      "/api/v1/lookup",
      "/api/v1/status",
    ];
    expect(Object.keys(openApiSpec.paths).sort()).toEqual(expectedPaths.sort());
  });
});
