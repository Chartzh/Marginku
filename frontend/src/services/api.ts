import { supabase } from '@/lib/supabase';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Types response dari backend
export type NotaItem = {
  nama: string;
  harga_satuan: number;
  jumlah: number;
  total: number;
};

export type ScanNotaResponse = {
  status: string;
  items_berhasil?: number;
  items_ditambahkan?: number;
  total_katalog: number;
  supplier?: string | null;
  tanggal?: string | null;
  detail: {
    items: NotaItem[];
    supplier?: string | null;
    tanggal?: string | null;
  };
};

export type AuditLabelResponse = {
  status: 'success' | 'not_found' | 'error';
  nama_label_rak: string;
  nama_di_nota: string;
  match_score: number;
  match_stage: string;
  harga_modal: number;
  harga_rak: number;
  margin_persen: number;
  status_margin: 'aman' | 'tipis' | 'bahaya';
  perlu_update_harga: boolean;
  harga_rekomendasi: number;
  keuntungan_per_item: number;
  pesan: string;
};

export type KatalogResponse = {
  total: number;
  produk: Record<string, number>;
};

export type ResetKatalogResponse = {
  status: string;
  pesan: string;
};

/**
 * Helper internal untuk menambahkan header Authorization: Bearer <token>
 */
async function getAuthHeaders(options?: { isJson?: boolean }): Promise<HeadersInit> {
  const headers: Record<string, string> = {};

  if (options?.isJson) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.error('Gagal mengambil token Supabase:', err);
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error! Status: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData) {
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (typeof errorData.pesan === 'string') {
          errorMessage = errorData.pesan;
        } else if (typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
          errorMessage = errorData.detail
            .map((err: { msg?: string }) => err.msg || JSON.stringify(err))
            .join(', ');
        }
      }
    } catch {
      // If parsing fails, fall back to default error message
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

/**
 * Upload dan scan file nota untuk ditambahkan ke katalog.
 * POST /api/v1/scan/nota
 */
export async function scanNota(file: File): Promise<ScanNotaResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const authHeaders = await getAuthHeaders();

  const response = await fetch(`${BASE_URL}/api/v1/scan/nota`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  });

  return handleResponse<ScanNotaResponse>(response);
}

/**
 * Audit label rak terhadap katalog nota.
 * POST /api/v1/scan/label-rak?target_margin={targetMargin}
 */
export async function auditLabelRak(
  file: File,
  targetMargin?: number
): Promise<AuditLabelResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const url = new URL(`${BASE_URL}/api/v1/scan/label-rak`);
  if (targetMargin !== undefined) {
    url.searchParams.append('target_margin', targetMargin.toString());
  }

  const authHeaders = await getAuthHeaders();

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  });

  return handleResponse<AuditLabelResponse>(response);
}

/**
 * Mengambil daftar seluruh produk dalam katalog.
 * GET /api/v1/katalog
 */
export async function getKatalog(): Promise<KatalogResponse> {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(`${BASE_URL}/api/v1/katalog`, {
    method: 'GET',
    headers: authHeaders,
  });

  return handleResponse<KatalogResponse>(response);
}

/**
 * Reset/mengosongkan data katalog produk.
 * DELETE /api/v1/katalog/reset
 */
export async function resetKatalog(): Promise<ResetKatalogResponse> {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(`${BASE_URL}/api/v1/katalog/reset`, {
    method: 'DELETE',
    headers: authHeaders,
  });

  return handleResponse<ResetKatalogResponse>(response);
}
