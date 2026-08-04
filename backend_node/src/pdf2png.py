import sys
import fitz # PyMuPDF

if len(sys.argv) < 4:
    print("Usage: python pdf2png.py <pdf_path> <page_index_0_based> <output_png_path>")
    sys.exit(1)

pdf_path = sys.argv[1]
page_index = int(sys.argv[2])
out_path = sys.argv[3]

doc = fitz.open(pdf_path)
page = doc.load_page(page_index)
pix = page.get_pixmap(dpi=150)
pix.save(out_path)
print("SUCCESS")
