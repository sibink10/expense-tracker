"""
Qubiqon Invoice PDF Generator
Generates invoices matching the exact format from QINV-SEZ-2626114.pdf
Uses ReportLab for PDF creation
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, black, white, Color
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.platypus import Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import os

# ─── Brand Colors ────────────────────────────────────
QUBIQON_GREEN = HexColor("#2BBF8E")
QUBIQON_DARK = HexColor("#1B2A4A")
TEXT_GRAY = HexColor("#555555")
LIGHT_GRAY = HexColor("#F5F5F5")
BORDER_GRAY = HexColor("#E0E0E0")
TABLE_HEADER_BG = HexColor("#F8F8F8")

# ─── Organization Config (would come from DB in prod) ─
ORG = {
    "name": "Qubiqon Consulting India Private Ltd",
    "address_line1": "Carnival building Unit No VI C 6th Floor Phase 3 Building,",
    "address_line2": "Infopark Kochi, Kakkanad",
    "address_line3": "Ernakulam, Kerala, India, 682030",
    "gstin": "32AAACQ9628B1ZP",
    "bank_name": "ICICI Bank Ltd",
    "bank_address": "ICICI Bank Ltd, Emgee Square, M. G. Road, Ernakulam, Kochi",
    "account_name": "QUBIQON CONSULTING INDIA PRIVATE LIMITED",
    "account_number": "001005015268",
    "ifsc": "ICIC0000010",
    "swift": "ICICINBBCTS",
}

# ─── Sample Invoice Data ─────────────────────────────
INVOICE = {
    "number": "QINV-SEZ-2626114",
    "date": "05/03/2026",
    "terms": "Net 60",
    "due_date": "04/05/2026",
    "po": "NA",
    "currency_symbol": "$",
    "client": {
        "name": "Huddlesmith",
        "contact": "Karim Kurji",
        "address": ["3421 Concession Rd 5", "ON L0B 1M0", "Clarington", "Canada"],
    },
    "items": [
        {
            "desc": "Huddlesmith - EstateXL - Fullstack Developer - Allan Varghese\nBased on Approved Time Sheets",
            "hsn": "998314",
            "qty": 152.00,
            "rate": 19.00,
            "amount": 2888.00,
        },
        {
            "desc": "Huddlesmith - EstateXL - Fullstack Developer - Nihal Fairooz E S\nBased on Approved Time Sheets",
            "hsn": "998314",
            "qty": 152.00,
            "rate": 13.00,
            "amount": 1976.00,
        },
    ],
    "sub_total": 4864.00,
    "total": 4864.00,
    "balance_due": 4864.00,
    "total_in_words": "United States Dollar Four Thousand Eight Hundred Sixty-Four",
    "notes": "Looking forward for your business.",
}


def draw_logo(c, x, y, size=50):
    """Draw the Qubiqon Q logo"""
    # Circle background
    c.setFillColor(QUBIQON_GREEN)
    c.circle(x + size/2, y - size/2, size/2, fill=1, stroke=0)
    
    # Inner white circle  
    c.setFillColor(white)
    c.circle(x + size/2, y - size/2, size/2 - 6, fill=1, stroke=0)
    
    # Green arc (simplified Q shape)
    c.setStrokeColor(QUBIQON_GREEN)
    c.setLineWidth(8)
    import math
    cx, cy, r = x + size/2, y - size/2, size/2 - 10
    # Draw partial circle
    path = c.beginPath()
    for angle in range(30, 340):
        rad = math.radians(angle)
        px = cx + r * math.cos(rad)
        py = cy + r * math.sin(rad)
        if angle == 30:
            path.moveTo(px, py)
        else:
            path.lineTo(px, py)
    c.drawPath(path, stroke=1, fill=0)
    
    # Q tail
    c.setLineWidth(8)
    c.line(cx + r * 0.5, cy - r * 0.3, cx + r + 4, cy - r - 4)


def fmt(amount, symbol="$"):
    """Format currency"""
    if symbol == "$":
        return f"{symbol}{amount:,.2f}"
    return f"{symbol}{amount:,.2f}"


def generate_invoice(output_path, invoice=None, org=None):
    """Generate a PDF invoice matching Qubiqon's Zoho Books format"""
    inv = invoice or INVOICE
    org_data = org or ORG
    w, h = A4
    c = canvas.Canvas(output_path, pagesize=A4)
    sym = inv.get("currency_symbol", "$")
    
    margin_left = 45
    margin_right = w - 45
    content_width = margin_right - margin_left
    
    # ═══════════════════════════════════════════════
    # HEADER SECTION
    # ═══════════════════════════════════════════════
    
    # Logo
    draw_logo(c, margin_left, h - 30, 55)
    
    # Company name and address (right of logo)
    text_x = margin_left + 70
    y = h - 40
    
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(QUBIQON_DARK)
    c.drawString(text_x, y, org_data["name"])
    
    c.setFont("Helvetica", 8.5)
    c.setFillColor(TEXT_GRAY)
    y -= 14
    c.drawString(text_x, y, org_data["address_line1"])
    y -= 12
    c.drawString(text_x, y, org_data["address_line2"])
    y -= 12
    c.drawString(text_x, y, org_data["address_line3"])
    y -= 12
    c.drawString(text_x, y, f"GSTIN {org_data['gstin']}")
    
    # "INVOICE" title (top right)
    c.setFont("Helvetica-Bold", 28)
    c.setFillColor(QUBIQON_DARK)
    c.drawRightString(margin_right, h - 50, "INVOICE")
    
    # ═══════════════════════════════════════════════
    # INVOICE DETAILS (below header)
    # ═══════════════════════════════════════════════
    y = h - 135
    
    # Left column labels
    c.setFont("Helvetica", 9)
    c.setFillColor(TEXT_GRAY)
    labels = [
        ("Invoice#", inv["number"]),
        ("Invoice Date", inv["date"]),
        ("Terms", inv["terms"]),
        ("Due Date", inv["due_date"]),
        ("P.O.#", inv["po"]),
    ]
    
    label_x = margin_left
    value_x = margin_left + 80
    
    for label, value in labels:
        c.setFont("Helvetica", 9)
        c.setFillColor(TEXT_GRAY)
        c.drawString(label_x, y, label)
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(black)
        c.drawString(value_x, y, f": {value}")
        y -= 15
    
    # ═══════════════════════════════════════════════
    # BILL TO / SHIP TO
    # ═══════════════════════════════════════════════
    y -= 10
    
    # Divider line
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.5)
    c.line(margin_left, y + 5, margin_right, y + 5)
    
    mid_x = margin_left + content_width / 2
    
    # Bill To header
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(QUBIQON_DARK)
    c.drawString(margin_left, y - 8, "Bill To")
    c.drawString(mid_x + 10, y - 8, "Ship To")
    
    # Vertical divider
    c.line(mid_x, y + 5, mid_x, y - 80)
    
    y -= 22
    client = inv["client"]
    
    # Bill to details
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(black)
    c.drawString(margin_left, y, client["name"])
    
    c.setFont("Helvetica", 9)
    c.setFillColor(TEXT_GRAY)
    y -= 13
    c.drawString(margin_left, y, client["contact"])
    for line in client["address"]:
        y -= 12
        c.drawString(margin_left, y, line)
    
    # Ship to (same as bill to)
    ship_y = y + 13 + 12 * len(client["address"])
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(black)
    c.drawString(mid_x + 10, ship_y, client["name"])
    
    c.setFont("Helvetica", 9)
    c.setFillColor(TEXT_GRAY)
    ship_y -= 13
    c.drawString(mid_x + 10, ship_y, client["contact"])
    for line in client["address"]:
        ship_y -= 12
        c.drawString(mid_x + 10, ship_y, line)
    
    # Bottom divider
    y -= 15
    c.setStrokeColor(BORDER_GRAY)
    c.line(margin_left, y, margin_right, y)
    
    # ═══════════════════════════════════════════════
    # LINE ITEMS TABLE
    # ═══════════════════════════════════════════════
    y -= 5
    
    styles = getSampleStyleSheet()
    desc_style = ParagraphStyle('desc', parent=styles['Normal'], fontSize=8.5, leading=11, textColor=TEXT_GRAY)
    
    # Build table data
    table_data = [["#", "Item & Description", "HSN/SAC", "Qty (hrs)", "Rate", "Total Amount"]]
    
    for i, item in enumerate(inv["items"], 1):
        desc_para = Paragraph(item["desc"].replace("\n", "<br/>"), desc_style)
        table_data.append([
            str(i),
            desc_para,
            item["hsn"],
            f"{item['qty']:.2f}",
            f"{item['rate']:.2f}",
            f"{item['amount']:,.2f}",
        ])
    
    col_widths = [25, content_width - 25 - 55 - 60 - 55 - 80, 55, 60, 55, 80]
    
    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), QUBIQON_DARK),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8.5),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        
        # Body
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8.5),
        ('TEXTCOLOR', (0, 1), (-1, -1), TEXT_GRAY),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        
        # Alignment
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        
        # Grid
        ('LINEBELOW', (0, 0), (-1, 0), 0.5, BORDER_GRAY),
        ('LINEBELOW', (0, 1), (-1, -2), 0.3, BORDER_GRAY),
        ('LINEBELOW', (0, -1), (-1, -1), 0.5, BORDER_GRAY),
    ]))
    
    tw, th = table.wrapOn(c, content_width, 400)
    table.drawOn(c, margin_left, y - th)
    y = y - th
    
    # ═══════════════════════════════════════════════
    # TOTALS (right-aligned)
    # ═══════════════════════════════════════════════
    totals_x = margin_right - 180
    y -= 8
    
    # Sub Total
    c.setFont("Helvetica", 9)
    c.setFillColor(TEXT_GRAY)
    c.drawRightString(margin_right - 90, y, "Sub Total")
    c.drawRightString(margin_right, y, f"{inv['sub_total']:,.2f}")
    
    # Total
    y -= 18
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(QUBIQON_DARK)
    c.drawRightString(margin_right - 90, y, "Total")
    c.drawRightString(margin_right, y, f"{sym}{inv['total']:,.2f}")
    
    # Balance Due (highlighted)
    y -= 22
    c.setFillColor(TABLE_HEADER_BG)
    c.rect(totals_x, y - 6, margin_right - totals_x, 22, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(QUBIQON_DARK)
    c.drawRightString(margin_right - 90, y, "Balance Due")
    c.drawRightString(margin_right, y, f"{sym}{inv['balance_due']:,.2f}")
    
    # ═══════════════════════════════════════════════
    # TOTAL IN WORDS + NOTES (left side)
    # ═══════════════════════════════════════════════
    words_y = y + 40
    
    c.setFont("Helvetica", 8.5)
    c.setFillColor(TEXT_GRAY)
    c.drawString(margin_left, words_y, "Total In Words")
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(black)
    c.drawString(margin_left, words_y - 14, inv["total_in_words"])
    
    if inv.get("notes"):
        c.setFont("Helvetica", 8.5)
        c.setFillColor(TEXT_GRAY)
        c.drawString(margin_left, words_y - 34, "Notes")
        c.setFont("Helvetica", 8.5)
        c.drawString(margin_left, words_y - 46, inv["notes"])
    
    # ═══════════════════════════════════════════════
    # BANK DETAILS TABLE (bottom left)
    # ═══════════════════════════════════════════════
    bank_y = y - 40
    
    bank_data = [
        ["Account Name", org_data["account_name"]],
        ["Account Number", org_data["account_number"]],
        ["IFSC Code", org_data["ifsc"]],
        ["Bank Name", org_data["bank_name"]],
        ["Bank Address", org_data["bank_address"]],
        ["SWIFT Code", org_data["swift"]],
    ]
    
    bank_table = Table(bank_data, colWidths=[85, 200])
    bank_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('TEXTCOLOR', (0, 0), (0, -1), TEXT_GRAY),
        ('TEXTCOLOR', (1, 0), (1, -1), black),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('GRID', (0, 0), (-1, -1), 0.3, BORDER_GRAY),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    btw, bth = bank_table.wrapOn(c, 300, 200)
    bank_table.drawOn(c, margin_left, bank_y - bth)
    
    # ═══════════════════════════════════════════════
    # AUTHORIZED SIGNATURE (bottom right)
    # ═══════════════════════════════════════════════
    sig_y = bank_y - bth + 10
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.5)
    c.line(margin_right - 160, sig_y, margin_right, sig_y)
    c.setFont("Helvetica", 9)
    c.setFillColor(TEXT_GRAY)
    c.drawString(margin_right - 160, sig_y - 14, "Authorized Signature")
    
    # ═══════════════════════════════════════════════
    # PAGE NUMBER
    # ═══════════════════════════════════════════════
    c.setFont("Helvetica", 8)
    c.setFillColor(TEXT_GRAY)
    c.drawRightString(margin_right, 25, "1")
    
    # Footer line
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.5)
    c.line(margin_left, 35, margin_right, 35)
    
    c.save()
    print(f"Invoice generated: {output_path}")
    return output_path


