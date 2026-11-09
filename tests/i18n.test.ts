import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getDictionary, interpolate, translateKey, uk, en } from "../src/lib/i18n";

describe("i18n localization suite", () => {
  it("dictionaries have identical keys across UK and EN", () => {
    const ukSections = Object.keys(uk);
    const enSections = Object.keys(en);

    assert.deepEqual(
      ukSections.sort(),
      enSections.sort(),
      "UK and EN top-level sections must match exactly"
    );

    for (const section of ukSections) {
      const ukKeys = Object.keys((uk as any)[section]).sort();
      const enKeys = Object.keys((en as any)[section]).sort();
      assert.deepEqual(
        ukKeys,
        enKeys,
        `Keys in section '${section}' must be identical in uk and en dictionaries`
      );
    }
  });

  it("getDictionary returns the correct dictionary by locale", () => {
    assert.equal(getDictionary("uk"), uk);
    assert.equal(getDictionary("en"), en);
    // fallback for unknown or invalid locales
    assert.equal(getDictionary("fr" as any), uk);
    assert.equal(getDictionary("" as any), uk);
  });

  it("interpolate replaces template variables correctly", () => {
    const template = "Task {code} assigned to {name}";
    const result = interpolate(template, { code: "RIGA-1", name: "Oleg" });
    assert.equal(result, "Task RIGA-1 assigned to Oleg");

    // Missing parameter leaves token intact
    assert.equal(interpolate("Hello {name}", {}), "Hello {name}");
  });

  it("translateKey resolves nested keys via dot notation", () => {
    assert.equal(translateKey("uk", "common.save"), "Зберегти");
    assert.equal(translateKey("en", "common.save"), "Save");
    assert.equal(translateKey("uk", "statuses.in_progress"), "В роботі");
    assert.equal(translateKey("en", "statuses.in_progress"), "In Progress");
    assert.equal(translateKey("uk", "roles.admin"), "Адміністратор");
    assert.equal(translateKey("en", "roles.admin"), "Administrator");

    // Returns the key itself if path not found
    assert.equal(translateKey("uk", "nonexistent.key"), "nonexistent.key");
  });

  it("validates key localized phrases for standard terminology", () => {
    assert.equal(uk.issue.returnToClient, "Повернути до клієнта");
    assert.equal(en.issue.returnToClient, "Return to Client");

    assert.equal(uk.issue.workTracking, "Облік часу (Work Tracking)");
    assert.equal(en.issue.workTracking, "Work Tracking");

    assert.equal(uk.portal.supportWaitingReply, "Служба підтримки очікує вашої відповіді");
    assert.equal(en.portal.supportWaitingReply, "Support is waiting for your reply");
  });
});
