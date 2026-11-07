import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  comparePassword,
  createToken,
  verifyToken,
  canDeleteTasks,
  canChangeTaskStatus,
  canManageUsers,
  canManageProjects,
} from "../src/lib/auth";

describe("auth utility", () => {
  describe("password hashing & comparison", () => {
    test("hashes password and verifies correctly", async () => {
      const password = "mySecretPassword123!";
      const hash = await hashPassword(password);

      assert.notEqual(hash, password);
      assert.equal(typeof hash, "string");

      const isValid = await comparePassword(password, hash);
      assert.equal(isValid, true);

      const isInvalid = await comparePassword("wrongPassword", hash);
      assert.equal(isInvalid, false);
    });
  });

  describe("JWT tokens", () => {
    test("creates and verifies token payload", () => {
      const payload = {
        userId: "user-123",
        email: "test@stsup.local",
        name: "Test User",
        role: "ENGINEER",
      };

      const token = createToken(payload);
      assert.equal(typeof token, "string");

      const decoded = verifyToken(token);
      assert.notEqual(decoded, null);
      assert.equal(decoded?.userId, payload.userId);
      assert.equal(decoded?.email, payload.email);
      assert.equal(decoded?.role, payload.role);
    });

    test("returns null for invalid or tampered tokens", () => {
      assert.equal(verifyToken("invalid.token.here"), null);
      assert.equal(verifyToken(""), null);
      assert.equal(verifyToken("eyFakePayload"), null);
    });
  });

  describe("role permissions", () => {
    test("canDeleteTasks: only ADMIN can delete tasks", () => {
      assert.equal(canDeleteTasks("ADMIN"), true);
      assert.equal(canDeleteTasks("ENGINEER"), false);
      assert.equal(canDeleteTasks("CLIENT"), false);
      assert.equal(canDeleteTasks("MEMBER"), false);
    });

    test("canChangeTaskStatus: ADMIN and ENGINEER can change status", () => {
      assert.equal(canChangeTaskStatus("ADMIN"), true);
      assert.equal(canChangeTaskStatus("ENGINEER"), true);
      assert.equal(canChangeTaskStatus("CLIENT"), false);
      assert.equal(canChangeTaskStatus("VIEWER"), false);
    });

    test("canManageUsers: only ADMIN can manage users", () => {
      assert.equal(canManageUsers("ADMIN"), true);
      assert.equal(canManageUsers("ENGINEER"), false);
      assert.equal(canManageUsers("CLIENT"), false);
    });

    test("canManageProjects: only ADMIN can manage projects", () => {
      assert.equal(canManageProjects("ADMIN"), true);
      assert.equal(canManageProjects("ENGINEER"), false);
      assert.equal(canManageProjects("CLIENT"), false);
    });
  });
});
