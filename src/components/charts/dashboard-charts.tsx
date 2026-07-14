"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatBRL } from "@/lib/utils";

const axisStyle = { fontSize: 12, fill: "var(--color-ink-muted)" };

export function BudgetByCategoryChart({
  data,
}: {
  data: { category: string; orcado: number; realizado: number }[];
}) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-muted">Sem dados suficientes ainda.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} stroke="var(--color-gridline)" />
        <XAxis
          type="number"
          tick={axisStyle}
          axisLine={{ stroke: "var(--color-baseline)" }}
          tickLine={false}
          tickFormatter={(v) => `R$ ${Math.round(v / 1000)}k`}
        />
        <YAxis
          type="category"
          dataKey="category"
          tick={axisStyle}
          width={110}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => formatBRL(Number(value))}
          contentStyle={{
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            fontSize: 13,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-ink-secondary)" }} />
        <Bar dataKey="orcado" name="Orçado" fill="var(--color-cat-1)" radius={[0, 4, 4, 0]} maxBarSize={14} />
        <Bar dataKey="realizado" name="Contratado" fill="var(--color-cat-2)" radius={[0, 4, 4, 0]} maxBarSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TasksByStatusChart({ data }: { data: { status: string; count: number }[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-muted">Sem tarefas ainda.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} stroke="var(--color-gridline)" />
        <XAxis type="number" tick={axisStyle} axisLine={{ stroke: "var(--color-baseline)" }} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="status" tick={axisStyle} width={130} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            fontSize: 13,
          }}
        />
        <Bar dataKey="count" name="Tarefas" fill="var(--color-cat-1)" radius={[0, 4, 4, 0]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}
