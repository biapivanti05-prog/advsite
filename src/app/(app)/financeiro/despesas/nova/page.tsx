import { getCurrentMembership } from "@/server/permissions";
import { db } from "@/server/db";
import { createExpense } from "@/server/actions/finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Button, ButtonLink } from "@/components/ui/button";
import { EXPENSE_STATUS_LABELS } from "@/lib/labels";

export default async function NewExpensePage() {
  const membership = await getCurrentMembership();
  const [categories, vendors] = await Promise.all([
    db.budgetCategory.findMany({ where: { weddingId: membership.weddingId }, orderBy: { name: "asc" } }),
    db.vendor.findMany({ where: { weddingId: membership.weddingId }, orderBy: { companyName: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Nova despesa</CardTitle></CardHeader>
        <CardContent>
          <form action={createExpense} className="space-y-4">
            <Field label="Descrição">
              <Input name="description" required placeholder="Ex: Aluguel do espaço" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Categoria">
                <Select name="categoryId" defaultValue="">
                  <option value="">Sem categoria</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Fornecedor">
                <Select name="vendorId" defaultValue="">
                  <option value="">Sem fornecedor</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{v.companyName}</option>)}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Valor original (R$)"><Input name="originalAmount" required inputMode="decimal" placeholder="0,00" /></Field>
              <Field label="Desconto (R$)"><Input name="discount" inputMode="decimal" placeholder="0,00" /></Field>
              <Field label="Acréscimos (R$)"><Input name="extraCharges" inputMode="decimal" placeholder="0,00" /></Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Status">
                <Select name="status" defaultValue="ESTIMATED">
                  {Object.entries(EXPENSE_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              </Field>
              <Field label="1º vencimento"><Input name="dueDate" type="date" /></Field>
              <Field label="Nº de parcelas" hint="Divide o valor final igualmente, mensal">
                <Input name="installmentCount" type="number" min={1} defaultValue={1} />
              </Field>
            </div>

            <Field label="Observações">
              <Textarea name="notes" rows={2} />
            </Field>

            <div className="flex items-center gap-2 pt-2">
              <Button type="submit">Criar despesa</Button>
              <ButtonLink href="/financeiro" variant="ghost">Cancelar</ButtonLink>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
