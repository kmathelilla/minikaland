import io
import math
import os
import re
from pathlib import Path
from unicodedata import normalize

from fastapi import HTTPException
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from .schemas import AdventureSheetBonus, AdventureSheetRequest


def _register_adventure_font() -> str:
    font_name = "MiniKalandUnicode"
    if font_name in pdfmetrics.getRegisteredFontNames():
        return font_name

    windows_fonts = Path(os.environ.get("WINDIR", r"C:\Windows")) / "Fonts"
    font_paths = [
        windows_fonts / "arial.ttf",
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"),
        Path("/Library/Fonts/Arial.ttf"),
    ]
    required_glyphs = "ÁÉÍÓÖŐÚÜŰáéíóöőúüű"

    for font_path in font_paths:
        if not font_path.is_file():
            continue
        font = TTFont(font_name, str(font_path))
        if all(ord(character) in font.face.charToGlyph for character in required_glyphs):
            pdfmetrics.registerFont(font)
            return font_name

    raise HTTPException(
        status_code=503,
        detail="A magyar karaktereket támogató PDF-betűtípus nem érhető el.",
    )


def _draw_adventure_symbol(
    pdf: canvas.Canvas,
    symbol: str,
    center_x: float,
    center_y: float,
    size: float,
    color,
) -> None:
    pdf.saveState()
    pdf.setFillColor(color)
    pdf.setStrokeColor(color)
    pdf.setLineWidth(2.5)

    if symbol == "circle":
        pdf.circle(center_x, center_y, size * 0.38, stroke=0, fill=1)
    elif symbol == "square":
        pdf.roundRect(
            center_x - size * 0.32,
            center_y - size * 0.32,
            size * 0.64,
            size * 0.64,
            size * 0.1,
            stroke=0,
            fill=1,
        )
    elif symbol == "triangle":
        path = pdf.beginPath()
        path.moveTo(center_x, center_y + size * 0.4)
        path.lineTo(center_x + size * 0.38, center_y - size * 0.3)
        path.lineTo(center_x - size * 0.38, center_y - size * 0.3)
        path.close()
        pdf.drawPath(path, stroke=0, fill=1)
    elif symbol == "star":
        path = pdf.beginPath()
        for index in range(10):
            angle = math.pi * index / 5 - math.pi / 2
            radius = size * (0.4 if index % 2 == 0 else 0.18)
            x = center_x + radius * math.cos(angle)
            y = center_y + radius * math.sin(angle)
            if index == 0:
                path.moveTo(x, y)
            else:
                path.lineTo(x, y)
        path.close()
        pdf.drawPath(path, stroke=0, fill=1)
    elif symbol == "leaf":
        path = pdf.beginPath()
        path.moveTo(center_x - size * 0.34, center_y - size * 0.25)
        path.curveTo(
            center_x - size * 0.48,
            center_y + size * 0.12,
            center_x - size * 0.04,
            center_y + size * 0.48,
            center_x + size * 0.36,
            center_y + size * 0.3,
        )
        path.curveTo(
            center_x + size * 0.48,
            center_y - size * 0.1,
            center_x + size * 0.04,
            center_y - size * 0.48,
            center_x - size * 0.34,
            center_y - size * 0.25,
        )
        path.close()
        pdf.drawPath(path, stroke=0, fill=1)
        pdf.setStrokeColor(colors.white)
        pdf.line(
            center_x - size * 0.26,
            center_y - size * 0.2,
            center_x + size * 0.25,
            center_y + size * 0.22,
        )
    elif symbol == "footprint":
        pdf.ellipse(
            center_x - size * 0.13,
            center_y - size * 0.35,
            center_x + size * 0.13,
            center_y + size * 0.12,
            stroke=0,
            fill=1,
        )
        for offset, radius in [
            (-0.2, 0.08),
            (-0.08, 0.1),
            (0.07, 0.09),
            (0.2, 0.07),
        ]:
            pdf.circle(
                center_x + size * offset,
                center_y + size * 0.22,
                size * radius,
                stroke=0,
                fill=1,
            )
    elif symbol == "book":
        pdf.roundRect(
            center_x - size * 0.4,
            center_y - size * 0.3,
            size * 0.38,
            size * 0.6,
            size * 0.05,
            stroke=1,
            fill=0,
        )
        pdf.roundRect(
            center_x + size * 0.02,
            center_y - size * 0.3,
            size * 0.38,
            size * 0.6,
            size * 0.05,
            stroke=1,
            fill=0,
        )
        pdf.line(center_x, center_y - size * 0.29, center_x, center_y + size * 0.27)
    else:
        pdf.circle(center_x, center_y, size * 0.25, stroke=0, fill=1)
        for index in range(8):
            angle = math.pi * index / 4
            inner = size * 0.32
            outer = size * 0.43
            pdf.line(
                center_x + inner * math.cos(angle),
                center_y + inner * math.sin(angle),
                center_x + outer * math.cos(angle),
                center_y + outer * math.sin(angle),
            )

    pdf.restoreState()


