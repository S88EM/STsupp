import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTaskCode,
  isValidTaskCode,
  getCanonicalTaskPath,
  getCanonicalTaskUrl,
} from "../src/lib/taskUrl";

describe("taskRouting and URL utilities", () => {
  describe("normalizeTaskCode", () => {
    test("converts lowercase code to uppercase", () => {
      assert.equal(normalizeTaskCode("st-1"), "ST-1");
      assert.equal(normalizeTaskCode("core-42"), "CORE-42");
      assert.equal(normalizeTaskCode("prj_test-99"), "PRJ_TEST-99");
    });

    test("trims leading and trailing whitespace", () => {
      assert.equal(normalizeTaskCode("  st-1  "), "ST-1");
      assert.equal(normalizeTaskCode("\tCORE-5\n"), "CORE-5");
    });

    test("handles null, undefined, and empty string safely", () => {
      assert.equal(normalizeTaskCode(null), "");
      assert.equal(normalizeTaskCode(undefined), "");
      assert.equal(normalizeTaskCode(""), "");
      assert.equal(normalizeTaskCode("   "), "");
    });
  });

  describe("isValidTaskCode", () => {
    test("validates standard Jira / STsup task code patterns", () => {
      assert.equal(isValidTaskCode("ST-1"), true);
      assert.equal(isValidTaskCode("CORE-42"), true);
      assert.equal(isValidTaskCode("BACKEND_API-100"), true);
      assert.equal(isValidTaskCode("st-1"), true); // auto-normalized
      assert.equal(isValidTaskCode("  ST-999  "), true); // auto-normalized
    });

    test("rejects invalid, corrupt or malformed task codes", () => {
      assert.equal(isValidTaskCode(""), false);
      assert.equal(isValidTaskCode(null), false);
      assert.equal(isValidTaskCode(undefined), false);
      assert.equal(isValidTaskCode("ST"), false);
      assert.equal(isValidTaskCode("ST-"), false);
      assert.equal(isValidTaskCode("-1"), false);
      assert.equal(isValidTaskCode("ST-ABC"), false);
      assert.equal(isValidTaskCode("ST 1"), false);
      assert.equal(isValidTaskCode("1-ST"), false);
      assert.equal(isValidTaskCode("ST/1"), false);
    });
  });

  describe("getCanonicalTaskPath", () => {
    test("constructs standard /browse/{CODE} relative path", () => {
      assert.equal(getCanonicalTaskPath("ST-1"), "/browse/ST-1");
      assert.equal(getCanonicalTaskPath("st-1"), "/browse/ST-1");
      assert.equal(getCanonicalTaskPath("core-100"), "/browse/CORE-100");
    });
  });

  describe("getCanonicalTaskUrl", () => {
    test("constructs full absolute URL with origin without trailing slash", () => {
      assert.equal(
        getCanonicalTaskUrl("ST-1", "http://localhost:3000"),
        "http://localhost:3000/browse/ST-1"
      );
    });

    test("prevents double slashes if origin has trailing slashes", () => {
      assert.equal(
        getCanonicalTaskUrl("st-1", "https://stsup.company.local/"),
        "https://stsup.company.local/browse/ST-1"
      );
      assert.equal(
        getCanonicalTaskUrl("CORE-5", "http://192.168.1.50:3000///"),
        "http://192.168.1.50:3000/browse/CORE-5"
      );
    });

    test("falls back to relative path if origin is not provided", () => {
      assert.equal(getCanonicalTaskUrl("ST-1"), "/browse/ST-1");
      assert.equal(getCanonicalTaskUrl("ST-1", ""), "/browse/ST-1");
    });
  });
});