def generate_email_template(template_type, data):
    """Generate HTML email template matching Qubiqon's Zoho style"""
    
    org = data.get("org", ORG)
    
    templates = {
        "bill_reminder": {
            "subject": f"Bill payment reminder — {data.get('bill_number', '')}",
            "greeting": "Hello,",
            "body": "This is a gentle reminder about the bill that is due for payment.",
            "details": f"""
                <strong style="font-size:18px">Bill# : {data.get('bill_number', '')}</strong><br/><br/>
                Vendor Name : &nbsp; {data.get('vendor_name', '')}<br/>
                Due Date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : &nbsp; {data.get('due_date', '')}<br/>
                <hr style="border:1px dashed #ccc"/><br/>
                Overdue By &nbsp;&nbsp; : &nbsp; {data.get('overdue_days', '0')}<br/>
                Amount &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : &nbsp; {data.get('amount', '')}<br/>
                Balance Due : &nbsp; {data.get('balance_due', '')}<br/>
            """,
            "button_text": "VIEW BILL",
            "button_url": data.get("view_url", "#"),
            "footer_note": "If you've already paid for the bill, that's great. Sit back and Relax :)",
        },
        "payment_confirmation": {
            "subject": f"Payment confirmation — {data.get('ref_number', '')}",
            "greeting": "Hello,",
            "body": f"We are pleased to confirm that payment has been processed for the following:",
            "details": f"""
                <strong style="font-size:18px">{data.get('doc_type', 'Bill')}# : {data.get('doc_number', '')}</strong><br/><br/>
                {data.get('party_label', 'Vendor')} : &nbsp; {data.get('party_name', '')}<br/>
                Amount Paid : &nbsp; {data.get('amount_paid', '')}<br/>
                Payment Ref : &nbsp; {data.get('ref_number', '')}<br/>
                Payment Date : &nbsp; {data.get('payment_date', '')}<br/>
            """,
            "button_text": f"VIEW {data.get('doc_type', 'BILL').upper()}",
            "button_url": data.get("view_url", "#"),
            "footer_note": "Thank you for your business!",
        },
        "expense_approved": {
            "subject": f"Expense {data.get('expense_id', '')} approved",
            "greeting": f"Hello {data.get('employee_name', '')},",
            "body": "Your expense request has been approved.",
            "details": f"""
                <strong style="font-size:18px">Expense# : {data.get('expense_id', '')}</strong><br/><br/>
                Purpose : &nbsp; {data.get('purpose', '')}<br/>
                Amount &nbsp; : &nbsp; {data.get('amount', '')}<br/>
                Status &nbsp;&nbsp; : &nbsp; <span style="color:#0F6E56;font-weight:bold">Approved</span><br/>
            """,
            "button_text": "VIEW EXPENSE",
            "button_url": data.get("view_url", "#"),
            "footer_note": data.get("extra_note", "Please submit the bill/receipt if not already attached."),
        },
        "invoice_sent": {
            "subject": f"Invoice {data.get('invoice_number', '')} from {org['name']}",
            "greeting": f"Dear {data.get('client_name', '')},",
            "body": "Please find attached the invoice for services rendered.",
            "details": f"""
                <strong style="font-size:18px">Invoice# : {data.get('invoice_number', '')}</strong><br/><br/>
                Invoice Date : &nbsp; {data.get('invoice_date', '')}<br/>
                Due Date &nbsp;&nbsp;&nbsp;&nbsp; : &nbsp; {data.get('due_date', '')}<br/>
                Amount &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : &nbsp; {data.get('amount', '')}<br/>
                Balance Due : &nbsp; {data.get('balance_due', '')}<br/>
            """,
            "button_text": "VIEW INVOICE",
            "button_url": data.get("view_url", "#"),
            "footer_note": "Thank you for your business. We appreciate your prompt payment.",
        },
    }
    
    tpl = templates.get(template_type, templates["payment_confirmation"])
    
    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f5f5f5">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <!-- Header with Logo -->
    <tr>
        <td style="padding:24px 32px;border-bottom:3px solid {QUBIQON_GREEN}">
            <table width="100%">
                <tr>
                    <td width="40">
                        <div style="width:36px;height:36px;background:linear-gradient(135deg,#2BBF8E,#1B9E74);border-radius:8px;text-align:center;line-height:36px;color:white;font-weight:bold;font-size:18px">Q</div>
                    </td>
                    <td style="padding-left:10px">
                        <div style="font-size:14px;font-weight:bold;color:#1B2A4A">Finance - {org['name'].split(' ')[0]}</div>
                        <div style="font-size:11px;color:#6B7A94">&lt;Finance@qubiqon.io&gt;</div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    
    <!-- Body -->
    <tr>
        <td style="padding:32px">
            <p style="margin:0 0 16px;font-size:14px;color:#333">{tpl['greeting']}</p>
            <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.6">{tpl['body']}</p>
            
            <hr style="border:none;border-top:1px dashed #ccc;margin:20px 0"/>
            
            <div style="margin:20px 0;font-size:14px;color:#333;line-height:2">
                {tpl['details']}
            </div>
            
            <hr style="border:none;border-top:1px dashed #ccc;margin:20px 0"/>
            
            <!-- CTA Button -->
            <div style="margin:24px 0">
                <a href="{tpl['button_url']}" style="display:inline-block;padding:12px 28px;background:#2BBF8E;color:white;text-decoration:none;border-radius:4px;font-weight:bold;font-size:14px">{tpl['button_text']}</a>
            </div>
            
            <p style="margin:24px 0 0;font-size:13px;color:#888;line-height:1.5">{tpl['footer_note']}</p>
        </td>
    </tr>
    
    <!-- Footer -->
    <tr>
        <td style="padding:20px 32px;background:#f9f9f9;border-top:1px solid #eee">
            <p style="margin:0;font-size:12px;color:#999">Thanks,<br/><strong style="color:#1B2A4A">{org['name']}</strong></p>
            <p style="margin:8px 0 0;font-size:10px;color:#bbb">{org['address_line1']} {org['address_line2']}</p>
        </td>
    </tr>
