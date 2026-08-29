import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import superjson from "superjson";

const dayStamp = (value: any) => { const d = new Date(value); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); };
const days = (a: any, b: any) => Math.max(0, Math.round((dayStamp(b) - dayStamp(a)) / 86400000));
const monthKey = (v: any) => new Date(v).toISOString().slice(0, 7);
const addMonths = (month: string, amount: number) => { const d = new Date(month + "-02T00:00:00Z"); d.setUTCMonth(d.getUTCMonth() + amount); return d.toISOString().slice(0, 7); };
const previousMonth = (month: string) => addMonths(month, -1);
const monthLabel = (month: string) => new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(month + "-02T00:00:00Z"));
const monthsBetween = (start: string, end: string) => { const out: string[] = []; for (let m = start; m <= end; m = addMonths(m, 1)) out.push(m); return out; };

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const url = new URL(request.url);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const personalMonth = url.searchParams.get("month") || currentMonth;
    const businessMonth = url.searchParams.get("businessMonth") || currentMonth;
    const userRow = await db.selectFrom("users").select(["activeBusinessId","avatarUrl"]).where("id", "=", user.id).executeTakeFirstOrThrow();
    const businesses = await db.selectFrom("businesses").selectAll().where("ownerUserId", "=", user.id).where("active", "=", true).orderBy("createdAt").execute();
    const activeBusiness = businesses.find(b => String(b.id) === String(userRow.activeBusinessId)) || businesses[0];
    if (!activeBusiness) throw new Error("Nenhuma empresa cadastrada");
    const businessId = activeBusiness.id;

    const allProducts = await db.selectFrom("products").selectAll().where("ownerUserId", "=", user.id).where("deletedAt", "is", null).orderBy("createdAt", "desc").execute();
    const allCosts = allProducts.length ? await db.selectFrom("productCosts").innerJoin("products", "products.id", "productCosts.productId").select([
      "productCosts.id","productCosts.productId","productCosts.category","productCosts.description","productCosts.amount","productCosts.status","productCosts.incurredOn","productCosts.providerName","productCosts.notes"
    ]).where("products.ownerUserId", "=", user.id).orderBy("productCosts.createdAt", "desc").execute() : [];
    const allSales = await db.selectFrom("sales").innerJoin("products", "products.id", "sales.productId").select([
      "sales.id","sales.productId","sales.businessId","sales.customerName","sales.customerContact","sales.salePrice","sales.discount","sales.fees","sales.soldAt","sales.notes","sales.cancelledAt","products.name","products.internalCode","products.purchasePrice","products.purchaseDate"
    ]).where("sales.ownerUserId", "=", user.id).where("sales.cancelledAt","is",null).orderBy("sales.soldAt", "desc").execute();
    const allFinancialAccounts = await db.selectFrom("financialAccounts").selectAll().where("ownerUserId", "=", user.id).where("active", "=", true).orderBy("accountType").orderBy("name").execute();

    const products = allProducts.filter(x => String(x.businessId) === String(businessId));
    const ids = products.map(x => x.id);
    const allGroups = await db.selectFrom("productGroups").selectAll().where("ownerUserId", "=", user.id).where("businessId", "=", businessId).orderBy("name").execute();
    const groups = allGroups.filter(g => g.active);
    const accounts = allFinancialAccounts.filter(x => String(x.businessId) === String(businessId));
    const allCompanyEntries = await db.selectFrom("companyEntries").selectAll().where("ownerUserId","=",user.id).where("active","=",true).orderBy("expectedDate","desc").execute();
    const companyEntries = allCompanyEntries.filter(x=>String(x.businessId)===String(businessId)&&monthKey(x.expectedDate)===businessMonth);
    const history = ids.length ? await db.selectFrom("productStatusHistory").innerJoin("products", "products.id", "productStatusHistory.productId").select([
      "productStatusHistory.id","productStatusHistory.productId","productStatusHistory.fromStatus","productStatusHistory.toStatus","productStatusHistory.note","productStatusHistory.changedAt"
    ]).where("products.businessId", "=", businessId).orderBy("productStatusHistory.changedAt", "desc").execute() : [];
    const repairs = await db.selectFrom("repairOrders").innerJoin("products", "products.id", "repairOrders.productId").select([
      "repairOrders.id","repairOrders.productId","repairOrders.defectDescription","repairOrders.knownAtPurchase","repairOrders.technicianName","repairOrders.quotedAmount","repairOrders.finalAmount","repairOrders.status","repairOrders.expectedCompletion","repairOrders.notes","repairOrders.createdAt","products.name","products.internalCode"
    ]).where("repairOrders.ownerUserId", "=", user.id).where("repairOrders.businessId", "=", businessId).orderBy("repairOrders.createdAt", "desc").execute();
    const sales = allSales.filter(x => String(x.businessId) === String(businessId));
    const payments = sales.length ? await db.selectFrom("salePayments").innerJoin("sales", "sales.id", "salePayments.saleId").select([
      "salePayments.id","salePayments.saleId","salePayments.method","salePayments.amount","salePayments.dueDate","salePayments.paidAt","salePayments.status"
    ]).where("sales.businessId", "=", businessId).orderBy("salePayments.dueDate", "asc").execute() : [];

    const now = new Date();
    const enriched = products.map(x => {
      const pc = allCosts.filter(c => String(c.productId) === String(x.id));
      const sale = sales.find(s => String(s.productId) === String(x.id));
      const paid = pc.filter(c => c.status === "paid").reduce((s,c) => s + Number(c.amount), 0);
      const pending = pc.filter(c => c.status === "pending").reduce((s,c) => s + Number(c.amount), 0);
      const estimated = pc.filter(c => c.status === "estimated").reduce((s,c) => s + Number(c.amount), 0);
      const isSold = ["sold","delivered"].includes(x.status) || Boolean(sale);
      const saleDate = sale?.soldAt || x.soldAt || null;
      const endDate = saleDate || (isSold ? x.updatedAt : now);
      return { ...x, subtitle: x.subtitle || [x.color,x.capacity,x.accessories].filter(Boolean).join(" · ") || "Detalhes não informados",
        groupName: allGroups.find(g => String(g.id) === String(x.groupId))?.name || "Sem grupo",
        costs: pc, history: history.filter(h => String(h.productId) === String(x.id)), paidCosts: paid, repairCosts:pc.filter(c=>c.category==="repair"&&c.status==="paid").reduce((s,c)=>s+Number(c.amount),0), pendingCosts: pending,
        estimatedCosts: estimated, realizedCost: Number(x.purchasePrice) + paid, committedCost: Number(x.purchasePrice) + paid + pending,
        inventoryDays: days(x.purchaseDate, endDate), saleDate, isSold, salePending: isSold && !sale };
    });

    const salesPlus = sales.map(s => {
      const ps = payments.filter(x => String(x.saleId) === String(s.id));
      const received = ps.filter(x => x.status === "paid").reduce((a,x) => a + Number(x.amount), 0);
      const item = enriched.find(x => String(x.id) === String(s.productId));
      const net = Number(s.salePrice) - Number(s.discount) - Number(s.fees);
      const paidCosts = allCosts.filter(c => String(c.productId) === String(s.productId) && c.status === "paid").reduce((a,c) => a + Number(c.amount), 0);
      const profit = net - Number(s.purchasePrice) - paidCosts;
      return { ...s, payments: ps, received, receivable: Math.max(0, net - received), netValue: net, profit,
        margin: net ? profit / net * 100 : 0, inventoryDays: item?.inventoryDays || 0, groupName: item?.groupName || "Sem grupo" };
    });

    const revenueMonth=currentMonth;
    const revenueMonthStart=new Date(revenueMonth+"-01T00:00:00Z");
    const revenueMonthEnd=new Date(Date.UTC(revenueMonthStart.getUTCFullYear(),revenueMonthStart.getUTCMonth()+1,0));
    const lastRevenueDay=revenueMonth===currentMonth?new Date().getUTCDate():revenueMonthEnd.getUTCDate();
    const revenueSales=salesPlus.filter(s=>monthKey(s.soldAt)===revenueMonth);
    const dailyRevenueDays=Array.from({length:lastRevenueDay},(_,index)=>{
      const day=index+1,rows=revenueSales.filter(s=>new Date(s.soldAt).getUTCDate()===day);
      const revenue=rows.reduce((sum,s)=>sum+Number(s.netValue),0);
      const previous=index===0?0:revenueSales.filter(s=>new Date(s.soldAt).getUTCDate()===day-1).reduce((sum,s)=>sum+Number(s.netValue),0);
      return {day,date:`${revenueMonth}-${String(day).padStart(2,"0")}`,dateLabel:new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"short",timeZone:"UTC"}).format(new Date(Date.UTC(revenueMonthStart.getUTCFullYear(),revenueMonthStart.getUTCMonth(),day))),revenue,previousRevenue:previous,direction:index===0||revenue>=previous?"up":"down",notes:rows.filter(s=>monthKey(s.purchaseDate)!==revenueMonth).map(s=>`${s.name} — item de ${monthLabel(monthKey(s.purchaseDate))}`)};
    });
    const foreignCompetenceSales=revenueSales.filter(s=>monthKey(s.purchaseDate)!==revenueMonth).map(s=>({saleId:s.id,name:s.name,internalCode:s.internalCode,netValue:s.netValue,purchaseMonth:monthKey(s.purchaseDate),purchaseMonthLabel:monthLabel(monthKey(s.purchaseDate)),saleDateLabel:new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"short",timeZone:"UTC"}).format(new Date(s.soldAt))}));
    const dailyRevenue={month:revenueMonth,label:monthLabel(revenueMonth),total:revenueSales.reduce((sum,s)=>sum+Number(s.netValue),0),days:dailyRevenueDays,foreignCompetenceSales};

    const active = enriched.filter(x => !x.isSold);
    const inventory = active.reduce((s,x) => s + x.realizedCost, 0);
    const potential = active.reduce((s,x) => s + Number(x.targetPrice || 0), 0);
    const availableBalance = accounts.reduce((s,x) => s + Number(x.balance), 0);
    const currentCompanyEntries=allCompanyEntries.filter(x=>String(x.businessId)===String(businessId)&&monthKey(x.expectedDate)===currentMonth);
    const currentCompanyIncome=currentCompanyEntries.filter(x=>x.entryType==="income").reduce((s,x)=>s+Number(x.amount),0);
    const currentCompanyExpenses=currentCompanyEntries.filter(x=>x.entryType==="expense").reduce((s,x)=>s+Number(x.amount),0);
    const companyCapital = availableBalance + potential + currentCompanyIncome - currentCompanyExpenses;
    const revenue = salesPlus.reduce((s,x) => s + x.netValue, 0);
    const received = salesPlus.reduce((s,x) => s + x.received, 0);
    const profit = salesPlus.reduce((s,x) => s + x.profit, 0);

    const monthKeys = [...new Set(enriched.map(x => monthKey(x.purchaseDate)))].sort().reverse();
    const monthlyAnalytics = monthKeys.map(month => {
      const items = enriched.filter(x => monthKey(x.purchaseDate) === month);
      const soldItems = items.filter(x => x.isSold), stockItems = items.filter(x => !x.isSold);
      const pendingSaleItems = soldItems.filter(x => x.salePending);
      const monthSales = salesPlus.filter(x => items.some(i => String(i.id) === String(x.productId)));
      const realizedProfit = monthSales.reduce((a,x) => a + x.profit, 0);
      const projectedProfit = stockItems.reduce((a,x) => a + Number(x.targetPrice || 0) - x.realizedCost, 0);
      const realizedRevenue = monthSales.reduce((a,x) => a + x.netValue, 0);
      const projectedRevenue = stockItems.reduce((a,x) => a + Number(x.targetPrice || 0), 0);
      return { month, label: monthLabel(month), purchased: items.length, sold: soldItems.length, inStock: stockItems.length,
        pendingSaleRegistration: pendingSaleItems.length, realizedProfit, projectedProfit, totalExpectedProfit: realizedProfit + projectedProfit,
        realizedRevenue, projectedRevenue, totalExpectedRevenue: realizedRevenue + projectedRevenue,
        soldInLaterMonth: soldItems.filter(x => x.saleDate && monthKey(x.saleDate) !== month).length,
        items: items.map(x => { const sx = monthSales.find(s => String(s.productId) === String(x.id)); return {
          id:x.id,internalCode:x.internalCode,name:x.name,subtitle:x.subtitle,purchaseDate:x.purchaseDate,saleDate:x.saleDate,
          inventoryDays:x.inventoryDays,status:x.salePending?"sale_pending":x.isSold?"sold":"stock",realizedCost:x.realizedCost,
          targetPrice:Number(x.targetPrice||0),salePrice:sx?.netValue||null,
          profit:sx?.profit ?? (!x.isSold ? Number(x.targetPrice||0)-x.realizedCost : null) }; })
      };
    });

    const groupRows = [...allGroups.map(g => ({id:String(g.id),name:g.name,description:g.description})),{id:"ungrouped",name:"Sem grupo",description:"Itens ainda não classificados"}].map(g => {
      const items = enriched.filter(x => g.id === "ungrouped" ? !x.groupId : String(x.groupId) === g.id);
      const sold = items.filter(x => x.isSold), stock = items.filter(x => !x.isSold);
      const ss = salesPlus.filter(x => x.groupName === g.name), rev = ss.reduce((a,x)=>a+x.netValue,0), gp = ss.reduce((a,x)=>a+x.profit,0);
      return {...g,purchased:items.length,sold:sold.length,active:stock.length,averageDaysSold:sold.length?Math.round(sold.reduce((a,x)=>a+x.inventoryDays,0)/sold.length):null,
        fastestDays:sold.length?Math.min(...sold.map(x=>x.inventoryDays)):null,slowestDays:sold.length?Math.max(...sold.map(x=>x.inventoryDays)):null,
        totalProfit:gp,averageProfit:ss.length?gp/ss.length:0,revenue:rev,margin:rev?gp/rev*100:0,sellThrough:items.length?sold.length/items.length*100:0,
        inventoryCapital:stock.reduce((a,x)=>a+x.realizedCost,0),averageActiveDays:stock.length?Math.round(stock.reduce((a,x)=>a+x.inventoryDays,0)/stock.length):0,
        pendingSaleRegistration:sold.filter(x=>x.salePending).length};
    }).filter(g => g.purchased > 0 || g.id !== "ungrouped");
    const soldGroups=groupRows.filter(g=>g.sold>0),insights:any[]=[];
    if(soldGroups.length){const fast=[...soldGroups].sort((a,b)=>(a.averageDaysSold??9999)-(b.averageDaysSold??9999))[0],prof=[...soldGroups].sort((a,b)=>b.totalProfit-a.totalProfit)[0],margin=[...soldGroups].sort((a,b)=>b.margin-a.margin)[0];insights.push({type:"speed",title:"Giro mais rápido",group:fast.name,value:`${fast.averageDaysSold} dias em média`},{type:"profit",title:"Maior lucro total",group:prof.name,value:prof.totalProfit},{type:"margin",title:"Melhor margem",group:margin.name,value:margin.margin})}
    const stuck=[...groupRows].sort((a,b)=>b.inventoryCapital-a.inventoryCapital)[0];if(stuck?.inventoryCapital>0)insights.push({type:"capital",title:"Maior capital parado",group:stuck.name,value:stuck.inventoryCapital});

    const personalEntriesAll = await db.selectFrom("personalEntries").selectAll().where("ownerUserId","=",user.id).where("active","=",true).orderBy("entryType").orderBy("name").execute();
    const creditCards = await db.selectFrom("creditCards").selectAll().where("ownerUserId","=",user.id).where("active","=",true).orderBy("name").execute();
    const personalAssets = await db.selectFrom("personalAssets").selectAll().where("ownerUserId","=",user.id).where("active","=",true).orderBy("assetType").orderBy("createdAt").execute();
    const investments = await db.selectFrom("investmentAssets").selectAll().where("ownerUserId","=",user.id).where("active","=",true).orderBy("assetType").orderBy("name").execute();
    const rules = await db.selectFrom("profitTransferRules").selectAll().where("ownerUserId","=",user.id).where("active","=",true).execute();
    const valuations = investments.length ? await db.selectFrom("investmentValuations").innerJoin("investmentAssets","investmentAssets.id","investmentValuations.assetId").select(["investmentValuations.assetId","investmentValuations.valuationMonth","investmentValuations.unitPrice","investmentValuations.quantity"]).where("investmentAssets.ownerUserId","=",user.id).execute() : [];

    const saleProfit = (s:any) => {
      const paidCosts = allCosts.filter(c=>String(c.productId)===String(s.productId)&&c.status==="paid").reduce((a,c)=>a+Number(c.amount),0);
      return Number(s.salePrice)-Number(s.discount)-Number(s.fees)-Number(s.purchasePrice)-paidCosts;
    };
    const transferDrafts:any[]=[];
    for(const r of rules){
      if(r.sourceType==="business"){
        const grouped=new Map<string,{due:string;recognition:string;base:number}>();
        for(const s of allSales.filter(s=>String(s.businessId)===String(r.businessId))){
          const origin=monthKey(s.purchaseDate),due=addMonths(origin,1),sold=monthKey(s.soldAt),recognition=sold>due?sold:due,key=due+"|"+recognition;
          const current=grouped.get(key)||{due,recognition,base:0};current.base+=Math.max(0,saleProfit(s));grouped.set(key,current);
        }
        for(const g of grouped.values())if(g.base>0){
          const delayed=g.recognition>g.due;
          transferDrafts.push({rule:r,businessId:r.businessId,due:g.due,recognition:g.recognition,base:g.base,
            transferKey:`${r.id}:${g.due}:${g.recognition}`,
            label:delayed?`Compensação de pró-labore de ${monthLabel(g.due)}`:`Pró-labore de ${monthLabel(previousMonth(g.due))}`,
            amount:g.base*Number(r.percentage)/100});
        }
      }else{
        for(const sourceMonth of [...new Set(valuations.map(v=>monthKey(v.valuationMonth)))]){
          const base=valuations.filter(v=>monthKey(v.valuationMonth)===sourceMonth).reduce((sum,v)=>{const a=investments.find(x=>String(x.id)===String(v.assetId));return sum+Math.max(0,(Number(v.unitPrice)-Number(a?.averageCost||0))*Number(v.quantity))},0);
          if(base>0){const due=addMonths(sourceMonth,1);transferDrafts.push({rule:r,businessId:null,due,recognition:due,base,transferKey:`${r.id}:${due}:${due}`,label:`Pró-labore de investimentos — ${monthLabel(sourceMonth)}`,amount:base*Number(r.percentage)/100})}
        }
      }
    }
    for(const x of transferDrafts)await db.insertInto("profitTransfers").values({ownerUserId:String(user.id),ruleId:x.rule.id,businessId:x.businessId,transferKey:x.transferKey,competenceMonth:x.due+"-01",recognitionMonth:x.recognition+"-01",amount:x.amount,label:x.label})
      .onConflict(oc=>oc.columns(["ownerUserId","transferKey"]).doUpdateSet({amount:x.amount,label:x.label,updatedAt:new Date()})).execute();
    const transfers=await db.selectFrom("profitTransfers").selectAll().where("ownerUserId","=",String(user.id)).orderBy("recognitionMonth","desc").execute();

    const candidates=[personalMonth,currentMonth,...personalEntriesAll.map(e=>monthKey(e.competenceMonth)),...allProducts.map(p=>monthKey(p.purchaseDate)),...allSales.map(s=>monthKey(s.soldAt))].sort();
    const ledgerStart=candidates[0]||currentMonth,ledgerEnd=[personalMonth,currentMonth].sort().reverse()[0];
    const ledgers:any=new Map();let carry=0;
    for(const month of monthsBetween(ledgerStart,ledgerEnd)){
      const entries=personalEntriesAll.filter(e=>e.recurring?monthKey(e.competenceMonth)<=month:monthKey(e.competenceMonth)===month);
      const manualIncome=entries.filter(e=>e.entryType==="income").reduce((s,e)=>s+Number(e.amount),0);
      const expenses=entries.filter(e=>e.entryType==="expense").reduce((s,e)=>s+Number(e.amount),0);
      const income=manualIncome+carry;
      const expectedBalance=income-expenses;
      ledgers.set(month,{entries,generated:[],carryIn:carry,income,expenses,expectedBalance});
      carry=Math.max(0,expectedBalance);
    }
    const selectedLedger=ledgers.get(personalMonth)||{entries:[],generated:[],carryIn:0,income:0,expenses:0,expectedBalance:0};
    const previous=previousMonth(personalMonth);
    const selectedTransfers=transfers.filter(x=>monthKey(x.recognitionMonth)===personalMonth);
    const selectedRules=rules.map(r=>{const rows=selectedTransfers.filter(x=>String(x.ruleId)===String(r.id));const amount=rows.reduce((s,x)=>s+Number(x.amount),0);return {...r,base:Number(r.percentage)?amount*100/Number(r.percentage):0,amount,sourceName:r.sourceType==="business"?(businesses.find(b=>String(b.id)===String(r.businessId))?.name||"Empresa"):"Carteira de investimentos"}});
    const personalEntries = selectedLedger.entries;
    const cardAvailability = creditCards.reduce((s,x)=>s+Number(x.availableLimit),0);
    const portfolioCost = investments.reduce((s,x)=>s+Number(x.quantity)*Number(x.averageCost),0);
    const portfolioValue = investments.reduce((s,x)=>s+Number(x.quantity)*Number(x.currentUnitPrice),0);
    const investmentPreviousProfit = valuations.filter(v=>monthKey(v.valuationMonth)===previous).reduce((sum,v)=>{const a=investments.find(x=>String(x.id)===String(v.assetId));return sum+(Number(v.unitPrice)-Number(a?.averageCost||0))*Number(v.quantity)},0);
    const historyCandidates=[currentMonth,...allProducts.map(x=>monthKey(x.purchaseDate)),...personalEntriesAll.map(x=>monthKey(x.competenceMonth)),...valuations.map(x=>monthKey(x.valuationMonth))].sort();
    const historyMonths=monthsBetween(historyCandidates[0]||currentMonth,currentMonth);
    const businessProfitAt=(business:any,month:string)=>allSales.filter(s=>String(s.businessId)===String(business)&&monthKey(s.purchaseDate)===month).reduce((sum,s)=>sum+saleProfit(s),0);
    const businessSummaries = businesses.map(b => {
      const bp = allProducts.filter(x => String(x.businessId)===String(b.id));
      const previousItems = bp.filter(x => monthKey(x.purchaseDate)===previous);
      const previousSales = allSales.filter(s => String(s.businessId)===String(b.id)&&previousItems.some(x=>String(x.id)===String(s.productId)));
      const pending=transfers.filter(x=>String(x.businessId)===String(b.id)&&x.status==="pending"&&monthKey(x.recognitionMonth)<=currentMonth);
      return {...b,productCount:bp.length,previousMonthProfit:previousSales.reduce((sum,s)=>sum+saleProfit(s),0),
        pendingTransferAmount:pending.reduce((s,x)=>s+Number(x.amount),0),pendingTransferCount:pending.length,
        trend:historyMonths.map(month=>({month,value:businessProfitAt(b.id,month)}))};
    });

    const allActiveProducts=allProducts.filter(p=>!allSales.some(s=>String(s.productId)===String(p.id))&&!["sold","delivered"].includes(p.status));
    const allBusinessCash=allFinancialAccounts.reduce((s,a)=>s+Number(a.balance),0);
    const allBusinessStockTarget=allActiveProducts.reduce((s,p)=>s+Number(p.targetPrice||0),0);
    const allCurrentCompanyNet=allCompanyEntries.filter(x=>monthKey(x.expectedDate)===currentMonth).reduce((s,x)=>s+(x.entryType==="income"?Number(x.amount):-Number(x.amount)),0);
    const businessValue=allBusinessCash+allBusinessStockTarget+allCurrentCompanyNet;
    const personalAssetsGross=personalAssets.reduce((s,x)=>s+Number(x.currentValue),0),personalAssetsDebt=personalAssets.reduce((s,x)=>s+Number(x.outstandingDebt),0),personalAssetsNet=Math.max(0,personalAssetsGross-personalAssetsDebt);
    const currentPersonal=Math.max(0,Number(ledgers.get(currentMonth)?.expectedBalance||0))+cardAvailability+personalAssetsNet;
    const totalPatrimony=businessValue+currentPersonal+portfolioValue;
    const today=new Date().toISOString().slice(0,10);
    await db.insertInto("patrimonySnapshots").values({ownerUserId:String(user.id),snapshotDate:today,totalValue:totalPatrimony,businessValue,personalValue:currentPersonal,investmentValue:portfolioValue})
      .onConflict(oc=>oc.columns(["ownerUserId","snapshotDate"]).doUpdateSet({totalValue:totalPatrimony,businessValue,personalValue:currentPersonal,investmentValue:portfolioValue,updatedAt:new Date()})).execute();
    const snapshots=await db.selectFrom("patrimonySnapshots").selectAll().where("ownerUserId","=",String(user.id)).orderBy("snapshotDate").execute();
    const transferEntryIds=new Set(transfers.filter(x=>x.personalEntryId).map(x=>String(x.personalEntryId)));
    let previousInvestmentValue=portfolioCost;
    const changes=historyMonths.map(month=>{
      const business=businesses.reduce((sum,b)=>sum+businessProfitAt(b.id,month),0);
      const monthEntries=personalEntriesAll.filter(e=>e.recurring?monthKey(e.competenceMonth)<=month:monthKey(e.competenceMonth)===month);
      const personal=monthEntries.filter(e=>!transferEntryIds.has(String(e.id))).reduce((sum,e)=>sum+(e.entryType==="income"?Number(e.amount):-Number(e.amount)),0);
      const monthValuations=valuations.filter(v=>monthKey(v.valuationMonth)===month);
      const investmentValue=monthValuations.length?monthValuations.reduce((sum,v)=>sum+Number(v.unitPrice)*Number(v.quantity),0):previousInvestmentValue;
      const investment=investmentValue-previousInvestmentValue;previousInvestmentValue=investmentValue;
      return {month,business,personal,investment,total:business+personal+investment};
    });
    let running=Math.max(0,totalPatrimony-changes.reduce((sum,x)=>sum+x.total,0));
    const candles=changes.map(x=>{const open=running,close=open+x.total;running=close;const daily=snapshots.filter(s=>monthKey(s.snapshotDate)===x.month).map(s=>Number(s.totalValue));return {month:x.month,label:monthLabel(x.month),open,close,high:Math.max(open,close,...daily),low:Math.min(open,close,...daily),change:x.total}});
    if(candles.length)candles[candles.length-1].close=totalPatrimony;
    const personalTrend=historyMonths.map(month=>{const l=ledgers.get(month);return {month,income:Math.max(0,Number(l?.income||0)-Number(l?.carryIn||0)),expenses:Number(l?.expenses||0),balance:Number(l?.expectedBalance||0)}});
    const investmentComposition=[...new Set(investments.map(x=>x.assetType))].map(type=>({type,value:investments.filter(x=>x.assetType===type).reduce((s,x)=>s+Number(x.quantity)*Number(x.currentUnitPrice),0)})).filter(x=>x.value>0);
    const pendingTransfers=transfers.filter(x=>x.status==="pending"&&monthKey(x.recognitionMonth)<=currentMonth).map(x=>({id:x.id,label:x.label,amount:Number(x.amount),businessId:x.businessId,businessName:businesses.find(b=>String(b.id)===String(x.businessId))?.name||"Investimentos",recognitionMonth:monthKey(x.recognitionMonth),accounts:allFinancialAccounts.filter(a=>String(a.businessId)===String(x.businessId)).map(a=>({id:a.id,name:a.name,balance:Number(a.balance)}))}));

    const companyIncome=companyEntries.filter(x=>x.entryType==="income").reduce((s,x)=>s+Number(x.amount),0),companyExpenses=companyEntries.filter(x=>x.entryType==="expense").reduce((s,x)=>s+Number(x.amount),0);
    const outputProducts=enriched.map(x=>({...x,sale:salesPlus.find(s=>String(s.productId)===String(x.id))||null}));
    return new Response(superjson.stringify({
      businesses:businessSummaries,activeBusiness,products:outputProducts,sales:salesPlus,repairs,payments,groups,accounts,monthlyAnalytics,groupAnalytics:groupRows,insights,pendingTransfers,dailyRevenue,
      companyLedger:{month:businessMonth,label:monthLabel(businessMonth),entries:companyEntries,income:companyIncome,expenses:companyExpenses,net:companyIncome-companyExpenses,projectedCapital:availableBalance+potential+companyIncome-companyExpenses},
      personal:{month:personalMonth,label:monthLabel(personalMonth),entries:personalEntries,generatedIncome:selectedLedger.generated,carryIn:selectedLedger.carryIn,carryLabel:selectedLedger.carryIn>0?`Sobra de ${monthLabel(previous)}`:null,cards:creditCards,rules:selectedRules,transfers:selectedTransfers,income:selectedLedger.income,expenses:selectedLedger.expenses,cardAvailability,expectedBalance:selectedLedger.expectedBalance,availableWithCards:selectedLedger.expectedBalance+cardAvailability,previousMonth:previous},
      personalAssets:{assets:personalAssets,grossValue:personalAssetsGross,outstandingDebt:personalAssetsDebt,netValue:personalAssetsNet,byType:['property','vehicle','equity'].map(type=>({type,value:personalAssets.filter(x=>x.assetType===type).reduce((s,x)=>s+Math.max(0,Number(x.currentValue)-Number(x.outstandingDebt)),0)}))},
      investments:{assets:investments,totalCost:portfolioCost,currentValue:portfolioValue,profit:portfolioValue-portfolioCost,previousMonthProfit:investmentPreviousProfit,composition:investmentComposition},
      patrimony:{total:totalPatrimony,businessValue,personalValue:currentPersonal,investmentValue:portfolioValue,candles,personalTrend,estimatedHistory:true},
      metrics:{active:active.length,sold:enriched.filter(x=>x.isSold).length,salePending:enriched.filter(x=>x.salePending).length,inventory,potential,availableBalance,companyCapital,projected:potential-inventory,revenue:received,receivable:Math.max(0,revenue-received),profit,averageDaysSold:salesPlus.length?Math.round(salesPlus.reduce((a,x)=>a+x.inventoryDays,0)/salesPlus.length):0,slowStock:active.filter(x=>x.inventoryDays>=30).length,paidCosts:enriched.reduce((s,x)=>s+x.paidCosts,0),pendingCosts:enriched.reduce((s,x)=>s+x.pendingCosts,0),estimatedCosts:enriched.reduce((s,x)=>s+x.estimatedCosts,0)},
      user:{id:user.id,displayName:user.displayName,email:user.email,avatarUrl:userRow.avatarUrl}
    }),{headers:{"Content-Type":"application/json"}});
  } catch(e) {
    console.error(e);
    return new Response(superjson.stringify({message:e instanceof Error?e.message:"Erro"}),{status:401});
  }
}