def build_adventure_sheet_pdf(
    activity: AdventureSheetRequest,
    bonus: AdventureSheetBonus,
) -> bytes:
    font_name = _register_adventure_font()
    output = io.BytesIO()
    pdf = canvas.Canvas(output, pagesize=A4, pageCompression=1)
    page_width, page_height = A4
    margin = 36
    card_width = 340
    card_height = 440
    card_x = (page_width - card_width) / 2
    card_y = (page_height - card_height) / 2
    accent = colors.HexColor("#679bc4")

    pdf.setTitle(f"Kalandlap - {activity.title}")
    pdf.setAuthor("MiniKaland")
    pdf.setFillColor(colors.HexColor("#345674"))
    pdf.setFont(font_name, 17)
    pdf.drawCentredString(
        page_width / 2,
        page_height - 48,
        "Egy kis bónusz a játékhoz",
    )
    pdf.setFillColor(colors.HexColor("#64819b"))
    pdf.setFont(font_name, 10)
    pdf.drawCentredString(
        page_width / 2,
        page_height - 68,
        activity.title[:90],
    )
    pdf.setFont(font_name, 8)
    pdf.setFillColor(colors.HexColor("#7790a8"))
    pdf.drawCentredString(
        page_width / 2,
        page_height - 87,
        "Vágd ki az egyetlen kártyát a szaggatott vonal mentén.",
    )

    pdf.saveState()
    pdf.setStrokeColor(colors.HexColor("#9dbbd3"))
    pdf.setLineWidth(1)
    pdf.setDash(4, 3)
    pdf.roundRect(
        card_x,
        card_y,
        card_width,
        card_height,
        18,
        stroke=1,
        fill=0,
    )
    pdf.setDash()
    pdf.setFillColor(colors.HexColor("#f2f8fd"))
    pdf.roundRect(
        card_x + 5,
        card_y + 5,
        card_width - 10,
        card_height - 10,
        14,
        stroke=0,
        fill=1,
    )
    pdf.restoreState()

    pdf.setFillColor(accent)
    pdf.setFont(font_name, 9)
    pdf.drawCentredString(
        page_width / 2,
        card_y + card_height - 34,
        "MINIKALAND BÓNUSZKÁRTYA",
    )

    title_lines = simpleSplit(
        bonus.title,
        font_name,
        20,
        card_width - 48,
    )[:2]
    pdf.setFillColor(colors.HexColor("#345674"))
    pdf.setFont(font_name, 20)
    for index, line in enumerate(title_lines):
        pdf.drawCentredString(
            page_width / 2,
            card_y + card_height - 70 - index * 25,
            line,
        )

    _draw_adventure_symbol(
        pdf,
        bonus.symbol,
        page_width / 2,
        card_y + card_height * 0.59,
        66,
        accent,
    )

    prompt_lines = simpleSplit(
        bonus.prompt,
        font_name,
        13,
        card_width - 56,
    )[:4]
    pdf.setFillColor(colors.HexColor("#526e89"))
    pdf.setFont(font_name, 13)
    prompt_top = card_y + card_height * 0.42
    for index, line in enumerate(prompt_lines):
        pdf.drawCentredString(
            page_width / 2,
            prompt_top - index * 18,
            line,
        )

    twist_box_x = card_x + 22
    twist_box_y = card_y + 26
    twist_box_width = card_width - 44
    twist_box_height = 91
    pdf.setFillColor(colors.HexColor("#e4f0fa"))
    pdf.roundRect(
        twist_box_x,
        twist_box_y,
        twist_box_width,
        twist_box_height,
        10,
        stroke=0,
        fill=1,
    )
    pdf.setFillColor(accent)
    pdf.setFont(font_name, 9)
    pdf.drawCentredString(
        page_width / 2,
        twist_box_y + twist_box_height - 20,
        "Ha jöhet egy kis csavar...",
    )
    twist_lines = simpleSplit(
        bonus.twist,
        font_name,
        10,
        twist_box_width - 24,
    )[:3]
    pdf.setFillColor(colors.HexColor("#526e89"))
    pdf.setFont(font_name, 10)
    for index, line in enumerate(twist_lines):
        pdf.drawCentredString(
            page_width / 2,
            twist_box_y + twist_box_height - 39 - index * 13,
            line,
        )

    safety_lines = simpleSplit(
        f"Biztonság: {activity.safety}",
        font_name,
        7.5,
        page_width - 2 * margin,
    )[:2]
    pdf.setFillColor(colors.HexColor("#6f8498"))
    pdf.setFont(font_name, 7.5)
    for index, line in enumerate(safety_lines):
        pdf.drawString(margin, margin + 14 - index * 9, line)

    pdf.showPage()
    pdf.save()
    return output.getvalue()


def adventure_filename(title: str) -> str:
    slug = normalize("NFKD", title).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", slug).strip("-").lower()[:40]
    return f"kalandlap-{slug or 'jatek'}.pdf"
