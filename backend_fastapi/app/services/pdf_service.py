import os
from typing import List

try:
    import pymupdf as fitz
except ImportError:
    try:
        import fitz
    except ImportError:
        fitz = None

def pdf_to_images(pdf_path: str, output_folder: str, dpi: int = 200) -> List[str]:
    """
    Renders every page of a PDF file to high-resolution PNG image.
    """
    os.makedirs(output_folder, exist_ok=True)
    generated_images = []

    if fitz is None:
        raise RuntimeError("PyMuPDF (fitz) is not installed.")

    doc = fitz.open(pdf_path)
    zoom = dpi / 72.0
    matrix = fitz.Matrix(zoom, zoom)

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        out_image_path = os.path.join(output_folder, f"page_{page_num + 1:04d}.png")
        pix.save(out_image_path)
        generated_images.append(out_image_path)

    doc.close()
    return generated_images

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extracts raw text directly from PDF.
    """
    if fitz is None:
        return ""
    doc = fitz.open(pdf_path)
    full_text = []
    for page in doc:
        full_text.append(page.get_text())
    doc.close()
    return "\n".join(full_text)

