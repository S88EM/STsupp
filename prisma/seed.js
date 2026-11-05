const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");

const prisma = new PrismaClient();

function getAdminConfig() {
  let haOptions = {};
  try {
    if (fs.existsSync("/data/options.json")) {
      haOptions = JSON.parse(fs.readFileSync("/data/options.json", "utf8"));
    }
  } catch (e) {}

  return {
    adminEmail: (process.env.ADMIN_EMAIL || haOptions.admin_email || "admin@stsup.local").toLowerCase().trim(),
    adminPassword: process.env.ADMIN_PASSWORD || haOptions.admin_password || "admin123",
    adminName: process.env.ADMIN_NAME || haOptions.admin_name || "Євген",
  };
}

async function main() {
  console.log("Seeding database...");

  const { adminEmail, adminPassword, adminName } = getAdminConfig();

  const passwordHash = bcrypt.hashSync(adminPassword, bcrypt.genSaltSync(10));

  // 1. Create or update default admin user with initial password hash and verified email
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        passwordHash,
        role: "ADMIN",
        isEmailVerified: true,
      },
    });
  } else {
    admin = await prisma.user.update({
      where: { id: admin.id },
      data: {
        passwordHash: admin.passwordHash || passwordHash,
        isEmailVerified: true,
        role: "ADMIN",
      },
    });
  }

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

    // Tasks in progress
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

    // Backlog tasks
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

      // New backlog task for SMTP & Admin configuration
      await prisma.task.create({
        data: {
          projectId: project.id,
          columnId: backlogCol.id,
          taskNumber: 4,
          code: "ST-4",
          title: "Налаштування поштового сервера (SMTP) та першого адміна через файл конфігурації",
          description: "1. Читання параметрів SMTP (хост, порт, логін, пароль, SSL) із файлу конфігурації (.env / HA options).\n2. Створення першого користувача (Admin) на основі конфігураційного файлу.\n3. Реєстрація нових користувачів із підтвердженням пошти.\n4. Відновлення та скидання пароля через email-посилання.\n5. Email-сповіщення при зміні статусу, додаванні коментаря чи призначенні задачі.",
          priority: "HIGH",
          creatorId: admin.id,
          subtasks: {
            create: [
              { title: "Додати параметри SMTP та Admin до файлу конфігурації (.env / config.yaml)", isCompleted: false, orderIndex: 0 },
              { title: "Створити поштовий сервіс Nodemailer для відправки листів", isCompleted: false, orderIndex: 1 },
              { title: "Реалізувати форму та API відновлення пароля", isCompleted: false, orderIndex: 2 },
              { title: "Реалізувати відправку сповіщень про події в задачах", isCompleted: false, orderIndex: 3 },
            ],
          },
        },
      });
    }

    // Done tasks
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
