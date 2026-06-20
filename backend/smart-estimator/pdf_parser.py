"""
PDF Parser - Extract construction components from AutoCAD-exported PDF drawings

AutoCAD PDFs typically render schedule table DATA as vector paths (not text),
so traditional table extraction fails. This parser uses multiple strategies:

1. OCR ENHANCEMENT: Render schedule tables as images and OCR them to read
   door/window quantities and dimensions that are invisible to text extraction.
2. LABEL SCANNING: Find door/window/partition labels (P-1, V-1, PM-1) placed
   on the floor plan, count unique instances.
3. ROOM DETECTION: Identify room names from text labels to generate
   floor/wall/ceiling area components.
4. TABLE FALLBACK: If the PDF has proper text-based tables (BoQ spreadsheets),
   extract from those normally.
"""

import re
import math
import logging
from typing import List, Dict, Any, Optional, Tuple

import pdfplumber

# Optional OCR support
try:
    import pytesseract
    from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageDraw
    import numpy as np
    # Set Tesseract path for Windows
    import os
    _tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    if os.path.exists(_tesseract_path):
        pytesseract.pytesseract.tesseract_cmd = _tesseract_path
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

# Optional Groq Vision support (primary OCR method — much better than Tesseract)
import io as _io
import base64 as _base64
import os

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
_GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
VISION_AI_AVAILABLE = False

try:
    from groq import Groq as _Groq
    if GROQ_API_KEY:
        VISION_AI_AVAILABLE = True
except ImportError:
    pass

# Keep old name for backward compat in parse_pdf_file check
GEMINI_AVAILABLE = VISION_AI_AVAILABLE

logger = logging.getLogger(__name__)

# Labor hour estimates per IFC type
LABOR_HOUR_ESTIMATES = {
    'IfcWall': 2.0, 'IfcWallStandardCase': 2.0, 'IfcCurtainWall': 3.0,
    'IfcSlab': 1.5, 'IfcSlabStandardCase': 1.5,
    'IfcColumn': 3.0, 'IfcBeam': 2.5,
    'IfcFooting': 2.5, 'IfcPile': 4.0, 'IfcFoundation': 2.5,
    'IfcRoof': 4.0,
    'IfcWindow': 1.5, 'IfcDoor': 1.0,
    'IfcStair': 3.5, 'IfcStairFlight': 3.0, 'IfcRamp': 2.0,
    'IfcRailing': 1.5, 'IfcCovering': 1.0,
    'IfcPlate': 1.5, 'IfcMember': 2.0,
}

# Room name patterns (Spanish, French, English, Arabic transliteration)
ROOM_KEYWORDS = {
    # Spanish (for this PDF and Latin American plans)
    'dormitorio': 'Dormitorio', 'cocina': 'Cocina', 'comedor': 'Comedor',
    'sala': 'Sala', 'baño': 'Baño', 'sshh': 'Baño',
    'terraza': 'Terraza', 'estudio': 'Estudio', 'jardin': 'Jardin',
    'estacionamiento': 'Estacionamiento', 'piscina': 'Piscina',
    'lavanderia': 'Lavanderia', 'closet': 'Closet',
    'recibo': 'Recibo', 'estar': 'Estar',
    'hall': 'Hall', 'ingreso': 'Ingreso',
    # French
    'chambre': 'Chambre', 'cuisine': 'Cuisine',
    'salon': 'Salon', 'sejour': 'Séjour', 'séjour': 'Séjour',
    'salle de bain': 'Salle de bain', 'wc': 'WC',
    'garage': 'Garage', 'balcon': 'Balcon',
    'bureau': 'Bureau', 'entree': 'Entrée', 'entrée': 'Entrée',
    'couloir': 'Couloir',
    # English
    'bedroom': 'Bedroom', 'kitchen': 'Kitchen',
    'living': 'Living Room', 'bathroom': 'Bathroom',
    'garage': 'Garage', 'balcony': 'Balcony',
    'office': 'Office', 'lobby': 'Lobby',
}

# Keyword to IFC type mapping
DESCRIPTION_TO_IFC = {
    'wall': 'IfcWall', 'mur': 'IfcWall', 'cloison': 'IfcWall', 'paroi': 'IfcWall',
    'voile': 'IfcWall', 'parpaing': 'IfcWall', 'brique': 'IfcWall',
    'slab': 'IfcSlab', 'dalle': 'IfcSlab', 'floor': 'IfcSlab', 'plancher': 'IfcSlab',
    'dallage': 'IfcSlab', 'chape': 'IfcSlab', 'radier': 'IfcSlab', 'piso': 'IfcSlab',
    'column': 'IfcColumn', 'poteau': 'IfcColumn', 'pilier': 'IfcColumn',
    'beam': 'IfcBeam', 'poutre': 'IfcBeam', 'linteau': 'IfcBeam', 'chainag': 'IfcBeam',
    'footing': 'IfcFooting', 'fondation': 'IfcFooting', 'semelle': 'IfcFooting',
    'foundation': 'IfcFooting', 'longrine': 'IfcFooting',
    'door': 'IfcDoor', 'porte': 'IfcDoor', 'puerta': 'IfcDoor',
    'window': 'IfcWindow', 'fenetre': 'IfcWindow', 'fenêtre': 'IfcWindow', 'ventana': 'IfcWindow',
    'roof': 'IfcRoof', 'toiture': 'IfcRoof', 'couverture': 'IfcRoof', 'acrotere': 'IfcRoof',
    'stair': 'IfcStair', 'escalier': 'IfcStair', 'escalera': 'IfcStair',
    'railing': 'IfcRailing', 'garde-corps': 'IfcRailing', 'balustrade': 'IfcRailing',
    'ramp': 'IfcRamp', 'rampe': 'IfcRamp', 'rampa': 'IfcRamp',
    'excavation': 'IfcFooting', 'terrassement': 'IfcFooting',
    'concrete': 'IfcSlab', 'beton': 'IfcSlab', 'béton': 'IfcSlab', 'hormigon': 'IfcSlab',
    'steel': 'IfcMember', 'acier': 'IfcMember', 'acero': 'IfcMember',
    'enduit': 'IfcCovering', 'revetement': 'IfcCovering', 'carrelage': 'IfcCovering',
    'ceramico': 'IfcCovering', 'porcelanato': 'IfcCovering',
    'peinture': 'IfcCovering', 'paint': 'IfcCovering', 'pintura': 'IfcCovering',
    'mampara': 'IfcCurtainWall', 'curtain': 'IfcCurtainWall',
}

