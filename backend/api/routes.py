from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from pipeline.main_pipeline import MarginPipeline
from pipeline.math_engine import analisis_produk
from database import supabase_admin
from auth import get_current_user_id
import tempfile, os, shutil, re, math, traceback

router = APIRouter()
_pipeline: MarginPipeline | None = None

def get_pipeline() -> MarginPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = MarginPipeline()
    return _pipeline

def clean_int(val) -> int:
    if val is None:
        return 0
    if isinstance(val, int):
        return val
    if isinstance(val, float):
        return int(val)
    s = str(val).strip()
    s_clean = re.sub(r"[^\d]", "", s)
    return int(s_clean) if s_clean else 0

@router.get("/health")
def health():
    return {"status": "ok", "service": "Marginku API v1"}

@router.get("/katalog")
def get_katalog(user_id: str = Depends(get_current_user_id)):
    res = supabase_admin.table("katalog_produk").select("*").eq("user_id", user_id).execute()
    data = res.data or []
    return {
        "total": len(data),
        "produk": {row["nama"]: row["harga_modal"] for row in data}
    }

@router.post("/scan/nota")
async def scan_nota(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File harus gambar (jpg/png)")
    suffix = os.path.splitext(file.filename or ".jpg")[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        path = tmp.name
    try:
        nota_result = get_pipeline().ocr.scan_nota(path)
        items = nota_result.get("items", [])
        items_ditambahkan = 0
        
        for item in items:
            nama = str(item.get("nama", "")).strip()
            if not nama:
                continue
            
            harga_satuan_raw = item.get("harga_satuan")
            harga_modal = clean_int(harga_satuan_raw)
            if harga_modal <= 0:
                continue

            existing = supabase_admin.table("katalog_produk")\
                .select("id, harga_jual")\
                .eq("user_id", user_id)\
                .ilike("nama", nama)\
                .execute()
                
            if existing.data:
                existing_row = existing.data[0]
                existing_harga_jual = clean_int(existing_row.get("harga_jual"))
                target_raw = harga_modal / 0.85
                harga_jual_default = math.ceil(target_raw / 500) * 500
                harga_jual = existing_harga_jual if existing_harga_jual > 0 else harga_jual_default
                
                supabase_admin.table("katalog_produk")\
                    .update({
                        "harga_modal": harga_modal,
                        "harga_jual": harga_jual,
                        "target_margin_persen": 15.0
                    })\
                    .eq("id", existing_row["id"])\
                    .execute()
            else:
                target_raw = harga_modal / 0.85
                harga_jual = math.ceil(target_raw / 500) * 500
                
                supabase_admin.table("katalog_produk").insert({
                    "user_id": user_id,
                    "nama": nama,
                    "harga_modal": harga_modal,
                    "harga_jual": harga_jual,
                    "kategori": "Umum",
                    "satuan": "pcs",
                    "stok": clean_int(item.get("jumlah", 0)),
                    "target_margin_persen": 15.0
                }).execute()
            items_ditambahkan += 1
            
        total_res = supabase_admin.table("katalog_produk").select("id").eq("user_id", user_id).execute()
        total_katalog = len(total_res.data) if total_res.data else 0

        return JSONResponse({
            "status": "success",
            "items_ditambahkan": items_ditambahkan,
            "total_katalog": total_katalog,
            "detail": nota_result
        })
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, f"Gagal proses nota: {str(e)}")
    finally:
        if os.path.exists(path):
            os.unlink(path)

@router.post("/scan/label-rak")
async def scan_label(
    file: UploadFile = File(...),
    target_margin: float = 15.0,
    user_id: str = Depends(get_current_user_id)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File harus gambar (jpg/png)")
    suffix = os.path.splitext(file.filename or ".jpg")[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        path = tmp.name
    try:
        label = get_pipeline().ocr.scan_label_rak(path)
        nama_terdeteksi = str(label.get("nama", "")).strip()
        harga_rak = clean_int(label.get("harga_jual", 0))

        if not nama_terdeteksi or harga_rak <= 0:
            return JSONResponse({"status": "error", "pesan": "Gagal baca label rak"})

        result = supabase_admin.table("katalog_produk")\
            .select("harga_modal, nama")\
            .eq("user_id", user_id)\
            .ilike("nama", nama_terdeteksi)\
            .limit(1)\
            .execute()

        harga_modal = None
        nama_di_nota = None
        match_score = 1.0
        match_stage = "exact"

        if result.data:
            harga_modal = float(clean_int(result.data[0]["harga_modal"]))
            nama_di_nota = result.data[0]["nama"]
        else:
            all_katalog = supabase_admin.table("katalog_produk")\
                .select("nama, harga_modal")\
                .eq("user_id", user_id)\
                .execute()
            katalog_data = all_katalog.data or []
            if katalog_data:
                matcher = get_pipeline().matcher
                matcher.load_catalog([row["nama"] for row in katalog_data])
                cocok, skor, stage = matcher.find_match(nama_terdeteksi)
                if cocok:
                    nama_di_nota = cocok
                    match_score = skor
                    match_stage = stage
                    for row in katalog_data:
                        if row["nama"] == cocok:
                            harga_modal = float(clean_int(row["harga_modal"]))
                            break

        if harga_modal is None or harga_modal <= 0:
            return JSONResponse({
                "status": "not_found",
                "nama_label": nama_terdeteksi,
                "harga_rak": harga_rak,
                "pesan": f"'{nama_terdeteksi}' tidak ditemukan di database nota"
            })

        r = analisis_produk(nama_terdeteksi, harga_modal, harga_rak, target_margin)

        if r.status == "bahaya":
            pesan = (f"🚨 RUGI! Margin {r.margin_persen:.1f}%. "
                     f"Naikkan harga ke Rp{r.harga_rekomendasi:,.0f} "
                     f"→ untung Rp{r.keuntungan_per_item:,.0f}/barang.")
        elif r.status == "tipis":
            pesan = (f"⚡ Margin {r.margin_persen:.1f}% tipis. "
                     f"Disarankan naikkan ke Rp{r.harga_rekomendasi:,.0f}.")
        else:
            pesan = f"✅ Margin {r.margin_persen:.1f}% — harga rak sudah oke."

        return JSONResponse({
            "status": "success",
            "nama_label_rak":   nama_terdeteksi,
            "nama_di_nota":     nama_di_nota,
            "match_score":      match_score,
            "match_stage":      match_stage,
            "harga_modal":      harga_modal,
            "harga_rak":        harga_rak,
            "margin_persen":    r.margin_persen,
            "status_margin":    r.status,
            "perlu_update_harga": r.perlu_update,
            "harga_rekomendasi": r.harga_rekomendasi,
            "keuntungan_per_item": r.keuntungan_per_item,
            "pesan": pesan,
        })
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, f"Gagal audit label: {str(e)}")
    finally:
        if os.path.exists(path):
            os.unlink(path)

@router.delete("/katalog/reset")
def reset(user_id: str = Depends(get_current_user_id)):
    supabase_admin.table("katalog_produk").delete().eq("user_id", user_id).execute()
    return {"status": "success", "pesan": "Katalog berhasil direset"}
