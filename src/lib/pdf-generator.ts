'use client';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface GeneratePDFOptions {
  audit: any;
  watermark?: string;
}

/**
 * Generates a comprehensive PDF report for an audit
 * Includes store details, scores, responses, photos, and signatures
 */
export async function generateAuditPDF({
  audit,
  watermark = 'Mall Risk Compliance Platform – Confidential',
}: GeneratePDFOptions) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Helper: Add watermark to every page
  const addWatermark = (pdf: jsPDF) => {
    pdf.setTextColor(200, 200, 200);
    pdf.setFontSize(40);
    pdf.text(watermark, pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45,
    });
    pdf.setTextColor(0, 0, 0);
  };

  // Helper: Check if new page is needed
  const checkPageBreak = (requiredHeight: number) => {
    if (yPos + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
      addWatermark(pdf);
    }
  };

  // Add watermark to first page
  addWatermark(pdf);

  // Title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Restaurant Audit Report', margin, yPos);
  yPos += 10;

  // Audit Details Box
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(margin, yPos, pageWidth - 2 * margin, 35);
  yPos += 7;

  // Store Information
  pdf.setFont('helvetica', 'bold');
  pdf.text('Store:', margin + 5, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${audit.store.storeCode} - ${audit.store.name}`, margin + 30, yPos);
  yPos += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Template:', margin + 5, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(audit.template.name, margin + 30, yPos);
  yPos += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Date:', margin + 5, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(new Date(audit.auditDate).toLocaleDateString(), margin + 30, yPos);
  yPos += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Conducted By:', margin + 5, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(
    audit.conductedBy.name || audit.conductedBy.email,
    margin + 30,
    yPos
  );
  yPos += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Status:', margin + 5, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(audit.status, margin + 30, yPos);
  yPos += 12;

  // Overall Score
  if (audit.overallScore !== null) {
    checkPageBreak(25);
    pdf.setFillColor(
      audit.overallScore >= 80 ? 220 : audit.overallScore >= 60 ? 255 : 255,
      audit.overallScore >= 80 ? 252 : audit.overallScore >= 60 ? 237 : 220,
      audit.overallScore >= 80 ? 231 : audit.overallScore >= 60 ? 213 : 213
    );
    pdf.rect(margin, yPos, pageWidth - 2 * margin, 20, 'F');
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('OVERALL COMPLIANCE SCORE', margin + 5, yPos + 7);
    pdf.setFontSize(16);
    pdf.text(`${audit.overallScore.toFixed(1)}%`, margin + 5, yPos + 15);

    const riskLevel =
      audit.overallScore >= 80 ? 'LOW' : audit.overallScore >= 60 ? 'MEDIUM' : 'HIGH';
    pdf.setFontSize(12);
    pdf.text(`Risk Level: ${riskLevel}`, pageWidth - margin - 40, yPos + 10);
    yPos += 25;
  }

  // Section Scores
  const sectionScores = audit.sectionScores as any[];
  if (sectionScores && Array.isArray(sectionScores)) {
    checkPageBreak(15);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Section Breakdown', margin, yPos);
    yPos += 8;

    for (const section of sectionScores) {
      checkPageBreak(12);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(section.sectionName, margin + 5, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `${section.yes} YES • ${section.no} NO • ${section.na} N/A`,
        margin + 5,
        yPos + 5
      );
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${section.score.toFixed(1)}%`, pageWidth - margin - 20, yPos);
      yPos += 10;

      if (section.criticalFailures > 0) {
        pdf.setTextColor(220, 38, 38);
        pdf.setFont('helvetica', 'normal');
        pdf.text(
          `⚠ ${section.criticalFailures} Critical Failure(s)`,
          margin + 10,
          yPos
        );
        pdf.setTextColor(0, 0, 0);
        yPos += 6;
      }
    }
    yPos += 5;
  }

  // Responses by Section
  checkPageBreak(15);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Audit Responses', margin, yPos);
  yPos += 8;

  for (const section of audit.template.sections) {
    const sectionResponses = audit.responses.filter(
      (r: any) => r.question.sectionId === section.id
    );

    if (sectionResponses.length === 0) continue;

    checkPageBreak(12);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(section.name, margin, yPos);
    yPos += 7;

    for (const question of section.questions) {
      const response = sectionResponses.find(
        (r: any) => r.questionId === question.id
      );

      if (!response) continue;

      checkPageBreak(20);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      // Question text (wrapped)
      const questionText = question.critical
        ? `⚠ ${question.question} (CRITICAL)`
        : question.question;
      const splitQuestion = pdf.splitTextToSize(
        questionText,
        pageWidth - 2 * margin - 30
      );
      pdf.text(splitQuestion, margin + 5, yPos);
      yPos += splitQuestion.length * 5;

      // Result badge
      const resultColors: Record<string, [number, number, number]> = {
        YES: [34, 197, 94],
        NO: [239, 68, 68],
        NA: [156, 163, 175],
      };
      const color = resultColors[response.result] || [0, 0, 0];
      pdf.setFillColor(...color);
      pdf.rect(pageWidth - margin - 20, yPos - 4, 15, 6, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text(response.result, pageWidth - margin - 17, yPos);
      pdf.setTextColor(0, 0, 0);
      yPos += 3;

      // Notes
      if (response.notes) {
        checkPageBreak(15);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        const notesText = pdf.splitTextToSize(
          `Notes: ${response.notes}`,
          pageWidth - 2 * margin - 10
        );
        pdf.text(notesText, margin + 10, yPos);
        yPos += notesText.length * 4;
      }

      // Severity
      if (response.severity) {
        pdf.setFontSize(8);
        pdf.text(`Severity: ${response.severity}`, margin + 10, yPos);
        yPos += 5;
      }

      // Photo count
      if (response.photos.length > 0) {
        pdf.setFontSize(8);
        pdf.text(
          `📷 ${response.photos.length} Evidence Photo(s)`,
          margin + 10,
          yPos
        );
        yPos += 5;
      }

      yPos += 4;
    }
  }

  // General Comments
  if (audit.generalComments) {
    checkPageBreak(15);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('General Comments', margin, yPos);
    yPos += 7;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const commentsText = pdf.splitTextToSize(
      audit.generalComments,
      pageWidth - 2 * margin
    );
    pdf.text(commentsText, margin + 5, yPos);
    yPos += commentsText.length * 5 + 5;
  }

  // Tenant Acknowledgement
  if (audit.acknowledgement && audit.acknowledgement.acknowledged) {
    checkPageBreak(20);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Tenant Acknowledgement', margin, yPos);
    yPos += 7;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${audit.acknowledgement.name}`, margin + 5, yPos);
    yPos += 5;
    pdf.text(`Role: ${audit.acknowledgement.role}`, margin + 5, yPos);
    yPos += 5;
    pdf.text(`Contact: ${audit.acknowledgement.contact}`, margin + 5, yPos);
    yPos += 10;
  }

  // Signatures
  if (audit.officerSignatureUrl || audit.managerSignatureUrl) {
    checkPageBreak(40);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Signatures', margin, yPos);
    yPos += 7;

    let xOffset = margin + 5;

    if (audit.officerSignatureUrl) {
      try {
        const img = await loadImage(audit.officerSignatureUrl);
        pdf.addImage(img, 'PNG', xOffset, yPos, 60, 20);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Officer Signature', xOffset, yPos + 23);
        if (audit.officerSignedAt) {
          pdf.text(
            new Date(audit.officerSignedAt).toLocaleString(),
            xOffset,
            yPos + 27
          );
        }
        xOffset += 70;
      } catch (error) {
        console.error('Error loading officer signature:', error);
      }
    }

    if (audit.managerSignatureUrl) {
      try {
        const img = await loadImage(audit.managerSignatureUrl);
        pdf.addImage(img, 'PNG', xOffset, yPos, 60, 20);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Manager Signature', xOffset, yPos + 23);
        if (audit.managerSignedAt) {
          pdf.text(
            new Date(audit.managerSignedAt).toLocaleString(),
            xOffset,
            yPos + 27
          );
        }
      } catch (error) {
        console.error('Error loading manager signature:', error);
      }
    }
    yPos += 35;
  }

  // Corrective Actions
  if (audit.actions.length > 0) {
    checkPageBreak(15);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Corrective Actions', margin, yPos);
    yPos += 7;

    for (const action of audit.actions) {
      checkPageBreak(20);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(action.title, margin + 5, yPos);
      yPos += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      const descText = pdf.splitTextToSize(
        action.description,
        pageWidth - 2 * margin - 10
      );
      pdf.text(descText, margin + 5, yPos);
      yPos += descText.length * 4 + 3;
      pdf.setFontSize(8);
      pdf.text(
        `Severity: ${action.severity} | Due: ${new Date(
          action.dueDate
        ).toLocaleDateString()} | Status: ${action.status}`,
        margin + 5,
        yPos
      );
      yPos += 7;
    }
  }

  // Footer on last page
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    pdf.text(
      `Generated: ${new Date().toLocaleString()}`,
      margin,
      pageHeight - 10
    );
  }

  // Download PDF
  const fileName = `Audit_${audit.store.storeCode}_${
    new Date(audit.auditDate).toISOString().split('T')[0]
  }.pdf`;
  pdf.save(fileName);
}

// Helper to load images for signatures
function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}
