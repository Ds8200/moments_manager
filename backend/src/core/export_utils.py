"""
Generic table export utilities — Excel (openpyxl) and PDF (weasyprint).

Usage:
    config = TableExportConfig(
        title="My Report",
        first_col_header="Month",
        column_groups=[ColumnGroup("Orders", 3), ColumnGroup("Revenue", 2)],
        sub_headers=["Paid", "Unpaid", "Total", "Cash", "Transfer"],
        rows=[["Jan", 5, 2, 7, "₪100", "₪50"], ...],
    )
    excel_bytes = build_excel_bytes(config)
    pdf_bytes   = build_pdf_bytes(config)
"""

import logging
from dataclasses import dataclass
from io import BytesIO

from openpyxl import Workbook
from openpyxl.styles import (
    Alignment,
    Border,
    Font,
    PatternFill,
    Side,
)
from openpyxl.utils import get_column_letter

logger = logging.getLogger(__name__)

# ── Design tokens (matching frontend _variables.scss) ──────────────────────
_PRIMARY_LIGHT = "D4B8E0"   # #D4B8E0 — group header background
_PRIMARY_DARK  = "6A1B7A"   # font on group header
_HEADER_BG     = "E9ECEF"   # sub-header background
_ALT_ROW_BG    = "F8F9FA"   # alternating data row
_BORDER_COLOR  = "DEE2E6"
_BORDER_DARK   = "CED4DA"


@dataclass
class ColumnGroup:
    label: str
    col_span: int


@dataclass
class TableExportConfig:
    title: str
    first_col_header: str          # primary column; spans 2 header rows
    column_groups: list[ColumnGroup]
    sub_headers: list[str]         # headers inside the groups
    rows: list[list[str | int | float]]


# ── Excel ───────────────────────────────────────────────────────────────────

def _thin_border() -> Border:
    thin = Side(style="thin", color=_BORDER_COLOR)
    return Border(left=thin, right=thin, top=thin, bottom=thin)


def _medium_border() -> Border:
    medium = Side(style="medium", color=_BORDER_DARK)
    return Border(left=medium, right=medium, top=medium, bottom=medium)


def _apply_border(ws, min_row: int, max_row: int, min_col: int, max_col: int) -> None:
    thin = Side(style="thin", color=_BORDER_COLOR)
    for row in ws.iter_rows(min_row=min_row, max_row=max_row, min_col=min_col, max_col=max_col):
        for cell in row:
            cell.border = Border(left=thin, right=thin, top=thin, bottom=thin)


def build_excel_bytes(config: TableExportConfig) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = config.title[:31]  # Excel sheet name limit
    ws.sheet_view.rightToLeft = True

    total_cols = 1 + sum(g.col_span for g in config.column_groups)

    # ── Fills & fonts ────────────────────────────────────────────────────
    group_fill   = PatternFill("solid", fgColor=_PRIMARY_LIGHT)
    header_fill  = PatternFill("solid", fgColor=_HEADER_BG)
    alt_fill     = PatternFill("solid", fgColor=_ALT_ROW_BG)
    white_fill   = PatternFill("solid", fgColor="FFFFFF")

    group_font   = Font(bold=True, color=_PRIMARY_DARK, size=10)
    header_font  = Font(bold=True, size=10)
    data_font    = Font(size=10)

    center_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
    right_align  = Alignment(horizontal="right",  vertical="center")

    # ── Row 1: first col (merge rows 1-2) + group headers ───────────────
    ws.cell(1, 1, config.first_col_header).font   = header_font
    ws.cell(1, 1).fill      = header_fill
    ws.cell(1, 1).alignment = center_align
    ws.merge_cells(start_row=1, start_column=1, end_row=2, end_column=1)

    col = 2
    for group in config.column_groups:
        end_col = col + group.col_span - 1
        ws.cell(1, col, group.label).font      = group_font
        ws.cell(1, col).fill       = group_fill
        ws.cell(1, col).alignment  = center_align
        if group.col_span > 1:
            ws.merge_cells(start_row=1, start_column=col, end_row=1, end_column=end_col)
        col = end_col + 1

    # ── Row 2: sub-headers ───────────────────────────────────────────────
    for i, header in enumerate(config.sub_headers):
        c = ws.cell(2, i + 2, header)
        c.font      = header_font
        c.fill      = header_fill
        c.alignment = center_align

    # ── Data rows ────────────────────────────────────────────────────────
    for row_idx, row_data in enumerate(config.rows, start=3):
        fill = alt_fill if row_idx % 2 == 0 else white_fill
        for col_idx, value in enumerate(row_data, start=1):
            c = ws.cell(row_idx, col_idx, value)
            c.font      = data_font
            c.fill      = fill
            c.alignment = right_align

    # ── Borders ──────────────────────────────────────────────────────────
    last_data_row = 2 + len(config.rows)
    _apply_border(ws, 1, last_data_row, 1, total_cols)

    # ── Column widths ────────────────────────────────────────────────────
    all_headers = [config.first_col_header] + config.sub_headers
    for col_idx in range(1, total_cols + 1):
        header_len = len(all_headers[col_idx - 1]) if col_idx - 1 < len(all_headers) else 8
        max_data   = max(
            (len(str(row[col_idx - 1])) for row in config.rows if col_idx - 1 < len(row)),
            default=0,
        )
        col_width = min(max(header_len, max_data) + 2, 30)
        ws.column_dimensions[get_column_letter(col_idx)].width = col_width

    ws.row_dimensions[1].height = 30
    ws.row_dimensions[2].height = 25
    ws.freeze_panes = "B3"

    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


