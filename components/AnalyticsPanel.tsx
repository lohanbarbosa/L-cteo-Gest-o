import { useState } from "react";
import { Button } from "./Button";
import styles from "./AnalyticsPanel.module.css";

const brl = (value: unknown) =>
  Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const insightValue = (item: any) => {
  if (typeof item.value !== "number") return item.value;
  if (item.type === "margin") return item.value.toFixed(1) + "%";
  return brl(item.value);
};

export function AnalyticsPanel({ d, open }: { d: any; open: (value: any) => void }) {
  const rows = d.groupAnalytics;
  const [selectedMonth, setSelectedMonth] = useState(d.monthlyAnalytics?.[0]?.month || "");
  const monthly = d.monthlyAnalytics?.find((item: any) => item.month === selectedMonth) || d.monthlyAnalytics?.[0];

  return (
    <>
      <section className={styles.insights}>
        {d.insights.length ? (
          d.insights.map((item: any) => (
            <article key={item.title}>
              <small>{item.title}</small>
              <b>{item.group}</b>
              <strong>{insightValue(item)}</strong>
            </article>
          ))
        ) : (
          <article>
            <small>INTELIGÊNCIA DE GIRO</small>
            <b>Aguardando histórico</b>
            <strong>Cadastre grupos e vendas</strong>
          </article>
        )}
      </section>

      {monthly && (
        <section className={styles.panel}>
          <div className={styles.head}>
            <div>
              <h2>Resultado por mês de compra</h2>
              <p>A venda permanece na competência em que o item foi comprado, mesmo se ocorrer depois.</p>
            </div>
            <label className={styles.monthPicker}>
              Competência
              <select value={monthly.month} onChange={(event) => setSelectedMonth(event.target.value)}>
                {d.monthlyAnalytics.map((item: any) => (
                  <option value={item.month} key={item.month}>{item.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.monthCards}>
            <article><small>LUCRO REALIZADO</small><strong>{brl(monthly.realizedProfit)}</strong><span>{monthly.sold} itens vendidos</span></article>
            <article className={styles.pendingCard}><small>LUCRO PROJETADO PENDENTE</small><strong>{brl(monthly.projectedProfit)}</strong><span>{monthly.inStock} itens ainda em estoque</span></article>
            <article><small>LUCRO TOTAL ESPERADO</small><strong>{brl(monthly.totalExpectedProfit)}</strong><span>Realizado + projetado</span></article>
            <article><small>FATURAMENTO ESPERADO</small><strong>{brl(monthly.totalExpectedRevenue)}</strong><span>{brl(monthly.realizedRevenue)} já realizado</span></article>
          </div>

          <div className={styles.monthNote}>
            <b>{monthly.purchased} itens comprados em {monthly.label}</b>
            <span>{monthly.soldInLaterMonth} vendidos em mês posterior · {monthly.inStock} em estoque{monthly.pendingSaleRegistration ? ` · ${monthly.pendingSaleRegistration} vendas aguardando dados` : ""}</span>
          </div>

          <div className={styles.table}>
            <table>
              <thead><tr><th>ITEM</th><th>COMPRA</th><th>VENDA</th><th>DIAS</th><th>RESULTADO</th><th>SITUAÇÃO</th></tr></thead>
              <tbody>
                {monthly.items.map((item: any) => (
                  <tr key={item.id}>
                    <td><b>{item.name}</b><small>{item.internalCode}</small></td>
                    <td>{new Date(item.purchaseDate).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</td>
                    <td>{item.saleDate ? new Date(item.saleDate).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—"}</td>
                    <td>{item.inventoryDays} dias</td>
                    <td><b>{item.profit === null ? "Aguardando dados" : brl(item.profit)}</b><small>{item.status === "sold" ? "lucro realizado" : item.status === "sale_pending" ? "registre a venda" : "lucro projetado"}</small></td>
                    <td><span className={item.status === "sold" ? styles.done : styles.pending}>{item.status === "sold" ? "Vendido" : item.status === "sale_pending" ? "Venda pendente" : "Em estoque"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className={styles.panel}>
        <div className={styles.head}>
          <div>
            <h2>Desempenho por grupo</h2>
            <p>Modelos e variações são consolidados conforme o grupo escolhido no cadastro</p>
          </div>
          <Button onClick={() => open({ type: "group" })}>+ Criar grupo</Button>
        </div>

        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>GRUPO</th>
                <th>COMPRADOS</th>
                <th>VENDIDOS</th>
                <th>GIRO MÉDIO</th>
                <th>LUCRO TOTAL</th>
                <th>LUCRO MÉDIO</th>
                <th>MARGEM</th>
                <th>CAPITAL EM ESTOQUE</th>
                <th>CONVERSÃO</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row: any) => (
                  <tr key={row.id}>
                    <td><b>{row.name}</b><small>{row.description || "Grupo personalizado"}</small></td>
                    <td>{row.purchased}</td>
                    <td>{row.sold}</td>
                    <td>
                      <b>{row.averageDaysSold === null ? "Sem vendas" : row.averageDaysSold + " dias"}</b>
                      <small>{row.averageActiveDays ? row.averageActiveDays + " dias nos itens ativos" : ""}{row.pendingSaleRegistration ? ` · ${row.pendingSaleRegistration} vendas sem dados` : ""}</small>
                    </td>
                    <td>{brl(row.totalProfit)}</td>
                    <td>{brl(row.averageProfit)}</td>
                    <td>{row.margin.toFixed(1)}%</td>
                    <td>{brl(row.inventoryCapital)}</td>
                    <td>{row.sellThrough.toFixed(0)}%</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={9} className={styles.empty}>Crie grupos e classifique os produtos para iniciar a comparação.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.grid}>
        <article className={styles.panel}>
          <h2>Como interpretar</h2>
          <p><b>Giro médio:</b> tempo entre a compra e a venda; quanto menor, melhor.</p>
          <p><b>Conversão:</b> percentual das unidades compradas que já foram vendidas.</p>
          <p><b>Capital em estoque:</b> dinheiro investido que continua preso nos itens ativos.</p>
        </article>
        <article className={styles.panel}>
          <h2>Atenção necessária</h2>
          <strong className={styles.alert}>{d.metrics.slowStock}</strong>
          <p>itens ativos há 30 dias ou mais</p>
          <p>Tempo médio dos vendidos: <b>{d.metrics.averageDaysSold} dias</b></p>
        </article>
      </section>
    </>
  );
}
