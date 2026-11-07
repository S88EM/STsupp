# STsup — Self-Hosted Service Desk & Jira/Linear Альтернатива

<div align="center">

![STsup Logo](logo.png)

**Сучасна, швидка та ресурсоощадна система управління задачами, проєктами та зверненнями клієнтів (Service Desk).**  
Оптимізована для автономної роботи (Self-Hosted), роботи в локальній мережі, Docker-контейнерах та як Home Assistant Add-on.

[![Version](https://img.shields.io/badge/version-0.4.1-blue.svg)](config.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.23-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.2-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-336791.svg)](https://www.postgresql.org/)
[![Tests](https://img.shields.io/badge/Tests-51%20passing-brightgreen.svg)](tests/)
[![RAM](https://img.shields.io/badge/RAM-~120--150%20MB-orange.svg)](#)

</div>

---

## 📑 Зміст
- [🌟 Ключові можливості](#-ключові-можливості)
- [👥 Рольова модель](#-рольова-модель)
- [🚀 Спосіб 1: Запуск через Docker Compose (Рекомендовано)](#-спосіб-1-запуск-через-docker-compose-рекомендовано)
- [🐧 Спосіб 2: Встановлення на Linux (Ubuntu / Debian / CentOS / Alpine)](#-спосіб-2-встановлення-на-linux-ubuntu--debian--centos--alpine)
- [🪟 Спосіб 3: Встановлення на Windows (без Docker)](#-спосіб-3-встановлення-на-windows-без-docker)
- [🏠 Спосіб 4: Встановлення в Home Assistant (Add-on)](#-спосіб-4-встановлення-в-home-assistant-add-on)
- [🔐 Облікові дані за замовчуванням](#-облікові-дані-за-замовчуванням)
- [⚙️ Системні налаштування](#️-системні-налаштування)
- [🧪 Тестування та перевірка коду](#-тестування-та-перевірка-коду)
- [📄 Ліцензія](#-ліцензія)

---

## 🌟 Ключові можливості

### 1. Професійний 3-панельний інтерфейс у стилі Jira Work Management (`/projects/[id]`)
* **Лівий сайдбар:** структура проєкту, перемикання між задачами, беклогом, канбан-дошкою та налаштуваннями.
* **Центральний список задач:** швидкий живий пошук, фільтрація за компонентами, мітками, статусами та виконавцем.
* **Розгорнута картка задачі:**
  * **Інтерактивний статус-бейдж:** миттєва зміна статусу прямо в картці задачі без потреби відкривати окремі панелі. Семантичні кольори робочого процесу:
    * 🔘 **Беклог** — графітовий/нейтральний сірий;
    * 🔵 **В роботі** — синій;
    * 🟡 **Тестування / Review** — бурштиновий/жовтий;
    * 🟢 **Готово / Закрито** — смарагдово-зелений.
  * **Швидка дія «Повернути до клієнта»:** передача задачі автору звернення в 1 клік, коли потрібні уточнення або робота завершена.
  * **Підтримка крос-проєктного режиму (`projectId = all`):** єдиний агрегований вигляд задач з усіх доступних користувачу проєктів.

### 2. Крос-проєктна Канбан-дошка (`/boards`)
* Гнучкий **Drag & Drop** між колонками з миттєвою синхронізацією з базою даних.
* Повна оптимізація рендерингу (`React.memo`) — плавна робота навіть при сотнях задач.
* Пошук задач на льоту без перезавантаження сторінки.

### 3. Спеціалізований клієнтський портал (`/portal`)
* Окремий мінімалістичний кабінет для клієнтів (`CLIENT`).
* Подання інцидентів та сервісних запитів у кілька кліків.
* Приховано технічні блоки, розрахунок витраченого часу інженерів та внутрішні оцінки.
* Прямий діалог з інженерами підтримки через коментарі та вкладення файлів.

### 4. Внутрішній облік часу інженерів (Original Estimate)
* Відмова від абстрактних Story Points на користь точної оцінки часу.
* Підтримка гнучких форматів введення: `2d 4h`, `30m`, `1w`, `2mo` (автоматичний парсер тривалості).
* Динамічний блок обліку часу: розрахунок залишку, відсоток прогресу та підрахунок переліміту при перевитраті часу.
* Повна ізоляція: дані обліку часу автоматично приховуються від ролі `CLIENT` на рівні API та інтерфейсу.

### 5. Telegram-бот та SMTP сповіщення
* **Telegram Bot:** миттєві сповіщення про створення задач, зміну статусів, призначення відповідального та нові коментарі. Тестування зв'язку прямо з веб-інтерфейсу (`/settings?tab=telegram`).
* **SMTP Email:** надійна відправка листів через будь-який поштовий сервер (Gmail, Ukr.net, корпоративний SMTP), функція відновлення забутого пароля через безпечні одноразові токени.

### 6. Керування довідниками (`/settings?tab=dictionaries`)
* Фіксовані списки компонентів за типами задач (*Баг*, *Задача*, *Історія*, *Покращення*, *Підтримка*).
* Можливість задавати унікальні компоненти під окремі проєкти або використовувати глобальні списки.
* Перелік глобальних міток (labels).
* Кешування довідників у пам'яті клієнта та сервера для максимальної швидкодії.

### 7. Безпека, аудит та бекапи
* **Журнал аудиту дій (`AuditLog`):** фіксація змін паролів, редагування ролей, експорту/відновлення даних.
* **Повний Backup & Restore системи (`.stsup` gzip-архіви):**
  * **Експорт:** вивантаження всіх користувачів, проєктів, задач, коментарів, конфігурацій та файлів у єдиний стиснений файл.
  * **Відновлення:** валідація цілісності, безпечне підтвердження словом `ВІДНОВИТИ`, атомарне перезаписування бази у Prisma `$transaction` та розпакування вкладень.

---

## 👥 Рольова модель

| Можливість / Дія | `ADMIN` | `ENGINEER` | `CLIENT` |
|:---|:---:|:---:|:---:|
| Доступ до системних налаштувань (`/settings`) та бекапів | ✅ | ❌ | ❌ |
| Керування користувачами та ролями (`/users`) | ✅ | ❌ | ❌ |
| Створення проєктів та колонок дошки | ✅ | ❌ | ❌ |
| Робота з задачами у призначених проєктах | ✅ | ✅ | ❌ |
| Зміна статусів задач та Drag & Drop | ✅ | ✅ | ❌ |
| Внутрішній облік часу (Original Estimate) | ✅ | ✅ | ❌ *(приховано)* |
| Доступ до клієнтського порталу (`/portal`) | ✅ | ✅ | ✅ |
| Створення звернення (потрапляє в Беклог) | ✅ | ✅ | ✅ |
| Коментарі та додавання файлів | ✅ | ✅ | ✅ |

---

## 🚀 Спосіб 1: Запуск через Docker Compose (Рекомендовано)

Найпростіший та найнадійніший спосіб запуску на будь-якій системі (**Linux**, **Windows**, **macOS**).  
Контейнер STsup є повністю самодостатнім: він містить оптимізований multi-stage образ на базі Alpine з вбудованим PostgreSQL. Вам **не потрібно** окремо піднімати зовнішню базу даних!

### 1. Клонуйте репозиторій:
```bash
git clone https://github.com/S88EM/STsupp.git
cd STsupp
```

### 2. Запустіть контейнер:
```bash
docker compose up -d --build
```

### 3. Відкрийте браузер:
👉 **[http://localhost:3000](http://localhost:3000)**

*Усі дані (база даних, файли, налаштування) автоматично та надійно зберігаються у Docker Volume `stdata`.*

#### Корисні команди для керування:
```bash
# Перегляд логів у реальному часі
docker compose logs -f

# Зупинка системи
docker compose down

# Оновлення до найновішої версії з GitHub
git pull origin main
docker compose up -d --build
```

---

## 🐧 Спосіб 2: Встановлення на Linux (Ubuntu / Debian / CentOS / Alpine)

Цей спосіб підходить для прямого розгортання на VPS або виділеному сервері під керуванням Linux.

### Системні вимоги:
* **ОС:** Ubuntu 20.04/22.04/24.04, Debian 11/12 або аналогічні
* **Node.js:** v18.18+ або v20+ (рекомендовано LTS)
* **PostgreSQL:** версія 14 або новіша
* **RAM:** від 512 МБ (STsup споживає лише ~120-150 МБ)

---

### Крок 1. Встановлення Node.js та PostgreSQL

#### Для Ubuntu / Debian:
```bash
# Оновлення пакетів
sudo apt update && sudo apt upgrade -y

# Встановлення PostgreSQL та Git
sudo apt install -y git curl build-essential postgresql postgresql-contrib

# Встановлення Node.js 20 LTS через NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Перевірка версій
node -v
npm -v
psql --version
```

---

### Крок 2. Налаштування PostgreSQL

Створіть користувача та базу даних для STsup:
```bash
sudo -u postgres psql
```

У консолі PostgreSQL виконайте SQL-команди:
```sql
CREATE USER stuser WITH PASSWORD 'stpassword_strong_here';
CREATE DATABASE stsup_db OWNER stuser;
GRANT ALL PRIVILEGES ON DATABASE stsup_db TO stuser;
\q
```

---

### Крок 3. Клонування репозиторію та встановлення залежностей

```bash
cd /var/www  # або будь-яка інша робоча папка
sudo git clone https://github.com/S88EM/STsupp.git stsup
cd stsup
sudo chown -R $USER:$USER /var/www/stsup

# Встановлення залежностей
npm install
```

---

### Крок 4. Налаштування файлу оточення `.env`

Створіть файл `.env`:
```bash
cp .env.example .env
nano .env
```

Заповніть конфігурацію:
```env
# Рядок підключення до PostgreSQL
DATABASE_URL="postgresql://stuser:stpassword_strong_here@localhost:5432/stsup_db?schema=public"

# Налаштування порту та адреси
PORT=3000
NODE_ENV=production
NEXTAUTH_URL="http://your-server-ip:3000"
NEXTAUTH_SECRET="your_very_secret_jwt_random_key_here"

# Початковий адміністратор
ADMIN_EMAIL="admin@stsup.local"
ADMIN_PASSWORD="Gorik555"
ADMIN_NAME="Адміністратор"
```

---

### Крок 5. Ініціалізація бази даних та збірка проєкту

```bash
# Генерація клієнта Prisma та створення таблиць
npx prisma generate
npx prisma db push

# (Опціонально) Заповнення початкового демо-проєкту
node prisma/seed.js

# Збірка додатку для продакшену
npm run build
```

---

### Крок 6. Налаштування автозапуску через Systemd (24/7 у фоні)

Створіть системну службу:
```bash
sudo nano /etc/systemd/system/stsup.service
```

Вставте конфігурацію (замініть `your_user` на вашого системного користувача, а шлях — на реальний):
```ini
[Unit]
Description=STsup Task Tracker Service
After=network.target postgresql.service

[Service]
Type=simple
User=your_user
WorkingDirectory=/var/www/stsup
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Активуйте та запустіть службу:
```bash
sudo systemctl daemon-reload
sudo systemctl enable stsup
sudo systemctl start stsup

# Перевірка статусу
sudo systemctl status stsup
```

---

### Крок 7. (Рекомендовано) Налаштування Nginx Reverse Proxy та SSL

Створіть конфіг Nginx:
```bash
sudo nano /etc/nginx/sites-available/stsup
```

Вставте:
```nginx
server {
    listen 80;
    server_name support.yourdomain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Активуйте сайт та підключіть безкоштовний SSL-сертифікат від Let's Encrypt:
```bash
sudo ln -s /etc/nginx/sites-available/stsup /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Отримання безкоштовного HTTPS сертифіката
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d support.yourdomain.com
```

---

## 🪟 Спосіб 3: Встановлення на Windows (без Docker)

Якщо ви використовуєте **Windows 10, Windows 11** або **Windows Server** і бажаєте запустити STsup нативно без віртуалізації Docker Desktop.

### Крок 1. Встановлення необхідного ПЗ
1. **Node.js (v20+ LTS):** Завантажте інсталятор з офіційного сайту [nodejs.org](https://nodejs.org/) та встановіть (перевірте галочку *Add to PATH*).
2. **PostgreSQL для Windows:** Завантажте інсталятор версії 14 або 16 з [postgresql.org/download/windows](https://www.postgresql.org/download/windows/). Під час встановлення запам'ятайте пароль користувача `postgres` (наприклад, `postgres`).
3. **Git for Windows:** Завантажте з [git-scm.com](https://git-scm.com/).

---

### Крок 2. Створення бази даних у PostgreSQL
Відкрийте **PowerShell** від імені адміністратора або відкрийте утиліту **SQL Shell (psql)**, яка встановлюється разом з PostgreSQL:
```sql
CREATE USER stuser WITH PASSWORD 'stpassword';
CREATE DATABASE stsup_db OWNER stuser;
GRANT ALL PRIVILEGES ON DATABASE stsup_db TO stuser;
```

---

### Крок 3. Клонування репозиторію та встановлення пакета
Відкрийте термінал **PowerShell**:
```powershell
# Перейдіть у бажану директорію, наприклад C:\Projects
cd C:\Projects

# Клонуйте проєкт
git clone https://github.com/S88EM/STsupp.git
cd STsupp

# Встановіть npm-залежності
npm install
```

---

### Крок 4. Створення конфігурації `.env`
У корені папки `STsupp` створіть файл `.env`:
```powershell
Copy-Item .env.example .env
notepad .env
```

Вкажіть ваші параметри доступу:
```env
DATABASE_URL="postgresql://stuser:stpassword@localhost:5432/stsup_db?schema=public"
PORT=3000
NODE_ENV=production
NEXTAUTH_SECRET="windows_super_secret_jwt_key_2026"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@stsup.local"
ADMIN_PASSWORD="Gorik555"
ADMIN_NAME="Адміністратор"
```

---

### Крок 5. Застосування міграцій та збірка
У вікні PowerShell виконайте:
```powershell
# Генерація схеми Prisma
npx prisma generate

# Застосування схеми до бази даних
npx prisma db push

# (Опціонально) Заповнення тестовими даними
node prisma/seed.js

# Продакшн-збірка проекту
npm run build
```

---

### Крок 6. Запуск сервера

#### Простий запуск через консоль:
```powershell
npm start
```
Сервер запуститься за адресою: 👉 **`http://localhost:3000`**

#### Надійний запуск у фоні 24/7 через PM2 (рекомендовано для Windows):
Щоб консольне вікно не залишалося відкритим і додаток автоматично перезапускався при перезавантаженні Windows:
```powershell
# Встановлення менеджера процесів PM2
npm install -g pm2
npm install -g pm2-windows-startup

# Налаштування автозапуску у системі
pm2-startup install

# Запуск STsup у фоні
pm2 start npm --name "stsup" -- start

# Збереження списку процесів
pm2 save
```
Тепер STsup працює у фоні як системний фоновий процес Windows.  
Команди перевірки: `pm2 status`, `pm2 logs stsup`, `pm2 restart stsup`.

---

## 🏠 Спосіб 4: Встановлення в Home Assistant (Add-on)

Завдяки наднизькому споживанню RAM (~120 МБ) STsup ідеально підходить для запуску на домашніх серверах та мікрокомп'ютерах (Raspberry Pi 4/5, Intel NUC, Home Assistant Green/Yellow).

### Встановлення за 1 хвилину:
1. У веб-інтерфейсі Home Assistant перейдіть: **Налаштування (Settings)** $\rightarrow$ **Додатки (Add-ons)** $\rightarrow$ **Магазин додатків (Add-on Store)**.
2. У правому верхньому кутку натисніть меню з трьома крапками (`⋮`) $\rightarrow$ виберіть **Репозиторії (Repositories)**.
3. Додайте URL нашого репозиторію:
   ```text
   https://github.com/S88EM/STsupp
   ```
4. Натисніть **Додати (Add)** та оновіть сторінку магазину.
5. Знайдіть **STsup** у списку, натисніть **Встановити (Install)**.
6. На вкладці **Конфігурація (Configuration)** за бажанням задайте свій часовий пояс чи пароль адміністратора.
7. Натисніть **Запустити (Start)** та **Відкрити веб-інтерфейс (Open Web UI)**.

*База даних PostgreSQL вже вбудована всередину Add-on, а всі дані автоматично зберігаються в `/data` та потрапляють у стандартні бекапи Home Assistant.*

---

## 🔐 Облікові дані за замовчуванням

Після першого запуску системи автоматично створюється обліковий запис головного адміністратора:

* **URL системи:** `http://localhost:3000` (або IP вашого сервера)
* **Email:** `admin@stsup.local`
* **Пароль:** `Gorik555`

> **Порада щодо безпеки:** Після першого входу обов'язково перейдіть у меню **«Користувачі та права»** (`/users`) або свій профіль та змініть стандартний пароль на власний надійний пароль.

---

## ⚙️ Системні налаштування

Панель адміністрування розташована за адресою `/settings`:
* **SMTP:** налаштування відправки email-сповіщень клієнтам та інженерам з тестуванням з'єднання.
* **Telegram:** підключення бота та чату для сповіщень про події в проєктах.
* **Довідники:** конфігурація компонентів за типами й проєктами, глобальні мітки.
* **Журнал аудиту:** повний реєстр подій безпеки.
* **Резервне копіювання:** створення `.stsup` бекапів у 1 клік та повне відновлення системи.

---

## 🧪 Тестування та перевірка коду

Проєкт повністю покритий автоматизованими тестами (Node.js test runner) та суворо типізований через TypeScript:

```bash
# Запуск автоматизованих тестів (51 тест)
npm test

# Перевірка типів TypeScript
npx tsc --noEmit
```

---

## 📄 Ліцензія

Розповсюджується під ліцензією [MIT](LICENSE). Відкритий вихідний код для вільного використання у власних або корпоративних цілях.
