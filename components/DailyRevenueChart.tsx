import styles from "./DailyRevenueChart.module.css";

const brl=(n:any)=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

export function DailyRevenueChart({data}:any){
 const days=data?.days||[],values=days.map((x:any)=>Number(x.revenue||0)),max=Math.max(1,...values);
 const width=Math.max(720,days.length*34),height=250,pad=28,base=height-pad;
 const point=(x:any,i:number)=>({x:pad+i*((width-pad*2)/Math.max(1,days.length-1)),y:base-(Number(x.revenue||0)/max)*(height-pad*2)});
 const line=days.map((x:any,i:number)=>{const p=point(x,i);return p.x+","+p.y}).join(" ");
 return <section className={styles.card}>
  <div className={styles.head}><div><small>FATURAMENTO DIÁRIO</small><h2>{data?.label||"Mês atual"}</h2><p>Venda reconhecida no dia em que aconteceu, inclusive itens comprados em competências anteriores.</p></div><div><small>TOTAL DO MÊS</small><strong>{brl(data?.total)}</strong><span>{days.filter((x:any)=>x.revenue>0).length} dia(s) com venda</span></div></div>
  <div className={styles.scroller}><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfico diário de faturamento">
   {[0,.25,.5,.75,1].map(v=><line key={v} x1={pad} x2={width-pad} y1={base-v*(height-pad*2)} y2={base-v*(height-pad*2)} className={styles.grid}/>)}
   <polyline points={line} className={styles.line}/>
   {days.map((x:any,i:number)=>{const p=point(x,i),barW=Math.max(7,Math.min(15,(width-pad*2)/Math.max(1,days.length)*.5)),up=x.direction!=="down";return <g key={x.date}><title>{x.dateLabel}: {brl(x.revenue)}{x.notes?.length?" — "+x.notes.join("; "):""}</title><line x1={p.x} x2={p.x} y1={base} y2={p.y} className={up?styles.wickUp:styles.wickDown}/><rect x={p.x-barW/2} y={Math.min(p.y,base-3)} width={barW} height={Math.max(3,base-p.y)} rx="2" className={up?styles.up:styles.down}/><circle cx={p.x} cy={p.y} r="3" className={styles.point}/>{(i%Math.ceil(days.length/10||1)===0||i===days.length-1)&&<text x={p.x} y={height-7} textAnchor="middle">{x.day}</text>}</g>})}
  </svg></div>
  <div className={styles.legend}><span><i className={styles.green}/>Maior ou igual ao dia anterior</span><span><i className={styles.red}/>Menor que o dia anterior</span><span><i className={styles.cyan}/>Linha do faturamento diário</span></div>
  {data?.foreignCompetenceSales?.length>0&&<div className={styles.notes}><b>Vendas de outras competências neste mês</b>{data.foreignCompetenceSales.map((x:any)=><span key={x.saleId}><strong>{x.name}</strong> — item de {x.purchaseMonthLabel}, vendido em {x.saleDateLabel} por {brl(x.netValue)}</span>)}</div>}
 </section>
}
