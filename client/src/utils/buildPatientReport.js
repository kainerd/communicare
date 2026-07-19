import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const BRAND_COLOR  = [30, 58, 95];   // #1e3a5f
const ACCENT_COLOR = [34, 197, 94];  // #22c55e
const LIGHT_GRAY   = [241, 245, 249];
const TEXT_DARK    = [30, 41, 59];
const TEXT_MUTED   = [100, 116, 139];

const CAT_LABELS = {
  body_part: 'Body Parts',
  need:      'Needs',
  emotion:   'Emotions',
  symptom:   'Symptoms',
  free_text: 'Free Text',
};

export function buildPatientReport(patient, visits) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 0;

  // ── helpers ───────────────────────────────────────────────────────────────

  function checkPageBreak(needed = 20) {
    if (y + needed > pageH - 20) {
      doc.addPage();
      y = 20;
      drawPageFooter();
    }
  }

  function drawPageFooter() {
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(
      `CommuniCare — Confidential Patient Report  |  Page ${pageCount}`,
      margin, pageH - 10,
    );
    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      pageW - margin, pageH - 10,
      { align: 'right' },
    );
  }

  function sectionTitle(text, yPos) {
    doc.setFillColor(...BRAND_COLOR);
    doc.roundedRect(margin, yPos, contentW, 8, 1, 1, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(text, margin + 4, yPos + 5.5);
    return yPos + 12;
  }

  function labelValue(label, value, yPos, indent = 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT_DARK);
    doc.text(label + ':', margin + indent, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MUTED);
    const lines = doc.splitTextToSize(value || '—', contentW - 40 - indent);
    doc.text(lines, margin + indent + 32, yPos);
    return yPos + lines.length * 5;
  }

  // ── PAGE 1: Header + Patient Info ─────────────────────────────────────────

  // Header banner
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, pageW, 32, 'F');

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('CommuniCare', margin, 14);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 200, 230);
  doc.text('AI Health Assistant — Patient Visit Report', margin, 21);

  doc.setFontSize(9);
  doc.setTextColor(180, 200, 230);
  doc.text(`Report date: ${new Date().toLocaleDateString()}`, pageW - margin, 21, { align: 'right' });

  y = 42;

  // Patient info card background
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(margin, y - 4, contentW, 46, 2, 2, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLOR);
  doc.text(patient.full_name, margin + 4, y + 5);

  y += 12;
  y = labelValue('Age',    patient.age ? String(patient.age) : 'Unknown', y, 4);
  y = labelValue('Gender', patient.gender || 'Not specified', y, 4);
  if (patient.medical_notes) {
    checkPageBreak(14);
    y = labelValue('Medical Notes', patient.medical_notes, y, 4);
  }
  y += 8;

  // Visit count summary line
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT_COLOR);
  doc.text(`Total Visits: ${visits.length}`, margin, y);
  y += 10;

  // ── VISITS ────────────────────────────────────────────────────────────────

  visits.forEach((visit, idx) => {
    checkPageBreak(35);

    // Visit header
    y = sectionTitle(`Visit ${idx + 1}  —  ${new Date(visit.visit_date).toLocaleString()}  [${visit.status.toUpperCase()}]`, y);

    // Caregiver
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MUTED);
    doc.text(`Caregiver: ${visit.caregiver_name}`, margin + 2, y);
    y += 7;

    // Board selections table
    if (visit.board_selections && visit.board_selections.length > 0) {
      checkPageBreak(18);

      // Group by category
      const grouped = {};
      visit.board_selections.forEach(({ category, label }) => {
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(label);
      });

      const tableRows = Object.entries(grouped).map(([cat, labels]) => [
        CAT_LABELS[cat] || cat,
        labels.join(', '),
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Category', 'Indicated by Patient']],
        body: tableRows,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8.5, cellPadding: 3, textColor: TEXT_DARK },
        headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: LIGHT_GRAY },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 38 }, 1: { cellWidth: contentW - 38 } },
        didDrawPage: () => { drawPageFooter(); },
      });
      y = doc.lastAutoTable.finalY + 6;
    } else {
      doc.setFontSize(8.5);
      doc.setTextColor(...TEXT_MUTED);
      doc.text('No board selections recorded.', margin + 2, y);
      y += 7;
    }

    // Speech logs
    if (visit.speech_logs && visit.speech_logs.length > 0) {
      checkPageBreak(16);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...TEXT_DARK);
      doc.text('Caregiver Speech:', margin + 2, y);
      y += 5;

      visit.speech_logs.forEach((log) => {
        checkPageBreak(10);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...TEXT_MUTED);
        const lines = doc.splitTextToSize(`"${log.transcript_text}"`, contentW - 8);
        doc.text(lines, margin + 4, y);
        y += lines.length * 4.8 + 2;
      });
      y += 2;
    }

    // AI Summary box
    if (visit.ai_summary) {
      checkPageBreak(24);

      doc.setFillColor(245, 243, 255);   // light purple
      doc.setDrawColor(196, 181, 253);   // purple border
      doc.roundedRect(margin, y, contentW, 6, 1, 1, 'FD');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(109, 40, 217);
      doc.text('🤖  AI Clinical Summary', margin + 3, y + 4.2);
      y += 8;

      const summaryLines = doc.splitTextToSize(visit.ai_summary.summary_text, contentW - 8);
      const boxH = summaryLines.length * 4.8 + 8;
      checkPageBreak(boxH + 4);

      doc.setFillColor(250, 245, 255);
      doc.setDrawColor(196, 181, 253);
      doc.roundedRect(margin, y, contentW, boxH, 1, 1, 'FD');

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(...TEXT_DARK);
      doc.text(summaryLines, margin + 4, y + 5);
      y += boxH + 4;
    } else {
      doc.setFontSize(8);
      doc.setTextColor(...TEXT_MUTED);
      doc.setFont('helvetica', 'italic');
      doc.text('No AI summary generated for this visit.', margin + 2, y);
      y += 6;
    }

    y += 8;  // gap between visits
  });

  // Footer on last page
  drawPageFooter();

  // Download
  const filename = `CommuniCare_${patient.full_name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
