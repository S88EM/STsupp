import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getStatusSemantic } from "../src/components/jira/issue-detail/types";

describe("statusSemantic utility", () => {
  describe("done status detection", () => {
    test("returns 'done' when isClosed is true regardless of column", () => {
      const res = getStatusSemantic("В роботі", false, true);
      assert.equal(res.key, "done");
      assert.equal(res.label, "Готово");
      assert.equal(res.colorHex, "#10b981");
    });

    test("returns 'done' when isDoneColumn is true", () => {
      const res = getStatusSemantic("Тестування", true, false);
      assert.equal(res.key, "done");
      assert.equal(res.label, "Готово");
      assert.equal(res.colorHex, "#10b981");
    });

    test("identifies various Ukrainian and English Done names", () => {
      const doneNames = [
        "Done",
        "DONE",
        "done",
        "Готово",
        "готово",
        "Вирішено",
        "вирішено",
        "Закрито",
        "закрита",
        "Closed",
        "Resolved",
      ];
      for (const name of doneNames) {
        const res = getStatusSemantic(name);
        assert.equal(res.key, "done", `Failed for name: ${name}`);
        assert.equal(res.colorHex, "#10b981");
      }
    });
  });

  describe("testing status detection", () => {
    test("identifies QA, Review, and Testing variations", () => {
      const testingNames = [
        "Тестування",
        "тест",
        "Review",
        "Code Review",
        "Перевірка",
        "QA",
        "qa",
        "Waiting",
        "Очікує клієнта",
        "Очікування",
      ];
      for (const name of testingNames) {
        const res = getStatusSemantic(name);
        assert.equal(res.key, "testing", `Failed for name: ${name}`);
        assert.equal(res.label, "Тестування");
        assert.equal(res.colorHex, "#f59e0b");
      }
    });
  });

  describe("in-progress status detection", () => {
    test("identifies Work, Progress, and Dev variations", () => {
      const inProgressNames = [
        "В роботі",
        "в роботі",
        "In Progress",
        "IN PROGRESS",
        "Розробка",
        "розроб",
        "Dev",
        "Development",
      ];
      for (const name of inProgressNames) {
        const res = getStatusSemantic(name);
        assert.equal(res.key, "inprogress", `Failed for name: ${name}`);
        assert.equal(res.label, "В роботі");
        assert.equal(res.colorHex, "#3b82f6");
      }
    });
  });

  describe("backlog fallback detection", () => {
    test("identifies Backlog, To Do, Queue and handles empty/undefined gracefully", () => {
      const backlogNames = [
        "Беклог",
        "Backlog",
        "Черга",
        "To Do",
        "Нові задачі",
        "",
        "   ",
        undefined,
      ];
      for (const name of backlogNames) {
        const res = getStatusSemantic(name);
        assert.equal(res.key, "backlog", `Failed for name: ${name}`);
        assert.equal(res.label, "Беклог");
        assert.equal(res.colorHex, "#64748b");
      }
    });
  });
});
