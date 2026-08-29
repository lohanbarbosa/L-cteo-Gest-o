import { z } from "zod";
import superjson from "superjson";

const productStatus = z.enum([
  "received", "evaluation", "repair", "preparation", "ready",
  "advertised", "reserved", "sold", "delivered"
]);
const repairStatus = z.enum([
  "draft", "quoted", "approved", "in_progress",
  "waiting_part", "completed", "rejected", "cancelled"
]);
const productFields = {
  name: z.string().min(2),
  subtitle: z.string().optional(),
  segment: z.string().min(2),
  brand: z.string().optional(),
  model: z.string().optional(),
  color: z.string().optional(),
  capacity: z.string().optional(),
  imeiSerial: z.string().optional(),
  targetPrice: z.number().nonnegative().optional(),
  supplierName: z.string().optional(),
  supplierContact: z.string().optional(),
  batteryHealth: z.number().min(0).max(100).optional(),
  aestheticCondition: z.string().optional(),
  functionalCondition: z.string().optional(),
  accessories: z.string().optional(),
  storageLocation: z.string().optional(),
  notes: z.string().optional(),
  groupId: z.string().optional(),
  sellerReference: z.string().optional(),
  sellerProfileUrl: z.string().optional(),
  sourcePlatform: z.string().optional(),
  sourceLocation: z.string().optional(),
};

export const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("product"),
    ...productFields,
    purchaseDate: z.string(),
    purchasePrice: z.number().nonnegative(),
    purchasePaymentMethod: z.string().optional(),
    purchaseOrigin: z.string().optional(),
  }),
  z.object({ action: z.literal("editProduct"), productId: z.string(), purchaseDate: z.string(), ...productFields }),
  z.object({ action: z.literal("status"), productId: z.string(), status: productStatus, note: z.string().optional() }),
  z.object({ action: z.literal("archive"), productId: z.string() }),
  z.object({
    action: z.literal("cost"), productId: z.string(),
    category: z.enum(["repair","part","labor","shipping","cleaning","accessory","improvement","fee","commission","tax","other"]),
    description: z.string().min(2), amount: z.number().positive(),
    status: z.enum(["estimated","pending","paid"]),
    providerName: z.string().optional(), notes: z.string().optional(),
  }),
  z.object({
    action: z.literal("repair"), productId: z.string(),
    defectDescription: z.string().min(3), knownAtPurchase: z.boolean(),
    technicianName: z.string().optional(), quotedAmount: z.number().nonnegative().optional(),
    status: repairStatus, expectedCompletion: z.string().optional(), notes: z.string().optional(),
  }),
  z.object({
    action: z.literal("updateRepair"), repairId: z.string(), status: repairStatus,
    finalAmount: z.number().nonnegative().optional(), notes: z.string().optional(),
  }),
  z.object({
    action: z.literal("sale"), productId: z.string(), customerName: z.string().min(2),
    customerContact: z.string().optional(), salePrice: z.number().positive(),
    received: z.number().nonnegative(), method: z.string().min(2),
    installments: z.number().int().min(1).max(24).default(1), soldDate: z.string(),
  }),
  z.object({
    action: z.literal("editSale"), saleId: z.string(), customerName: z.string().min(2),
    customerContact: z.string().optional(), salePrice: z.number().positive(),
    received: z.number().nonnegative(), method: z.string().min(2),
    installments: z.number().int().min(1).max(24).default(1), soldDate: z.string(), notes: z.string().optional(),
  }),
  z.object({ action: z.literal("cancelSale"), saleId: z.string(), reason: z.string().min(2) }),
  z.object({ action: z.literal("editDates"), productId: z.string(), purchaseDate: z.string(), soldDate: z.string().optional() }),
  z.object({ action: z.literal("upsertAccount"), accountId: z.string().optional(), name: z.string().min(2), accountType: z.enum(["cash","bank","digital_wallet","other"]), institution: z.string().optional(), balance: z.number(), notes: z.string().optional() }),
  z.object({ action: z.literal("archiveAccount"), accountId: z.string() }),
  z.object({ action: z.literal("receivePayment"), paymentId: z.string(), method: z.string().min(2) }),
  z.object({ action: z.literal("createGroup"), name: z.string().min(2), description: z.string().optional() }),
  z.object({ action: z.literal("archiveGroup"), groupId: z.string() }),
  z.object({ action: z.literal("switchBusiness"), businessId: z.string() }),
  z.object({ action: z.literal("upsertBusiness"), businessId: z.string().optional(), name: z.string().min(2), logoUrl: z.string().optional() }),
  z.object({ action: z.literal("archiveBusiness"), businessId: z.string() }),
  z.object({ action: z.literal("upsertPersonalEntry"), entryId: z.string().optional(), entryType: z.enum(["income","expense"]), name: z.string().min(2), amount: z.number().nonnegative(), competenceMonth: z.string(), recurring: z.boolean(), notes: z.string().optional() }),
  z.object({ action: z.literal("archivePersonalEntry"), entryId: z.string() }),
  z.object({ action: z.literal("upsertCreditCard"), cardId: z.string().optional(), name: z.string().min(2), institution: z.string().optional(), totalLimit: z.number().nonnegative(), availableLimit: z.number().nonnegative(), includeAsAvailable: z.boolean() }),
  z.object({ action: z.literal("archiveCreditCard"), cardId: z.string() }),
  z.object({ action: z.literal("upsertPersonalAsset"), assetId: z.string().optional(), assetType: z.enum(["property","vehicle","equity"]), name: z.string().min(2), description: z.string().optional(), currentValue: z.number().nonnegative(), amountPaid: z.number().nonnegative(), outstandingDebt: z.number().nonnegative(), ownershipPercentage: z.number().min(0).max(100).optional(), acquisitionDate: z.string().optional(), notes: z.string().optional() }),
  z.object({ action: z.literal("archivePersonalAsset"), assetId: z.string() }),
  z.object({ action: z.literal("upsertCompanyEntry"), entryId: z.string().optional(), entryType: z.enum(["income","expense"]), name: z.string().min(2), amount: z.number().nonnegative(), expectedDate: z.string(), realized: z.boolean(), notes: z.string().optional() }),
  z.object({ action: z.literal("archiveCompanyEntry"), entryId: z.string() }),
  z.object({ action: z.literal("upsertInvestment"), assetId: z.string().optional(), name: z.string().min(2), assetType: z.enum(["stock","crypto","fund","property","fixed_income","other"]), quantity: z.number().nonnegative(), averageCost: z.number().nonnegative(), currentUnitPrice: z.number().nonnegative(), symbol: z.string().optional(), notes: z.string().optional() }),
  z.object({ action: z.literal("archiveInvestment"), assetId: z.string() }),
  z.object({ action: z.literal("upsertTransferRule"), ruleId: z.string().optional(), sourceType: z.enum(["business","investments"]), businessId: z.string().optional(), percentage: z.number().min(0).max(100) }),
  z.object({ action: z.literal("archiveTransferRule"), ruleId: z.string() }),
  z.object({ action: z.literal("confirmProfitTransfer"), transferId: z.string() }),
  z.object({ action: z.literal("updateAvatar"), avatarDataUrl: z.string().max(1500000) }),
]);

export async function postAction(body: z.infer<typeof schema>) {
  const result = await fetch("/_api/app/action", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: superjson.stringify(schema.parse(body)),
  });
  if (!result.ok) {
    const error = superjson.parse<any>(await result.text());
    throw new Error(error.message || "Falha ao salvar");
  }
  return superjson.parse<{ ok: true }>(await result.text());
}
