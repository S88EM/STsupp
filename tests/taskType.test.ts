import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  getTaskTypeInfo,
  JIRA_TASK_TYPES,
  TASK_PRIORITIES,
} from "../src/lib/constants/task";

describe("task type & priority utility", () => {
  describe("getTaskTypeInfo by aiContext.type", () => {
    test("resolves exact type from aiContext.type", () => {
      assert.equal(getTaskTypeInfo({ type: "BUG" }).id, "BUG");
      assert.equal(getTaskTypeInfo({ type: "TASK" }).id, "TASK");
      assert.equal(getTaskTypeInfo({ type: "STORY" }).id, "STORY");
      assert.equal(getTaskTypeInfo({ type: "IMPROVEMENT" }).id, "IMPROVEMENT");
      assert.equal(getTaskTypeInfo({ type: "SUPPORT" }).id, "SUPPORT");
    });

    test("handles lower/mixed case type in aiContext", () => {
      assert.equal(getTaskTypeInfo({ type: "bug" }).id, "BUG");
      assert.equal(getTaskTypeInfo({ type: "Story" }).id, "STORY");
      assert.equal(getTaskTypeInfo({ type: "improvement" }).id, "IMPROVEMENT");
    });
  });

  describe("getTaskTypeInfo title heuristics fallback", () => {
    test("detects BUG from Ukrainian and English keywords in title", () => {
      assert.equal(getTaskTypeInfo(null, "Виправити критичний баг в логіні").id, "BUG");
      assert.equal(getTaskTypeInfo({}, "UI bug on dashboard").id, "BUG");
      assert.equal(getTaskTypeInfo(null, "Помилка при збереженні форми").id, "BUG");
      assert.equal(getTaskTypeInfo(null, "Quick fix for navigation").id, "BUG");
    });

    test("detects IMPROVEMENT from keywords in title", () => {
      assert.equal(getTaskTypeInfo(null, "Покращити швидкодію рендерингу").id, "IMPROVEMENT");
      assert.equal(getTaskTypeInfo(null, "Оптимізація запитів до бази").id, "IMPROVEMENT");
      assert.equal(getTaskTypeInfo(null, "UI імпрувмент форми").id, "IMPROVEMENT");
    });

    test("detects SUPPORT from keywords in title", () => {
      assert.equal(getTaskTypeInfo(null, "Технічна підтримка клієнта").id, "SUPPORT");
      assert.equal(getTaskTypeInfo(null, "Налаштування конфігурації роутера").id, "SUPPORT");
      assert.equal(getTaskTypeInfo(null, "Підготувати інструкцію").id, "SUPPORT");
    });

    test("detects STORY from keywords in title", () => {
      assert.equal(getTaskTypeInfo(null, "Користувацька історія: новий кабінет").id, "STORY");
      assert.equal(getTaskTypeInfo(null, "User story for payment gateway").id, "STORY");
      assert.equal(getTaskTypeInfo(null, "Нова фіча: бекапи системи").id, "STORY");
      assert.equal(getTaskTypeInfo(null, "New feat: export to csv").id, "STORY");
    });

    test("falls back to standard TASK for generic titles", () => {
      assert.equal(getTaskTypeInfo(null, "Оновити залежності npm").id, "TASK");
      assert.equal(getTaskTypeInfo(null, "").id, "TASK");
      assert.equal(getTaskTypeInfo(null).id, "TASK");
    });
  });

  describe("TASK_PRIORITIES structure", () => {
    test("contains standard 4 priority levels with labels and colors", () => {
      const ids = TASK_PRIORITIES.map((p) => p.id);
      assert.deepEqual(ids, ["LOW", "MEDIUM", "HIGH", "URGENT"]);

      const urgent = TASK_PRIORITIES.find((p) => p.id === "URGENT");
      assert.ok(urgent?.label.includes("Терміновий"));
    });
  });
});
