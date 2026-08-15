from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pipeline.main_pipeline import MarginPipeline
import tempfile, os, shutil

router   = APIRouter()
_pipeline: MarginPipeline | None = None

def get_pipeline() -> MarginPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = MarginPipeline()
    return _pipeline

@router.get("/health")
def health():
    return {"status": "ok", "service": "Marginku API v1"}

@router.get("/katalog")
def get_katalog():
    p = get_pipeline()
    return {"total": len(p.db.items), "produk": p.db.items}

@router.post("/scan/nota")
async def scan_nota(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File harus gambar (jpg/png)")
    suffix = os.path.splitext(file.filename or ".jpg")[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        path = tmp.name
    try:
        return JSONResponse(get_pipeline().proses_nota(path))
    except Exception as e:
        raise HTTPException(500, f"Gagal proses nota: {e}")
    finally:
        os.unlink(path)

@router.post("/scan/label-rak")
async def scan_label(file: UploadFile = File(...), target_margin: float = 20.0):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File harus gambar (jpg/png)")
    suffix = os.path.splitext(file.filename or ".jpg")[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        path = tmp.name
    try:
        return JSONResponse(get_pipeline().audit_label_rak(path, target_margin))
    except Exception as e:
        raise HTTPException(500, f"Gagal audit label: {e}")
    finally:
        os.unlink(path)

@router.delete("/katalog/reset")
def reset():
    global _pipeline
    _pipeline = None
    return {"status": "ok", "pesan": "Database direset"}
