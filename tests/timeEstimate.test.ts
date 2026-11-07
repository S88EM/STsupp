import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  parseDurationToMinutes,
  parseDurationToHours,
  formatMinutesToDuration,
  formatDurationHumanMinutes,
  formatDurationHuman,
  isValidDuration,
  normalizeDurationInput,
  TIME_PRESETS,
} from "../src/lib/timeEstimate";

describe("timeEstimate utility", () => {
  describe("parseDurationToMinutes", () => {
    test("handles null, empty, or whitespace", () => {
      assert.equal(parseDurationToMinutes(null), 0);
      assert.equal(parseDurationToMinutes(undefined), 0);
      assert.equal(parseDurationToMinutes(""), 0);
      assert.equal(parseDurationToMinutes("   "), 0);
    });

    test("parses minutes accurately without confusing with months", () => {
      assert.equal(parseDurationToMinutes("30m"), 30);
      assert.equal(parseDurationToMinutes("15min"), 15);
      assert.equal(parseDurationToMinutes("45хв"), 45);
      assert.equal(parseDurationToMinutes("1m"), 1);
    });

    test("parses hours", () => {
      assert.equal(parseDurationToMinutes("1h"), 60);
      assert.equal(parseDurationToMinutes("4h"), 240);
      assert.equal(parseDurationToMinutes("2год"), 120);
      assert.equal(parseDurationToMinutes("0.5h"), 30);
    });

    test("parses days (8h working day = 480m)", () => {
      assert.equal(parseDurationToMinutes("1d"), 480);
      assert.equal(parseDurationToMinutes("2d"), 960);
      assert.equal(parseDurationToMinutes("1дн"), 480);
      assert.equal(parseDurationToMinutes("1д"), 480);
    });

    test("parses weeks (5d = 40h = 2400m)", () => {
      assert.equal(parseDurationToMinutes("1w"), 2400);
      assert.equal(parseDurationToMinutes("2w"), 4800);
      assert.equal(parseDurationToMinutes("1тиж"), 2400);
    });

    test("parses months (4w = 160h = 9600m)", () => {
      assert.equal(parseDurationToMinutes("1mo"), 9600);
      assert.equal(parseDurationToMinutes("1міс"), 9600);
      assert.equal(parseDurationToMinutes("1month"), 9600);
    });

    test("parses combined duration strings", () => {
      assert.equal(parseDurationToMinutes("4h 30m"), 270);
      assert.equal(parseDurationToMinutes("1d 2h"), 600);
      assert.equal(parseDurationToMinutes("1w 1d 4h 30m"), 2400 + 480 + 240 + 30);
    });

    test("fallback: bare numbers parsed as hours", () => {
      assert.equal(parseDurationToMinutes("4"), 240);
      assert.equal(parseDurationToMinutes("1.5"), 90);
    });
  });

  describe("parseDurationToHours", () => {
    test("converts durations to decimal hours", () => {
      assert.equal(parseDurationToHours("4h"), 4);
      assert.equal(parseDurationToHours("30m"), 0.5);
      assert.equal(parseDurationToHours("1d"), 8);
    });
  });

  describe("formatMinutesToDuration", () => {
    test("formats 0 or negative to '0h'", () => {
      assert.equal(formatMinutesToDuration(0), "0h");
      assert.equal(formatMinutesToDuration(-10), "0h");
    });

    test("formats minutes accurately", () => {
      assert.equal(formatMinutesToDuration(30), "30m");
      assert.equal(formatMinutesToDuration(45), "45m");
    });

    test("formats hours and mixed minutes", () => {
      assert.equal(formatMinutesToDuration(60), "1h");
      assert.equal(formatMinutesToDuration(240), "4h");
      assert.equal(formatMinutesToDuration(210), "3h 30m");
    });

    test("formats days, weeks, months", () => {
      assert.equal(formatMinutesToDuration(480), "1d");
      assert.equal(formatMinutesToDuration(510), "1d 30m");
      assert.equal(formatMinutesToDuration(2400), "1w");
      assert.equal(formatMinutesToDuration(9600), "1mo");
    });
  });

  describe("formatDurationHumanMinutes", () => {
    test("formats human-readable Ukrainian duration strings", () => {
      assert.equal(formatDurationHumanMinutes(0), "0 год");
      assert.equal(formatDurationHumanMinutes(30), "30 хв");
      assert.equal(formatDurationHumanMinutes(60), "1 год");
      assert.equal(formatDurationHumanMinutes(210), "3 год 30 хв");
      assert.equal(formatDurationHumanMinutes(240), "4 год");
      assert.equal(formatDurationHumanMinutes(480), "1 дн");
      assert.equal(formatDurationHumanMinutes(2400), "1 тиж");
      assert.equal(formatDurationHumanMinutes(9600), "1 міс");
    });
  });

  describe("Time Tracking Scenario (4h estimate, 30m spent)", () => {
    test("calculates remaining time, percentage, and dynamic total correctly", () => {
      const estimate = "4h";
      const spent = "30m";

      const estimateMinutes = parseDurationToMinutes(estimate);
      const spentMinutes = parseDurationToMinutes(spent);

      assert.equal(estimateMinutes, 240);
      assert.equal(spentMinutes, 30);

      // Remaining: 4h - 30m = 3h 30m (210m)
      const remainingMinutes = Math.max(0, estimateMinutes - spentMinutes);
      assert.equal(remainingMinutes, 210);
      assert.equal(formatMinutesToDuration(remainingMinutes), "3h 30m");

      // Progress: (30 / 240) * 100 = 12.5%
      const percentSpent = (spentMinutes / estimateMinutes) * 100;
      assert.equal(percentSpent, 12.5);

      // Total indicator: within estimate, shows estimate (4 год)
      const totalEffectiveMinutes = Math.max(estimateMinutes, spentMinutes);
      assert.equal(totalEffectiveMinutes, 240);
      assert.equal(formatDurationHumanMinutes(totalEffectiveMinutes), "4 год");
    });

    test("calculates overspent time correctly (4h estimate, 5h spent)", () => {
      const estimate = "4h";
      const spent = "5h";

      const estimateMinutes = parseDurationToMinutes(estimate);
      const spentMinutes = parseDurationToMinutes(spent);

      assert.equal(estimateMinutes, 240);
      assert.equal(spentMinutes, 300);

      // Remaining: 0h
      const remainingMinutes = Math.max(0, estimateMinutes - spentMinutes);
      assert.equal(remainingMinutes, 0);
      assert.equal(formatMinutesToDuration(remainingMinutes), "0h");

      // Progress: (300 / 240) * 100 = 125%
      const percentSpent = (spentMinutes / estimateMinutes) * 100;
      assert.equal(percentSpent, 125);

      // Overspent: 60m = 1h
      const overspentMinutes = spentMinutes - estimateMinutes;
      assert.equal(overspentMinutes, 60);
      assert.equal(formatMinutesToDuration(overspentMinutes), "1h");

      // Total indicator: dynamic to spent time (5 год)
      const totalEffectiveMinutes = Math.max(estimateMinutes, spentMinutes);
      assert.equal(totalEffectiveMinutes, 300);
      assert.equal(formatDurationHumanMinutes(totalEffectiveMinutes), "5 год");
    });
  });

  describe("isValidDuration & normalizeDurationInput", () => {
    test("validates valid and invalid formats", () => {
      assert.equal(isValidDuration("4h"), true);
      assert.equal(isValidDuration("30m"), true);
      assert.equal(isValidDuration("1d"), true);
      assert.equal(isValidDuration("1w"), true);
      assert.equal(isValidDuration("1mo"), true);
      assert.equal(isValidDuration("4"), true);
      assert.equal(isValidDuration(""), false);
      assert.equal(isValidDuration("abc"), false);
    });

    test("normalizes inputs", () => {
      assert.equal(normalizeDurationInput("4"), "4h");
      assert.equal(normalizeDurationInput("30m"), "30m");
      assert.equal(normalizeDurationInput("210m"), "3h 30m");
    });
  });
});
