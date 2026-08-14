import { ProductItem, ReceiptScanData, ShelfScanData, StoreSettings } from '@/types';

export const initialStoreSettings: StoreSettings = {
  defaultTargetMarginPercent: 15,
  roundingStep: 500,
  dangerThresholdPercent: 5,
  warningThresholdPercent: 15,
  storeName: 'Warung Berkah Jaya',
};

export const initialProducts: ProductItem[] = [
  {
    id: 'prod-1',
    name: 'Indomie Goreng Spesial 85g',
    category: 'Makanan Instan',
    barcode: '089686010041',
    buyPrice: 3000,           // Harga kulakan baru naik dari 2.700 -> 3.000
    currentSellPrice: 3100,   // Harga di rak masih Rp 3.100 (Margin 3.2% -> DANGER)
    targetMarginPercent: 15,
    unit: 'bungkus',
    stockQty: 48,
    lastUpdated: new Date(Date.now() - 3600000 * 2).toISOString(),
    matchedFromReceipt: true,
  },
  {
    id: 'prod-2',
    name: 'Minyak Goreng Bimoli Pouch 1L',
    category: 'Sembako',
    barcode: '089686020055',
    buyPrice: 16500,          // Harga kulakan Rp 16.500
    currentSellPrice: 17500,  // Harga jual rak Rp 17.500 (Margin 5.7% -> WARNING)
    targetMarginPercent: 15,
    unit: 'pouch',
    stockQty: 12,
    lastUpdated: new Date(Date.now() - 3600000 * 12).toISOString(),
    matchedFromReceipt: true,
  },
  {
    id: 'prod-3',
    name: 'Kopi Kapal Api Special Mix 10s',
    category: 'Minuman',
    barcode: '089686030088',
    buyPrice: 12500,          // Modal Rp 12.500
    currentSellPrice: 15000,  // Harga jual rak Rp 15.000 (Margin 16.7% -> HEALTHY)
    targetMarginPercent: 15,
    unit: 'renceng',
    stockQty: 20,
    lastUpdated: new Date(Date.now() - 3600000 * 24).toISOString(),
    matchedFromReceipt: true,
  },
  {
    id: 'prod-4',
    name: 'Beras Premium Ramos 5kg',
    category: 'Sembako',
    barcode: '089686040012',
    buyPrice: 72000,          // Modal Rp 72.000
    currentSellPrice: 73000,  // Harga jual Rp 73.000 (Margin 1.4% -> DANGER)
    targetMarginPercent: 12,
    unit: 'karung',
    stockQty: 6,
    lastUpdated: new Date(Date.now() - 3600000 * 5).toISOString(),
    matchedFromReceipt: true,
  },
  {
    id: 'prod-5',
    name: 'Telur Ayam Negeri Fresh',
    category: 'Sembako',
    barcode: '089686050099',
    buyPrice: 28500,          // Modal Rp 28.500
    currentSellPrice: 28000,  // Harga rak Rp 28.000 (Jual Rugi -1.8% -> CRITICAL)
    targetMarginPercent: 10,
    unit: 'kg',
    stockQty: 15,
    lastUpdated: new Date(Date.now() - 3600000 * 1).toISOString(),
    matchedFromReceipt: true,
  },
  {
    id: 'prod-6',
    name: 'Sabun Lifebuoy Total 10 110g',
    category: 'Kebutuhan Rumah',
    barcode: '089686060033',
    buyPrice: 3800,
    currentSellPrice: 5000,   // Margin 24.0% -> HEALTHY
    targetMarginPercent: 15,
    unit: 'pcs',
    stockQty: 24,
    lastUpdated: new Date(Date.now() - 3600000 * 48).toISOString(),
    matchedFromReceipt: false,
  },
  {
    id: 'prod-7',
    name: 'Teh Celup SariWangi Kotak 25s',
    category: 'Minuman',
    barcode: '089686070044',
    buyPrice: 6200,
    currentSellPrice: 7000,   // Margin 11.4% -> WARNING
    targetMarginPercent: 15,
    unit: 'kotak',
    stockQty: 18,
    lastUpdated: new Date(Date.now() - 3600000 * 18).toISOString(),
    matchedFromReceipt: true,
  }
];

export const demoReceipts: ReceiptScanData[] = [
  {
    id: 'rec-1',
    storeName: 'Grosir Agen Sembako Sumber Rejeki',
    date: '2026-08-14 08:30',
    totalAmount: 384000,
    items: [
      {
        id: 'ri-1',
        rawName: 'INDOMIE GRG KRN 85G (KARTON 40 PCS)',
        matchedProductName: 'Indomie Goreng Spesial 85g',
        qty: 1,
        unit: 'karton (40 pcs)',
        unitBuyPrice: 3000,
        totalBuyPrice: 120000,
      },
      {
        id: 'ri-2',
        rawName: 'MINYAK GORENG BIMOLI POUCH 1L (DUS 12)',
        matchedProductName: 'Minyak Goreng Bimoli Pouch 1L',
        qty: 1,
        unit: 'dus (12 pcs)',
        unitBuyPrice: 16500,
        totalBuyPrice: 198000,
      },
      {
        id: 'ri-3',
        rawName: 'TELUR AYAM NEGERI (TRAY 15KG)',
        matchedProductName: 'Telur Ayam Negeri Fresh',
        qty: 15,
        unit: 'kg',
        unitBuyPrice: 28500,
        totalBuyPrice: 427500,
      }
    ]
  }
];

export const demoShelfPresets: ShelfScanData[] = [
  {
    id: 'shelf-preset-1',
    detectedName: 'Indomie Grg Spesial 85gr',
    detectedPrice: 3100,
    confidence: 0.96,
  },
  {
    id: 'shelf-preset-2',
    detectedName: 'Telur Ayam Negeri / kg',
    detectedPrice: 28000,
    confidence: 0.98,
  },
  {
    id: 'shelf-preset-3',
    detectedName: 'Beras Ramos 5 Kg',
    detectedPrice: 73000,
    confidence: 0.92,
  },
  {
    id: 'shelf-preset-4',
    detectedName: 'Minyak Bimoli 1 Liter',
    detectedPrice: 17500,
    confidence: 0.94,
  },
  {
    id: 'shelf-preset-5',
    detectedName: 'Kopi Kapal Api Spcl Mix',
    detectedPrice: 15000,
    confidence: 0.99,
  }
];