</table>
</body>
</html>"""
    
    return {"subject": tpl["subject"], "html": html}


if __name__ == "__main__":
    # Generate sample invoice PDF
    output = "/mnt/user-data/outputs/QINV-SEZ-2626114-generated.pdf"
    generate_invoice(output)
    
    # Generate sample email templates
    templates_dir = "/mnt/user-data/outputs/email-templates"
    os.makedirs(templates_dir, exist_ok=True)
    
    # Bill reminder
    email1 = generate_email_template("bill_reminder", {
        "bill_number": "TQ/25-26/1008/9",
        "vendor_name": "TQ Network Private Limited",
        "due_date": "15/03/2026",
        "overdue_days": "-1",
        "amount": "10,064.00",
        "balance_due": "10,064.00",
        "view_url": "https://expense.qubiqon.io/bills/TQ-25-26-1008-9",
    })
    with open(f"{templates_dir}/bill-reminder.html", "w") as f:
        f.write(email1["html"])
    
    # Payment confirmation
    email2 = generate_email_template("payment_confirmation", {
        "doc_type": "Bill",
        "doc_number": "BL-200/25-26",
        "party_label": "Vendor",
        "party_name": "The Ice Cream Factory",
        "amount_paid": "₹4,40,510.00",
        "ref_number": "QBQ20260308002",
        "payment_date": "08/03/2026",
    })
    with open(f"{templates_dir}/payment-confirmation.html", "w") as f:
        f.write(email2["html"])
    
    # Expense approved
    email3 = generate_email_template("expense_approved", {
        "employee_name": "Arun Kumar",
        "expense_id": "EXP-2026-00001",
        "purpose": "Cloud infrastructure - Azure DevOps licenses",
        "amount": "₹15,000.00",
    })
    with open(f"{templates_dir}/expense-approved.html", "w") as f:
        f.write(email3["html"])
    
    # Invoice sent
    email4 = generate_email_template("invoice_sent", {
        "client_name": "Huddlesmith",
        "invoice_number": "QINV-SEZ-2626114",
        "invoice_date": "05/03/2026",
        "due_date": "04/05/2026",
        "amount": "$4,864.00",
        "balance_due": "$4,864.00",
    })
    with open(f"{templates_dir}/invoice-sent.html", "w") as f:
        f.write(email4["html"])
    
    print(f"\nEmail templates generated in {templates_dir}/")
    print("Templates: bill-reminder.html, payment-confirmation.html, expense-approved.html, invoice-sent.html")
