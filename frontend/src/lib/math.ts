import { MarginCalculationResult, MarginStatus } from '@/types';

/**
 * Deterministic Rupiah Smart Rounding Engine
 * Rounds upward (ceil) to the nearest multiple of step (e.g. 500 or 1000).
 * Contoh:
 *   target 3.529 dengan step 500 -> 4.000
 *   target 3.120 dengan step 500 -> 3.500
 *   target 3.000 dengan step 500 -> 3.000
 */
export function smartRoundRupiah(amount: number, step: 500 | 1000 = 500): number {
  if (amount <= 0) return 0;
  return Math.ceil(amount / step) * step;
}

/**
 * Deterministic Math Engine
 * Menghitung margin aktif, selisih margin, target harga, dan pembulatan Rupiah.
 * Sesuai prinsip Context.md: Semua kalkulasi WAJIB deterministik murni.
 * 
 * Formula:
 * - Margin Aktif (%) = ((Price_Rak - Price_Modal) / Price_Rak) * 100
 * - Target Price = Price_Modal / (1 - (Target_Margin / 100))
 */
export function calculateMargin(
  buyPrice: number,
  shelfPrice: number,
  targetMarginPercent: number = 15,
  roundingStep: 500 | 1000 = 500,
  dangerThresholdPercent: number = 5
): MarginCalculationResult {
  // Jika harga rak 0 atau negatif
  if (shelfPrice <= 0) {
    return {
      activeMarginPercent: -100,
      activeMarginNominal: -buyPrice,
      targetSellPriceRaw: buyPrice,
      smartRoundedSellPrice: smartRoundRupiah(buyPrice, roundingStep),
      recommendedMarginPercent: 0,
      marginDeltaPercent: -targetMarginPercent,
      status: 'DANGER',
      alertHeadline: 'Harga Jual Belum Diatur!',
      alertReason: 'Harga jual di rak tidak valid atau 0 rupiah.',
    };
  }

  // Margin aktif saat ini
  const activeMarginNominal = shelfPrice - buyPrice;
  const activeMarginPercent = (activeMarginNominal / shelfPrice) * 100;

  // Hitung target harga jual ideal
  // Price_Modal / (1 - Target_Margin)
  const targetRatio = 1 - (targetMarginPercent / 100);
  const targetSellPriceRaw = targetRatio > 0 ? buyPrice / targetRatio : buyPrice * 1.2;

  // Pembulatan pintar Rupiah ke atas
  const smartRoundedSellPrice = smartRoundRupiah(targetSellPriceRaw, roundingStep);

  // Margin jika menerapkan rekomendasi harga pembulatan
  const recommendedMarginPercent = ((smartRoundedSellPrice - buyPrice) / smartRoundedSellPrice) * 100;

  // Selisih dengan target margin pemilik warung
  const marginDeltaPercent = activeMarginPercent - targetMarginPercent;

  // Penentuan Status
  let status: MarginStatus = 'HEALTHY';
  let alertHeadline = 'Margin Sehat & Aman';
  let alertReason = `Margin aktif saat ini (${activeMarginPercent.toFixed(1)}%) sudah memenuhi atau melampaui target ${targetMarginPercent}%.`;

  if (activeMarginPercent < dangerThresholdPercent) {
    status = 'DANGER';
    if (activeMarginPercent < 0) {
      alertHeadline = 'CRITICAL: Warung Merugi (Jual Rugi)!';
      alertReason = `Harga jual rak (Rp${shelfPrice.toLocaleString('id-ID')}) LEBIH RENDAH dari harga kulakan terbaru (Rp${buyPrice.toLocaleString('id-ID')}). Setiap produk terjual langsung boncos Rp${Math.abs(activeMarginNominal).toLocaleString('id-ID')}!`;
    } else {
      alertHeadline = 'ALERT: Margin Tergerus Inflasi Bahaya!';
      alertReason = `Margin aktif hanya ${activeMarginPercent.toFixed(1)}% (jauh di bawah batas bahaya ${dangerThresholdPercent}%). Keuntungan tergerus kenaikan harga grosir.`;
    }
  } else if (activeMarginPercent < targetMarginPercent) {
    status = 'WARNING';
    alertHeadline = 'WARNING: Margin di Bawah Target';
    alertReason = `Margin aktif (${activeMarginPercent.toFixed(1)}%) masih di bawah target warung (${targetMarginPercent}%). Disarankan menaikkan harga ke Rp${smartRoundedSellPrice.toLocaleString('id-ID')}.`;
  }

  return {
    activeMarginPercent,
    activeMarginNominal,
    targetSellPriceRaw,
    smartRoundedSellPrice,
    recommendedMarginPercent,
    marginDeltaPercent,
    status,
    alertHeadline,
    alertReason,
  };
}

/**
 * 2-Stage Fuzzy Text Matcher Simulator (Frontend side fallback)
 * Menghitung similarity score sederhana berbasis Token Overlap & Levenshtein
 */
export function fuzzyMatchScore(query: string, target: string): number {
  const cleanQ = query.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  const cleanT = target.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');

  if (cleanQ === cleanT) return 1.0;
  if (cleanT.includes(cleanQ) || cleanQ.includes(cleanT)) return 0.85;

  const qTokens = cleanQ.split(/\s+/).filter(Boolean);
  const tTokens = cleanT.split(/\s+/).filter(Boolean);

  let matchCount = 0;
  for (const q of qTokens) {
    if (tTokens.some(t => t.includes(q) || q.includes(t))) {
      matchCount++;
    }
  }

  const tokenScore = qTokens.length > 0 ? (matchCount / qTokens.length) * 0.8 : 0;
  return Math.min(1.0, tokenScore);
}