# ── PDF ─────────────────────────────────────────────────────────────────────

_PDF_CSS = """
@page { size: A4 landscape; margin: 10mm; }
* { box-sizing: border-box; }
body {
  font-family: Arial, 'Arial Hebrew', Helvetica, sans-serif;
  direction: rtl;
  margin: 0;
  padding: 0;
  font-size: 10pt;
  color: #212529;
}
h2 {
  font-size: 14pt;
  font-weight: 700;
  margin: 0 0 8px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th {
  padding: 5px 7px;
  font-size: 9pt;
  font-weight: 700;
  border: 1px solid #CED4DA;
  text-align: center;
  white-space: nowrap;
}
td {
  padding: 4px 7px;
  font-size: 9pt;
  border: 1px solid #DEE2E6;
  text-align: right;
  white-space: nowrap;
}
.th-group {
  background: #D4B8E0;
  color: #6A1B7A;
  font-size: 9pt;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: none;
}
.th-sub {
  background: #E9ECEF;
}
.th-first {
  background: #E9ECEF;
  vertical-align: middle;
}
tr:nth-child(even) td { background: #F8F9FA; }
thead { display: table-header-group; }
tr { page-break-inside: avoid; }
"""


def _build_pdf_html(config: TableExportConfig) -> str:
    total_cols = 1 + sum(g.col_span for g in config.column_groups)

    # Group header row
    first_th = f'<th rowspan="2" class="th-first">{config.first_col_header}</th>'
    group_ths = "".join(
        f'<th colspan="{g.col_span}" class="th-group">{g.label}</th>'
        for g in config.column_groups
    )
    sub_ths = "".join(f'<th class="th-sub">{h}</th>' for h in config.sub_headers)

    # Data rows
    data_rows = "".join(
        f"<tr>{''.join(f'<td>{cell}</td>' for cell in row)}</tr>"
        for row in config.rows
    )

    return f"""<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"/><style>{_PDF_CSS}</style></head>
<body>
  <h2>{config.title}</h2>
  <table>
    <colgroup>{'<col/>' * total_cols}</colgroup>
    <thead>
      <tr>{first_th}{group_ths}</tr>
      <tr>{sub_ths}</tr>
    </thead>
    <tbody>{data_rows}</tbody>
  </table>
</body>
</html>"""


def build_pdf_bytes(config: TableExportConfig) -> bytes:
    try:
        from weasyprint import HTML  # type: ignore[import-untyped]
    except (ImportError, OSError) as exc:
        logger.error("weasyprint unavailable — missing system libs: %s", exc)
        raise RuntimeError(
            "PDF export requires weasyprint system dependencies (libpango, libcairo). "
            "See docker/backend/Dockerfile for installation instructions."
        ) from exc

    html = _build_pdf_html(config)
    return HTML(string=html, base_url=None).write_pdf()  # type: ignore[no-any-return]