# Unit keyword mapping
UNIT_KEYWORDS = {
    'm3': 'm3', 'm³': 'm3', 'mc': 'm3', 'cubic': 'm3',
    'm2': 'm2', 'm²': 'm2', 'sqm': 'm2', 'square': 'm2',
    'ml': 'm', 'm.l': 'm', 'ml.': 'm',
    'u': 'each', 'unit': 'each', 'unite': 'each', 'unité': 'each',
    'pcs': 'each', 'piece': 'each', 'pièce': 'each',
    'kg': 'kg', 't': 'kg', 'tonne': 'kg',
}


def classify_ifc_type(description: str) -> str:
    desc_lower = description.lower()
    for keyword, ifc_type in DESCRIPTION_TO_IFC.items():
        if keyword in desc_lower:
            return ifc_type
    return 'Unknown'


def parse_quantity(text: str) -> Optional[float]:
    if not text:
        return None
    cleaned = text.strip().replace(' ', '')
    if ',' in cleaned and '.' not in cleaned:
        cleaned = cleaned.replace(',', '.')
    match = re.search(r'[-+]?\d+\.?\d*', cleaned)
    if match:
        try:
            val = float(match.group())
            return val if val > 0 else None
        except ValueError:
            return None
    return None


# ============================================================================
# GROQ VISION - PRIMARY TABLE EXTRACTION (high accuracy)
# ============================================================================

def _groq_extract_schedule(page) -> Dict[str, List[Dict]]:
    """
    Use Groq Vision API (Llama 4 Scout) to extract schedule table data from a PDF page.
    Sends the rendered page image and asks the model to read the tables.
    Returns dict with keys 'doors', 'windows', 'partitions'.
    """
    if not VISION_AI_AVAILABLE:
        return {}

    try:
        # Render page at high resolution
        img = page.to_image(resolution=200)
        pil_img = img.original

        # Crop to the right side where schedule tables are
        pw, ph = pil_img.size
        schedule_region = pil_img.crop((int(pw * 0.72), 0, pw, ph))

        # Convert to base64 for Groq
        buf = _io.BytesIO()
        schedule_region.save(buf, format='PNG')
        b64_image = _base64.b64encode(buf.getvalue()).decode()

        prompt = """Look at this construction drawing schedule table image.
Extract ALL rows from the tables you see. These are typically door schedules (CUADRO DE PUERTAS), window schedules (CUADRO DE VENTANAS), and partition schedules (CUADRO DE MAMPARAS).

For each table row, extract:
- label: the identifier (e.g. P-1, P-2, V-1, V-2, PM-1, etc. where P=door/puerta, V=window/ventana, PM=partition/mampara)
- width: the width dimension in meters (e.g. 0.90, 1.20)
- height: the height dimension in meters (e.g. 2.20, 1.50)
- quantity: the count/quantity (integer, e.g. 1, 2, 3, 10)

IMPORTANT: Read the quantity numbers very carefully. Bold numbers can be tricky.

Return ONLY valid JSON in this exact format, no other text:
{
  "doors": [{"label": "P-1", "width": 0.90, "height": 2.20, "quantity": 2}, ...],
  "windows": [{"label": "V-1", "width": 1.20, "height": 1.50, "quantity": 3}, ...],
  "partitions": [{"label": "PM-1", "width": 3.00, "height": 2.50, "quantity": 1}, ...]
}

If a table section is empty or not visible, use an empty array [].
If you cannot read a value, skip that row entirely.
"""

        client = _Groq(api_key=_GROQ_API_KEY)
        response = client.chat.completions.create(
            model=_GROQ_MODEL,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_image}"}},
                ],
            }],
            max_tokens=2000,
            temperature=0.1,
        )

        text = response.choices[0].message.content.strip()

        # Extract JSON from response (may be wrapped in ```json ... ```)
        if '```' in text:
            text = text.split('```')[1]
            if text.startswith('json'):
                text = text[4:]
            text = text.strip()

        import json
        data = json.loads(text)

        results = {}
        for section in ['doors', 'windows', 'partitions']:
            entries = data.get(section, [])
            valid_entries = []
            for entry in entries:
                label = entry.get('label', '')
                qty = entry.get('quantity')
                if label and qty and isinstance(qty, (int, float)) and 0 < qty <= 50:
                    # Fix garbled partition labels (P�-1 → PM-1)
                    clean_label = label.upper().replace(' ', '')
                    if section == 'partitions' and not clean_label.startswith('PM'):
                        clean_label = 'PM-' + clean_label.split('-')[-1]
                    valid_entries.append({
                        'label': clean_label,
                        'width': float(entry.get('width', 0) or 0),
                        'height': float(entry.get('height', 0) or 0),
                        'quantity': int(qty),
                        'description': '',
                    })
            if valid_entries:
                results[section] = valid_entries

        logger.info(f"Groq Vision extracted: {', '.join(f'{k}={len(v)}' for k, v in results.items())}")
        return results

    except Exception as e:
        logger.warning(f"Groq Vision extraction failed: {e}")
        return {}


