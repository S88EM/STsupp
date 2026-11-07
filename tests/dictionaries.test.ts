import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  getTaskDictionaries,
  getProjectComponents,
  DEFAULT_TASK_DICTIONARIES,
  TaskDictionaries,
} from "../src/lib/dictionaries";

describe("dictionaries utility", () => {
  describe("getTaskDictionaries", () => {
    test("returns dictionary structure with all default task types and labels", () => {
      const dict = getTaskDictionaries();
      assert.ok(dict.componentsByType);
      assert.ok(dict.componentsByType.TASK.length > 0);
      assert.ok(dict.componentsByType.BUG.length > 0);
      assert.ok(dict.componentsByType.STORY.length > 0);
      assert.ok(dict.componentsByType.IMPROVEMENT.length > 0);
      assert.ok(dict.componentsByType.SUPPORT.length > 0);
      assert.ok(Array.isArray(dict.labels));
      assert.ok(dict.labels.includes("urgent"));
    });
  });

  describe("getProjectComponents", () => {
    const mockDict: TaskDictionaries = {
      componentsByType: {
        TASK: ["Загальний модуль 1", "Загальний модуль 2"],
        BUG: ["UI баг", "API баг"],
        STORY: [],
        IMPROVEMENT: [],
        SUPPORT: [],
      },
      componentsByProject: {
        "proj-special": {
          TASK: ["Спеціальний компонент А", "Спеціальний компонент Б"],
        },
      },
      labels: ["label-1"],
    };

    test("returns project-specific components if project override exists", () => {
      const comps = getProjectComponents(mockDict, "proj-special", "TASK");
      assert.deepEqual(comps, ["Спеціальний компонент А", "Спеціальний компонент Б"]);
    });

    test("falls back to global componentsByType if project has no override", () => {
      const comps = getProjectComponents(mockDict, "other-project", "TASK");
      assert.deepEqual(comps, ["Загальний модуль 1", "Загальний модуль 2"]);
    });

    test("falls back to global componentsByType if projectId is null/undefined", () => {
      const comps = getProjectComponents(mockDict, null, "BUG");
      assert.deepEqual(comps, ["UI баг", "API баг"]);
    });

    test("falls back to DEFAULT_TASK_DICTIONARIES if type not present in custom dictionary", () => {
      const emptyDict: TaskDictionaries = {
        componentsByType: {
          TASK: [],
          BUG: [],
          STORY: [],
          IMPROVEMENT: [],
          SUPPORT: [],
        },
        componentsByProject: {},
        labels: [],
      };
      const comps = getProjectComponents(emptyDict, null, "SUPPORT");
      assert.ok(Array.isArray(comps));
      // Should fall back to DEFAULT_TASK_DICTIONARIES.componentsByType.SUPPORT
      assert.ok(comps.length > 0);
      assert.ok(comps.includes("Консультація"));
    });
  });
});
