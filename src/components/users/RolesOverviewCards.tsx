import React from "react";
import { Shield, Wrench, UserCheck } from "lucide-react";

export function RolesOverviewCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-1.5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
          <Shield className="w-4 h-4" />
          <span>Роль: Адміністратор</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Повний доступ до всіх проєктів, задач, конфігурацій, інтеграцій та керування користувачами (включаючи зміну логінів, паролів, статусів та ролей).
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-1.5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <Wrench className="w-4 h-4" />
          <span>Роль: Інженер</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Доступ виключно до тих проєктів, які призначив адміністратор. Робота з задачами, зміна статусів (дошка), відповіді в коментарях, вкладення скріншотів і відео.
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-1.5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
          <UserCheck className="w-4 h-4" />
          <span>Роль: Клієнт</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Доступ виключно до тих проєктів, які призначив адміністратор. Створення задач, опис проблем, додавання скріншотів та коментарів.
        </p>
      </div>
    </div>
  );
}
