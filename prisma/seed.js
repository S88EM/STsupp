const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create default admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@stsup.local" },
    update: {},
    create: {
      email: "admin@stsup.local",
      name: "Олег (Admin)",
      role: "ADMIN",
    },
  });

  // 2. Create demo project
  const existingProject = await prisma.project.findUnique({
    where: { key: "ST" },
  });

  if (!existingProject) {
    const project = await prisma.project.create({
      data: {
        name: "Основний проект підтримки",
        key: "ST",
        description: "Головний беклог та задачі команди",
        ownerId: admin.id,
        columns: {
          create: [
            { name: "Беклог", color: "#64748b", orderIndex: 0, isDoneColumn: false },
            { name: "В роботі", color: "#3b82f6", orderIndex: 1, isDoneColumn: false },
            { name: "Тестування", color: "#eab308", orderIndex: 2, isDoneColumn: false },
            { name: "Готово", color: "#22c55e", orderIndex: 3, isDoneColumn: true },
          ],
        },
        members: {
          create: {
            userId: admin.id,
            role: "ADMIN",
          },
        },
      },
      include: { columns: true },
    });

    const backlogCol = project.columns.find((c) => c.name === "Беклог");
    const inProgressCol = project.columns.find((c) => c.name === "В роботі");
    const doneCol = project.columns.find((c) => c.name === "Готово");

    // Create demo tasks
    if (inProgressCol) {
      await prisma.task.create({
        data: {
          projectId: project.id,
          columnId: inProgressCol.id,
          taskNumber: 1,
          code: "ST-1",
          title: "Підключити Confluence MCP для бази знань",
          description: "Налаштувати JSON-RPC endpoint та протестувати вибірку регламентів.",
          priority: "HIGH",
          creatorId: admin.id,
          assigneeId: admin.id,
          subtasks: {
            create: [
              { title: "Перевірити Confluence API токен", isCompleted: true, orderIndex: 0 },
              { title: "Реалізувати пошуковий запит через MCP", isCompleted: false, orderIndex: 1 },
              { title: "Вивести рекомендації у картці задачі", isCompleted: false, orderIndex: 2 },
            ],
          },
        },
      });
    }

    if (backlogCol) {
      await prisma.task.create({
        data: {
          projectId: project.id,
          columnId: backlogCol.id,
          taskNumber: 2,
          code: "ST-2",
          title: "Розгорнути Docker контейнер на Home Assistant",
          description: "Перевірити роботу образу на ARM64 архітектурі.",
          priority: "MEDIUM",
          creatorId: admin.id,
        },
      });
    }

    if (doneCol) {
      await prisma.task.create({
        data: {
          projectId: project.id,
          columnId: doneCol.id,
          taskNumber: 3,
          code: "ST-3",
          title: "Ініціалізація ядра Kanban системи",
          description: "Створено схему даних, Prisma клієнт та базовий інтерфейс.",
          priority: "LOW",
          creatorId: admin.id,
        },
      });
    }
  }

  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