# Backward compat alias
_gemini_extract_schedule = _groq_extract_schedule


# ============================================================================
# OCR-BASED SCHEDULE TABLE EXTRACTION (Tesseract fallback, cell-by-cell)
# ============================================================================

def _detect_table_grid(gray_array) -> Tuple[List[int], List[int]]:
    """Detect horizontal and vertical grid lines from a grayscale numpy array."""
    h, w = gray_array.shape

    # Horizontal lines: rows where >30% of pixels are dark
    row_darkness = np.mean(gray_array < 80, axis=1)
    h_lines_raw = []
    in_line = False
    line_start = 0
    for y in range(h):
        if row_darkness[y] > 0.3:
            if not in_line:
                line_start = y
                in_line = True
        else:
            if in_line:
                h_lines_raw.append((line_start + y) // 2)
                in_line = False
    # Filter: keep lines at least 30px apart
    h_lines = []
    for y in h_lines_raw:
        if not h_lines or (y - h_lines[-1]) > 30:
            h_lines.append(y)

    # Vertical lines: scan the header row area only (less noise from text)
    if len(h_lines) >= 3:
        header_strip = gray_array[h_lines[1]:h_lines[2], :]
    else:
        header_strip = gray_array[:max(h // 4, 1), :]

    col_darkness = np.mean(header_strip < 80, axis=0)
    v_lines_raw = []
    in_line = False
    line_start = 0
    for x in range(w):
        if col_darkness[x] > 0.5:
            if not in_line:
                line_start = x
                in_line = True
        else:
            if in_line:
                v_lines_raw.append((line_start + x) // 2)
                in_line = False
    # Filter: keep lines at least 60px apart
    v_lines = []
    for x in v_lines_raw:
        if not v_lines or (x - v_lines[-1]) > 60:
            v_lines.append(x)

    return h_lines, v_lines


def _ocr_cell_all(table_img, x1, y1, x2, y2, padding=5) -> List[str]:
    """OCR a single table cell with multiple preprocessing strategies.
    Returns all non-empty results for the caller to choose from."""
    cx1 = x1 + padding
    cy1 = y1 + padding
    cx2 = x2 - padding
    cy2 = y2 - padding
    if cx2 <= cx1 + 3 or cy2 <= cy1 + 3:
        return []

    cell = table_img.crop((cx1, cy1, cx2, cy2))
    cw, ch = cell.size

    candidates = []
    # Multiple combos for bold AutoCAD fonts
    for scale, thresh in [(5, 120), (5, 140), (5, 150), (6, 140), (8, 120)]:
        try:
            c = cell.resize((cw * scale, ch * scale), Image.LANCZOS)
            c = c.convert('L')
            c = ImageEnhance.Contrast(c).enhance(2.5)
            c = c.point(lambda px, t=thresh: 0 if px < t else 255)
            # Morphological dilation to thicken thin strokes (helps Tesseract)
            c = c.filter(ImageFilter.MinFilter(3))
            c = ImageOps.expand(c, border=20, fill=255)
            text = pytesseract.image_to_string(c, config='--psm 7 --oem 3').strip()
            text = text.replace('|', '').replace('[', '').replace(']', '').strip()
            if text:
                candidates.append(text)
        except Exception:
            pass

    # Also try with digit-only whitelist for pure number cells
    try:
        c = cell.resize((cw * 6, ch * 6), Image.LANCZOS)
        c = c.convert('L')
        c = ImageEnhance.Contrast(c).enhance(3.0)
        c = c.point(lambda px: 0 if px < 130 else 255)
        c = ImageOps.expand(c, border=20, fill=255)
        text = pytesseract.image_to_string(
            c, config='--psm 7 --oem 3 -c tessedit_char_whitelist=0123456789'
        ).strip()
        if text:
            candidates.append(text)
    except Exception:
        pass

    return candidates


def _clean_label(text: str) -> Optional[str]:
    """Clean OCR'd label text: P—1 -> P-1, P=5 -> P-5, P35 -> P-3, etc."""
    text = text.strip().upper()
    # Match prefix + separator + single digit (door/window labels are single digit)
    m = re.match(r'^(PM|P|V)[—=~\-.\s]+(\d)(?:\D|$)', text)
    if m:
        return f'{m.group(1)}-{m.group(2)}'
    # No separator: prefix immediately followed by digit (e.g. P35 -> P-3)
    m = re.match(r'^(PM|P|V)(\d)', text)
    if m:
        return f'{m.group(1)}-{m.group(2)}'
    return None


def _clean_quantity(text: str) -> Optional[int]:
    """Clean OCR'd quantity: extract integer, handle common OCR errors."""
    text = text.strip()
    # Remove non-digit chars except for common OCR confusions
    m = re.search(r'(\d+)', text)
    if m:
        return int(m.group(1))
    return None


def _clean_dimension(text: str) -> Optional[float]:
    """Clean OCR'd dimension value (e.g. '2.20', '0.75', '235' -> 2.35)."""
    text = text.strip()
    m = re.match(r'^(\d+\.\d+)$', text)
    if m:
        return float(m.group(1))
    # Handle missing decimal point (e.g. '235' -> 2.35 if reasonable)
    m = re.match(r'^(\d{3,4})$', text)
    if m:
        val = int(m.group(1))
        if 50 < val < 999:
            return val / 100.0
    m = re.search(r'(\d+\.?\d*)', text)
    if m:
        val = float(m.group(1))
        if 0.1 <= val <= 20:
            return val
    return None


def _ocr_schedule_tables(page) -> Dict[str, List[Dict]]:
    """
    OCR schedule tables using cell-by-cell extraction.
    Renders the page, detects table grids, crops individual cells, and OCRs each.
    Returns dict with keys 'doors', 'windows', 'partitions'.
    """
    if not OCR_AVAILABLE:
        return {}

    try:
        img = page.to_image(resolution=400)
        pw, ph = img.original.size

        # Schedule tables are on the right side of the page
        x_start = int(pw * 0.76)
        x_end = int(pw * 0.955)

        results = {}

        # Each section of the schedule: (name, y_start_pct, y_end_pct, label_prefix)
        sections = [
            ("doors", 0.08, 0.24, "P"),
            ("windows", 0.24, 0.44, "V"),
            ("partitions", 0.40, 0.56, "PM"),
        ]

        for section_name, y1_pct, y2_pct, prefix in sections:
            y1 = int(ph * y1_pct)
            y2 = int(ph * y2_pct)
            table_img = img.original.crop((x_start, y1, x_end, y2))
            gray = np.array(table_img.convert('L'))

            h_lines, v_lines = _detect_table_grid(gray)
            if len(h_lines) < 3 or len(v_lines) < 4:
                continue

            entries = []
            # Skip first 2 rows (title + header), process data rows
            for row_idx in range(2, len(h_lines) - 1):
                row_y1 = h_lines[row_idx]
                row_y2 = h_lines[row_idx + 1]
                if row_y2 - row_y1 < 15:
                    continue

                # Extract all OCR candidates for each cell
                tipo_all = _ocr_cell_all(table_img, v_lines[0], row_y1, v_lines[1], row_y2)
                ancho_all = _ocr_cell_all(table_img, v_lines[1], row_y1, v_lines[2], row_y2) if len(v_lines) > 2 else []
                alto_all = _ocr_cell_all(table_img, v_lines[2], row_y1, v_lines[3], row_y2) if len(v_lines) > 3 else []
                cant_all = _ocr_cell_all(table_img, v_lines[3], row_y1, v_lines[4], row_y2) if len(v_lines) > 4 else []

                # For TIPO: take first result that produces a valid label
                label = None
                for t in tipo_all:
                    label = _clean_label(t)
                    if label and label.startswith(prefix):
                        break
                    label = None
                if not label:
                    continue

                # For dimensions: take first valid result
                width = None
                for t in ancho_all:
                    width = _clean_dimension(t)
                    if width:
                        break
                height = None
                for t in alto_all:
                    height = _clean_dimension(t)
                    if height:
                        break

                # For quantity: take most common valid integer
                from collections import Counter
                qty_candidates = []
                for t in cant_all:
                    q = _clean_quantity(t)
                    if q and q > 0:
                        qty_candidates.append(q)
                if qty_candidates:
                    quantity = Counter(qty_candidates).most_common(1)[0][0]
                else:
                    quantity = None

                # Sanity check: quantities should be reasonable for construction
                if quantity and 0 < quantity <= 50:
                    entries.append({
                        'label': label,
                        'width': width or 0.0,
                        'height': height or 0.0,
                        'quantity': quantity,
                        'description': '',
                    })
                    logger.debug(f"OCR {section_name}: {label} w={width} h={height} qty={quantity} "
                                 f"(raw: tipo={tipo_all} cant={cant_all})")

            if entries:
                results[section_name] = entries

        return results

    except Exception as e:
        logger.warning(f"OCR schedule extraction failed: {e}")
        return {}


def _safe_float(text: str) -> float:
    try:
        return float(text)
    except (ValueError, TypeError):
        return 0.0


# ============================================================================
# AUTOCAD ARCHITECTURAL PDF: LABEL-BASED EXTRACTION
# ============================================================================

def _extract_words_with_positions(page) -> List[Dict]:
    """Extract all words with their x,y positions from a PDF page."""
    return page.extract_words(keep_blank_chars=False, x_tolerance=3, y_tolerance=3)


def _find_nearby_dimensions(words: List[Dict], target_word: Dict, search_radius: float = 40) -> List[float]:
    """Find numeric dimension values near a target word on the drawing."""
    dimensions = []
    tx, ty = target_word['x0'], target_word['top']

    for w in words:
        if w is target_word:
            continue
        dx = abs(w['x0'] - tx)
        dy = abs(w['top'] - ty)
        dist = math.sqrt(dx*dx + dy*dy)
        if dist > search_radius:
            continue
        # Check if it looks like a dimension (number, possibly with decimal)
        text = w['text'].strip()
        match = re.match(r'^(\d+\.?\d*)$', text)
        if match:
            val = float(match.group(1))
            if 0.1 < val < 20:  # Reasonable architectural dimension in meters
                dimensions.append(val)

    return sorted(dimensions, reverse=True)


def _extract_labels_from_drawing(page) -> Tuple[Dict[str, List[Dict]], List[Dict]]:
    """
    Scan page for door/window/partition labels (P-N, V-N, PM-N patterns).
    Also searches within longer garbled text strings (common in AutoCAD PDFs).
    Returns dict: {'P-1': [word1, word2, ...], 'V-3': [word1], ...}
    """
    words = _extract_words_with_positions(page)
    labels = {}

    for w in words:
        text = w['text'].strip()

        # Exact match first
        if re.match(r'^P-\d+$', text):
            labels.setdefault(text, []).append(w)
        elif re.match(r'^V-\d+$', text):
            labels.setdefault(text, []).append(w)
        elif re.match(r'^PM-\d+$', text):
            labels.setdefault(text, []).append(w)
        else:
            # Search within garbled text (AutoCAD often merges nearby text)
            for m in re.finditer(r'(?<![A-Za-z])P-(\d+)(?![A-Za-z\d])', text):
                label = f"P-{m.group(1)}"
                labels.setdefault(label, []).append(w)
            for m in re.finditer(r'(?<![A-Za-z])V-(\d+)(?![A-Za-z\d])', text):
                label = f"V-{m.group(1)}"
                labels.setdefault(label, []).append(w)
            for m in re.finditer(r'(?<![A-Za-z])PM-(\d+)(?![A-Za-z\d])', text):
                label = f"PM-{m.group(1)}"
                labels.setdefault(label, []).append(w)

    return labels, words


def _extract_rooms_from_drawing(page, words: List[Dict]) -> List[Dict]:
    """
    Find room name labels on the floor plan.
    Also builds full text from chars for better room detection in garbled AutoCAD text.
    """
    rooms = []
    found_positions = set()

    # First pass: direct word matching
    for w in words:
        text = w['text'].strip()
        text_lower = text.lower()

        # Skip very short or very long texts (noise)
        if len(text) < 3 or len(text) > 50:
            continue

        for keyword, room_name in ROOM_KEYWORDS.items():
            if keyword in text_lower:
                pos_key = f"{round(w['x0']/30)}_{round(w['top']/30)}"
                if pos_key not in found_positions:
                    found_positions.add(pos_key)
                    # Clean the name - take just the meaningful part
                    clean_name = text.split('\n')[0].strip()
                    if len(clean_name) > 30:
                        clean_name = room_name
                    rooms.append({
                        'name': clean_name,
                        'room_type': room_name,
                        'x': w['x0'],
                        'y': w['top'],
                    })
                break

    # Second pass: search in page chars for room names embedded in garbled text
    try:
        chars = page.chars
        char_groups = {}
        for c in chars:
            row_key = round(c['top'] / 3) * 3
            char_groups.setdefault(row_key, []).append(c)

        for row_key, chs in char_groups.items():
            chs.sort(key=lambda c: c['x0'])
            row_text = ''.join(c['text'] for c in chs).lower()
            for keyword, room_name in ROOM_KEYWORDS.items():
                if keyword in row_text:
                    x_avg = sum(c['x0'] for c in chs) / len(chs)
                    pos_key = f"{round(x_avg/30)}_{round(row_key/30)}"
                    if pos_key not in found_positions:
                        found_positions.add(pos_key)
                        rooms.append({
                            'name': room_name,
                            'room_type': room_name,
                            'x': x_avg,
                            'y': row_key,
                        })
    except Exception:
        pass

    return rooms


def _find_floor_levels(words: List[Dict]) -> List[str]:
    """Find N.P.T (floor level) values from the drawing."""
    levels = set()
    full_text = ' '.join(w['text'] for w in sorted(words, key=lambda w: (w['top'], w['x0'])))
    for m in re.finditer(r'N\.?P\.?T\.?\s*\+?\s*(\d+\.?\d*)', full_text):
        levels.add(m.group(1))
    return sorted(levels)


def _find_stairs(words: List[Dict]) -> int:
    """Count staircase references in the drawing."""
    count = 0
    for w in words:
        if 'escalera' in w['text'].lower() or 'escalier' in w['text'].lower() or 'stair' in w['text'].lower():
            count += 1
    return min(count, 4)  # Cap at reasonable number


def _deduplicate_label_instances(instances: List[Dict], min_dist: float = 20) -> List[Dict]:
    """Remove duplicate detections at nearly the same position."""
    unique = []
    for inst in instances:
        is_dup = False
        for u in unique:
            dx = abs(inst['x0'] - u['x0'])
            dy = abs(inst['top'] - u['top'])
            if dx < min_dist and dy < min_dist:
                is_dup = True
                break
        if not is_dup:
            unique.append(inst)
    return unique


def _build_components_from_labels(labels: Dict[str, List[Dict]], words: List[Dict],
                                   ocr_data: Optional[Dict] = None) -> List[Dict[str, Any]]:
    """
    Build construction components from detected labels, enhanced with OCR data.
    OCR provides quantities and dimensions from the schedule table when available.
    Label scanning provides a fallback count from the floor plan.
    """
    components = []
    comp_idx = 0

    # Build OCR lookup: label -> {width, height, quantity, description}
    ocr_doors = {e['label']: e for e in (ocr_data or {}).get('doors', [])}
    ocr_windows = {e['label']: e for e in (ocr_data or {}).get('windows', [])}
    ocr_partitions = {e['label']: e for e in (ocr_data or {}).get('partitions', [])}

    # Process doors (P-N labels)
    door_labels = {k: v for k, v in labels.items() if k.startswith('P-')}
    # Also add any doors found by OCR but not by label scanning
    for label in ocr_doors:
        if label not in door_labels:
            door_labels[label] = []

    for label, instances in sorted(door_labels.items()):
        unique = _deduplicate_label_instances(instances)
        label_count = len(unique)

        ocr_entry = ocr_doors.get(label, {})
        # Prefer OCR quantity if available and reasonable
        count = ocr_entry.get('quantity', label_count) or label_count
        if count < 1:
            count = max(label_count, 1)

        desc = f"Puerta {label}"
        if ocr_entry.get('description'):
            desc = f"Puerta {label} - {ocr_entry['description']}"
        elif ocr_entry.get('width') and ocr_entry.get('height'):
            desc = f"Puerta {label} ({ocr_entry['width']:.2f}m x {ocr_entry['height']:.2f}m)"

        components.append({
            "id": f"pdf_comp_{comp_idx + 1:04d}",
            "ifc_type": "IfcDoor",
            "description": desc,
            "quantity": float(count),
            "unit": "each",
            "material_code": "PDF_IfcDoor",
            "base_material_price": 0,
            "labor_hours_base": LABOR_HOUR_ESTIMATES.get('IfcDoor', 1.0),
            "labor_rate_per_hour": 300.0,
            "source": "pdf_ocr" if ocr_entry else "pdf",
            "needs_pricing": True,
        })
        comp_idx += 1

    # Process windows (V-N labels)
    window_labels = {k: v for k, v in labels.items() if k.startswith('V-')}
    for label in ocr_windows:
        if label not in window_labels:
            window_labels[label] = []

    for label, instances in sorted(window_labels.items()):
        unique = _deduplicate_label_instances(instances)
        label_count = len(unique)

        ocr_entry = ocr_windows.get(label, {})
        count = ocr_entry.get('quantity', label_count) or label_count
        if count < 1:
            count = max(label_count, 1)

        # Calculate area from OCR dimensions or use default
        w = ocr_entry.get('width', 1.20)
        h = ocr_entry.get('height', 1.20)
        if w and h and w > 0 and h > 0:
            area_per = w * h
        else:
            area_per = 1.44  # default 1.2 x 1.2

        components.append({
            "id": f"pdf_comp_{comp_idx + 1:04d}",
            "ifc_type": "IfcWindow",
            "description": f"Ventana {label} ({w:.2f}m x {h:.2f}m) x{count}",
            "quantity": round(area_per * count, 2),
            "unit": "m2",
            "material_code": "PDF_IfcWindow",
            "base_material_price": 0,
            "labor_hours_base": LABOR_HOUR_ESTIMATES.get('IfcWindow', 1.5),
            "labor_rate_per_hour": 300.0,
            "source": "pdf_ocr" if ocr_entry else "pdf",
            "needs_pricing": True,
        })
        comp_idx += 1

    # Process glass partitions (PM-N labels)
    partition_labels = {k: v for k, v in labels.items() if k.startswith('PM-')}
    for label in ocr_partitions:
        if label not in partition_labels:
            partition_labels[label] = []

    for label, instances in sorted(partition_labels.items()):
        unique = _deduplicate_label_instances(instances)
        label_count = len(unique)

        ocr_entry = ocr_partitions.get(label, {})
        count = ocr_entry.get('quantity', label_count) or label_count
        if count < 1:
            count = max(label_count, 1)

        w = ocr_entry.get('width', 3.0)
        h = ocr_entry.get('height', 2.5)
        if w and h and w > 0 and h > 0:
            area_per = w * h
        else:
            area_per = 7.5

        components.append({
            "id": f"pdf_comp_{comp_idx + 1:04d}",
            "ifc_type": "IfcCurtainWall",
            "description": f"Mampara {label} ({w:.2f}m x {h:.2f}m) x{count}",
            "quantity": round(area_per * count, 2),
            "unit": "m2",
            "material_code": "PDF_IfcCurtainWall",
            "base_material_price": 0,
            "labor_hours_base": LABOR_HOUR_ESTIMATES.get('IfcCurtainWall', 3.0),
            "labor_rate_per_hour": 300.0,
            "source": "pdf_ocr" if ocr_entry else "pdf",
            "needs_pricing": True,
        })
        comp_idx += 1

    return components


def _build_components_from_rooms(rooms: List[Dict], levels: List[str]) -> List[Dict[str, Any]]:
    """Generate floor/wall components from detected room names."""
    components = []
    comp_idx = 100  # Start at 100 to avoid ID collision

    # Deduplicate rooms by name
    unique_rooms = {}
    for room in rooms:
        key = room['room_type']
        if key not in unique_rooms:
            unique_rooms[key] = room
        else:
            # If same room type appears again, it's likely on another floor
            existing = unique_rooms[key]
            alt_key = f"{key}_2"
            unique_rooms[alt_key] = room

    # Estimated floor areas per room type (m2) - reasonable defaults
    room_area_estimates = {
        'Dormitorio': 12.0, 'Cocina': 10.0, 'Comedor': 12.0,
        'Sala': 18.0, 'Baño': 5.0, 'Terraza': 10.0,
        'Estudio': 10.0, 'Jardin': 15.0, 'Estacionamiento': 20.0,
        'Piscina': 12.0, 'Lavanderia': 6.0, 'Closet': 4.0,
        'Recibo': 8.0, 'Estar': 12.0, 'Hall': 8.0, 'Ingreso': 6.0,
        'Chambre': 12.0, 'Cuisine': 10.0, 'Salon': 18.0,
        'Séjour': 20.0, 'Salle de bain': 5.0, 'WC': 3.0,
        'Garage': 25.0, 'Balcon': 6.0, 'Bureau': 10.0,
        'Entrée': 6.0, 'Couloir': 8.0,
        'Bedroom': 12.0, 'Kitchen': 10.0, 'Living Room': 20.0,
        'Bathroom': 5.0, 'Balcony': 6.0, 'Office': 10.0, 'Lobby': 8.0,
    }

    for key, room in unique_rooms.items():
        room_type = room['room_type']
        area = room_area_estimates.get(room_type, 10.0)

        # Skip outdoor areas for floor tile component
        if room_type in ('Jardin', 'Piscina', 'Terraza', 'Estacionamiento'):
            continue

        components.append({
            "id": f"pdf_comp_{comp_idx:04d}",
            "ifc_type": "IfcSlab",
            "description": f"Floor - {room['name']}",
            "quantity": area,
            "unit": "m2",
            "material_code": "PDF_IfcSlab",
            "base_material_price": 0,
            "labor_hours_base": LABOR_HOUR_ESTIMATES.get('IfcSlab', 1.5),
            "labor_rate_per_hour": 300.0,
            "source": "pdf",
            "needs_pricing": True,
        })
        comp_idx += 1

    return components


# ============================================================================
# TABLE-BASED EXTRACTION (for BoQ-style PDFs with text tables)
# ============================================================================

def _is_header_row(row: list) -> bool:
    if not row:
        return False
    text = ' '.join(str(cell or '').lower() for cell in row)
    header_keywords = [
        'designation', 'désignation', 'description', 'libelle', 'libellé',
        'quantity', 'quantité', 'quantite', 'qty', 'qté',
        'unit', 'unité', 'unite',
        'price', 'prix', 'p.u', 'pu',
        'total', 'montant', 'amount',
        'n°', 'no', 'num', 'ref', 'poste',
    ]
    matches = sum(1 for kw in header_keywords if kw in text)
    return matches >= 2


def _detect_column_roles(headers: list) -> Dict[str, int]:
    roles = {}
    for idx, header in enumerate(headers):
        if header is None:
            continue
        h = str(header).lower().strip()
        if h in ('n°', 'no', 'num', 'ref', 'n', '#', 'poste', 'item'):
            roles.setdefault('ref', idx)
        elif any(kw in h for kw in ['design', 'désign', 'description', 'libel', 'ouvrage', 'nature', 'travaux']):
            roles.setdefault('description', idx)
        elif any(kw in h for kw in ['quant', 'qty', 'qté', 'qte', 'vol', 'surface', 'nombre', 'cant']):
            roles.setdefault('quantity', idx)
        elif h in ('u', 'u.', 'unité', 'unite', 'unit', 'un'):
            roles.setdefault('unit', idx)
        elif any(kw in h for kw in ['p.u', 'pu', 'prix unitaire', 'unit price', 'precio']):
            roles.setdefault('unit_price', idx)
        elif any(kw in h for kw in ['total', 'montant', 'amount', 'cout', 'coût', 'cost']):
            roles.setdefault('total', idx)
    return roles


def _extract_components_from_table(table: list) -> List[Dict[str, Any]]:
    if not table or len(table) < 2:
        return []

    components = []
    header_idx = None
    for i, row in enumerate(table):
        if _is_header_row(row):
            header_idx = i
            break
    if header_idx is None:
        header_idx = 0

    headers = table[header_idx]
    roles = _detect_column_roles(headers)

    if 'description' not in roles:
        for row in table[header_idx + 1:header_idx + 4]:
            if row:
                max_len = 0
                max_idx = 0
                for idx, cell in enumerate(row):
                    cell_len = len(str(cell or ''))
                    if cell_len > max_len and idx not in roles.values():
                        max_len = cell_len
                        max_idx = idx
                if max_len > 5:
                    roles['description'] = max_idx
                    break

    if 'description' not in roles:
        return []

    for row_idx, row in enumerate(table[header_idx + 1:], start=header_idx + 1):
        if not row:
            continue
        desc_idx = roles.get('description', 0)
        if desc_idx >= len(row):
            continue
        description = str(row[desc_idx] or '').strip()
        if not description or len(description) < 3:
            continue
        desc_lower = description.lower()
        if any(kw in desc_lower for kw in ['total', 'sous-total', 'sub-total', 'montant', 's/total']):
            continue

        quantity = None
        if 'quantity' in roles and roles['quantity'] < len(row):
            quantity = parse_quantity(str(row[roles['quantity']] or ''))

        unit = 'each'
        if 'unit' in roles and roles['unit'] < len(row):
            unit_text = str(row[roles['unit']] or '')
            for kw, u in UNIT_KEYWORDS.items():
                if kw in unit_text.lower():
                    unit = u
                    break

        unit_price = 0.0
        if 'unit_price' in roles and roles['unit_price'] < len(row):
            parsed_price = parse_quantity(str(row[roles['unit_price']] or ''))
            if parsed_price is not None:
                unit_price = parsed_price

        ifc_type = classify_ifc_type(description)
        if quantity is None or quantity <= 0:
            quantity = 1.0
        labor_hours = LABOR_HOUR_ESTIMATES.get(ifc_type, 1.0)

        components.append({
            "id": f"pdf_tbl_{row_idx:04d}",
            "ifc_type": ifc_type,
            "description": description,
            "quantity": quantity,
            "unit": unit,
            "material_code": f"PDF_{ifc_type}",
            "base_material_price": unit_price,
            "labor_hours_base": labor_hours,
            "labor_rate_per_hour": 300.0,
            "source": "pdf",
            "needs_pricing": unit_price == 0,
        })

    return components


# ============================================================================
# MAIN PARSE FUNCTION
# ============================================================================

def parse_pdf_file(filepath: str) -> List[Dict[str, Any]]:
    """
    Parse an AutoCAD-exported PDF and extract construction components.

    Strategy:
    1. Try table extraction (works for BoQ-style PDFs with text tables)
    2. Scan for architectural labels (P-N, V-N, PM-N) on floor plans
    3. Detect room names for floor/wall area estimation
    4. Detect stairs and other structural elements
    """
    logger.info(f"Parsing PDF file: {filepath}")
    table_components = []
    label_components = []
    room_components = []

    try:
        with pdfplumber.open(filepath) as pdf:
            logger.info(f"PDF has {len(pdf.pages)} pages")

            all_labels = {}
            all_rooms = []
            all_levels = []
            all_words = []
            has_stairs = False
            ocr_data_combined = {}

            for page_num, page in enumerate(pdf.pages, start=1):
                # Strategy 1: Try table extraction
                tables = page.extract_tables()
                if tables:
                    for table_idx, table in enumerate(tables):
                        if table and len(table) >= 2:
                            comps = _extract_components_from_table(table)
                            if comps:
                                logger.info(f"Page {page_num}, Table {table_idx + 1}: {len(comps)} components")
                                table_components.extend(comps)

                # Strategy 2: Scan for architectural labels
                labels, words = _extract_labels_from_drawing(page)
                all_words = words  # Keep last page's words for reference
                for label_key, instances in labels.items():
                    all_labels.setdefault(label_key, []).extend(instances)

                # Strategy 2b: Extract schedule tables (Gemini Vision primary, Tesseract fallback)
                ocr_data = {}
                if GEMINI_AVAILABLE:
                    ocr_data = _gemini_extract_schedule(page)
                    if ocr_data:
                        logger.info(f"Page {page_num} Gemini Vision: {', '.join(f'{k}={len(v)}' for k, v in ocr_data.items())}")
                if not ocr_data and OCR_AVAILABLE:
                    logger.info(f"Page {page_num}: Gemini unavailable or returned nothing, falling back to Tesseract OCR")
                    ocr_data = _ocr_schedule_tables(page)
                    if ocr_data:
                        logger.info(f"Page {page_num} Tesseract OCR: {', '.join(f'{k}={len(v)}' for k, v in ocr_data.items())}")
                if ocr_data:
                    for key, entries in ocr_data.items():
                        ocr_data_combined.setdefault(key, []).extend(entries)

                # Strategy 3: Detect rooms
                rooms = _extract_rooms_from_drawing(page, words)
                all_rooms.extend(rooms)

                # Floor levels
                levels = _find_floor_levels(words)
                all_levels.extend(levels)

                # Stairs
                stair_count = _find_stairs(words)
                if stair_count > 0:
                    has_stairs = True

            # Build components from labels, enhanced with OCR data
            if all_labels or ocr_data_combined:
                label_components = _build_components_from_labels(all_labels, all_words, ocr_data=ocr_data_combined)
                logger.info(f"Label scan: {len(label_components)} components from {len(all_labels)} label types")

            # Build components from rooms
            if all_rooms:
                room_components = _build_components_from_rooms(all_rooms, all_levels)
                logger.info(f"Room detection: {len(room_components)} floor area components from {len(all_rooms)} rooms")

    except Exception as e:
        logger.error(f"PDF parsing error: {e}", exc_info=True)
        raise ValueError(f"Failed to parse PDF file: {str(e)}")

    # Combine: use table data only if it produced meaningful results (3+ items
    # with recognized IFC types), otherwise use label+room scanning
    meaningful_table = [c for c in table_components if c['ifc_type'] != 'Unknown']
    if len(meaningful_table) >= 3:
        all_components = table_components
    else:
        all_components = label_components + room_components

    # Add stairs if detected and not already present
    stair_exists = any('stair' in c['ifc_type'].lower() or 'escalera' in c['description'].lower() for c in all_components)
    if has_stairs and not stair_exists:
        all_components.append({
            "id": "pdf_comp_stair",
            "ifc_type": "IfcStair",
            "description": "Escalera (detected from plan)",
            "quantity": 1.0,
            "unit": "each",
            "material_code": "PDF_IfcStair",
            "base_material_price": 0,
            "labor_hours_base": LABOR_HOUR_ESTIMATES.get('IfcStair', 3.5),
            "labor_rate_per_hour": 300.0,
            "source": "pdf",
            "needs_pricing": True,
        })

    # Re-index IDs
    for idx, comp in enumerate(all_components):
        comp['id'] = f"pdf_comp_{idx + 1:04d}"

    logger.info(f"PDF parsing complete: {len(all_components)} total components")
    if not all_components:
        logger.warning("No components extracted from PDF")

    return all_components


def validate_pdf_components(components: list) -> dict:
    """Validate extracted PDF components."""
    issues = {
        "missing_prices": [],
        "missing_labor_hours": [],
        "invalid_quantities": [],
        "unknown_types": [],
        "total_components": len(components),
    }

    for comp in components:
        if comp.get('base_material_price', 0) == 0:
            issues['missing_prices'].append(comp['id'])
        if comp.get('labor_hours_base', 0) == 0:
            issues['missing_labor_hours'].append(comp['id'])
        try:
            qty = float(comp.get('quantity', 0))
            if qty <= 0:
                issues['invalid_quantities'].append(comp['id'])
        except (ValueError, TypeError):
            issues['invalid_quantities'].append(comp['id'])
        if comp.get('ifc_type', 'Unknown') == 'Unknown':
            issues['unknown_types'].append(comp['id'])

    issues['status'] = 'valid' if not any([
        issues['missing_prices'],
        issues['missing_labor_hours'],
        issues['invalid_quantities'],
    ]) else 'has_issues'

    return issues
