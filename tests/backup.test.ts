import { test, describe } from "node:test";
import assert from "node:assert/strict";
import zlib from "zlib";
import { validateSystemBackup, SystemBackupPackage } from "../src/lib/backup";

describe("backup utility", () => {
  const sampleBackup: SystemBackupPackage = {
    version: "1.0.0",
    system: "STsup",
    createdAt: new Date().toISOString(),
    exportedBy: {
      userId: "admin-1",
      email: "admin@test.local",
      name: "Admin User",
    },
    summary: {
      usersCount: 2,
      projectsCount: 1,
      tasksCount: 3,
      subtasksCount: 1,
      commentsCount: 2,
      attachmentsCount: 1,
      auditLogsCount: 5,
      filesCount: 1,
      totalFileSizeBytes: 1024,
      hasSmtpConfig: true,
      hasTelegramConfig: false,
      hasDictionaries: true,
    },
    data: {
      users: [
        { id: "u1", email: "admin@test.local", name: "Admin", role: "ADMIN" },
        { id: "u2", email: "client@test.local", name: "Client", role: "CLIENT" },
      ],
      projects: [{ id: "p1", name: "Project A", key: "PA", ownerId: "u1" }],
      projectMembers: [{ id: "pm1", projectId: "p1", userId: "u1", role: "ADMIN" }],
      columns: [{ id: "c1", projectId: "p1", name: "Беклог", orderIndex: 0, isDoneColumn: false }],
      tasks: [{ id: "t1", projectId: "p1", columnId: "c1", taskNumber: 1, code: "PA-1", title: "Task 1", priority: "HIGH" }],
      subtasks: [],
      comments: [],
      attachments: [],
      aiRecommendations: [],
      taskWatchers: [],
      auditLogs: [],
    },
    settings: {
      smtp: { host: "smtp.example.com", port: 587 },
      telegram: { isEnabled: false },
      dictionaries: { labels: ["v1.0"] },
    },
    files: [
      {
        fileName: "test.txt",
        fileUrl: "/uploads/test.txt",
        mimeType: "text/plain",
        fileSize: 12,
        dataBase64: Buffer.from("Hello backup").toString("base64"),
      },
    ],
  };

  test("validateSystemBackup: rejects empty buffer", () => {
    const res = validateSystemBackup(Buffer.alloc(0));
    assert.equal(res.isValid, false);
    assert.match(res.error || "", /Помилка розбору/);
  });

  test("validateSystemBackup: rejects invalid non-JSON buffer", () => {
    const res = validateSystemBackup(Buffer.from("invalid binary data 12345"));
    assert.equal(res.isValid, false);
    assert.match(res.error || "", /Помилка розбору/);
  });

  test("validateSystemBackup: rejects foreign system package", () => {
    const foreignPkg = { ...sampleBackup, system: "JiraExport" };
    const buf = Buffer.from(JSON.stringify(foreignPkg), "utf8");
    const res = validateSystemBackup(buf);
    assert.equal(res.isValid, false);
    assert.match(res.error || "", /Несумісний тип резервної копії/);
  });

  test("validateSystemBackup: rejects unsupported version", () => {
    const invalidVerPkg = { ...sampleBackup, version: "9.9.9" };
    const buf = Buffer.from(JSON.stringify(invalidVerPkg), "utf8");
    const res = validateSystemBackup(buf);
    assert.equal(res.isValid, false);
    assert.match(res.error || "", /Непідтримувана версія бекапу/);
  });

  test("validateSystemBackup: rejects corrupt payload missing data arrays", () => {
    const corruptPkg = { ...sampleBackup, data: null };
    const buf = Buffer.from(JSON.stringify(corruptPkg), "utf8");
    const res = validateSystemBackup(buf);
    assert.equal(res.isValid, false);
    assert.match(res.error || "", /відсутній розділ даних/);
  });

  test("validateSystemBackup: validates and decompresses gzip .stsup archive", () => {
    const jsonStr = JSON.stringify(sampleBackup);
    const compressed = zlib.gzipSync(Buffer.from(jsonStr, "utf8"));

    const res = validateSystemBackup(compressed);
    assert.equal(res.isValid, true);
    assert.equal(res.version, "1.0.0");
    assert.equal(res.summary?.usersCount, 2);
    assert.equal(res.summary?.projectsCount, 1);
    assert.equal(res.summary?.tasksCount, 3);
    assert.equal(res.summary?.filesCount, 1);
  });

  test("validateSystemBackup: validates uncompressed raw JSON backup", () => {
    const jsonBuf = Buffer.from(JSON.stringify(sampleBackup), "utf8");
    const res = validateSystemBackup(jsonBuf);
    assert.equal(res.isValid, true);
    assert.equal(res.version, "1.0.0");
    assert.equal(res.exportedBy?.email, "admin@test.local");
  });
});
