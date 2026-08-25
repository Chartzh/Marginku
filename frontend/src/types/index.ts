export type MarginStatus = 'DANGER' | 'WARNING' | 'HEALTHY';

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  barcode?: string;
  buyPrice: number;              // Harga Modal (dari Nota)
  currentSellPrice: number;      // Harga Jual Rak (dari Label Rak)
  targetMarginPercent: number;   // Target Margin Pemilik Warung (default misal 15%)
  unit: string;                  // 'pcs', 'renceng', 'kg', 'bungkus', 'botol'
  stockQty?: number;
  lastUpdated: string;
  imagePlaceholder?: string;
  matchedFromReceipt?: boolean;
  recommendedSellPrice?: number;
}

export interface MarginCalculationResult {
  activeMarginPercent: number;     // ((SellPrice - BuyPrice) / SellPrice) * 100
  activeMarginNominal: number;     // SellPrice - BuyPrice
  targetSellPriceRaw: number;      // BuyPrice / (1 - targetMarginPercent / 100)
  smartRoundedSellPrice: number;   // Pembulatan pintar Rupiah ke atas kelipatan 500 / 1000
  recommendedMarginPercent: number;// Margin jika menerapkan smartRoundedSellPrice
  marginDeltaPercent: number;      // activeMarginPercent - targetMarginPercent
  status: MarginStatus;
  alertHeadline: string;
  alertReason: string;
}

export interface ReceiptItem {
  id: string;
  rawName: string;
  matchedProductName?: string;
  qty: number;
  unit: string;
  unitBuyPrice: number;
  totalBuyPrice: number;
}

export interface ReceiptScanData {
  id: string;
  storeName: string;
  date: string;
  items: ReceiptItem[];
  totalAmount: number;
  imageUrl?: string;
}

export interface ShelfScanData {
  id: string;
  detectedName: string;
  detectedPrice: number;
  confidence: number;
  imageUrl?: string;
  matchedProduct?: ProductItem;
}

export interface PriceAuditLog {
  id: string;
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  buyPrice: number;
  oldMarginPercent: number;
  newMarginPercent: number;
  actionType: 'ACCEPT_RECOMMENDATION' | 'MANUAL_OVERRIDE';
  timestamp: string;
  userNote?: string;
}

export interface StoreSettings {
  defaultTargetMarginPercent: number; // default 15%
  roundingStep: 500 | 1000;            // kelipatan 500 atau 1000
  dangerThresholdPercent: number;     // di bawah 5% -> Danger
  warningThresholdPercent: number;    // di bawah target (misal 15%) -> Warning
  storeName: string;
}
