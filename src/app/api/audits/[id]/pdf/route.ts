import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import PDFDocument from 'pdfkit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch audit with all related data
    const audit = await prisma.audit.findUnique({
      where: { id },
      include: {
        store: true,
        template: {
          include: {
            sections: {
              include: {
                questions: {
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        conductedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        responses: {
          include: {
            question: {
              include: {
                section: true,
              },
            },
            photos: true,
          },
        },
        actions: {
          include: {
            assignedTo: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `${audit.template.name} - ${audit.store.name}`,
        Author: 'V&A Waterfront Compliance System',
        Subject: 'Compliance Audit Report',
        Keywords: 'audit, compliance, safety',
      },
    });

    // Set up response headers
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      // PDF will be sent after doc.end() is called
    });

    // =========================================================================
    // HEADER
    // =========================================================================
    doc.fontSize(20).font('Helvetica-Bold').text('V&A WATERFRONT', { align: 'center' });
    doc.fontSize(16).text('COMPLIANCE AUDIT REPORT', { align: 'center' });
    doc.moveDown(0.5);

    // Watermark for status
    if (audit.status === 'DRAFT') {
      doc.fontSize(60)
        .fillColor('red', 0.1)
        .text('DRAFT', 200, 400, { align: 'center' })
        .fillColor('black');
    }

    // =========================================================================
    // AUDIT METADATA
    // =========================================================================
    doc.fontSize(10).font('Helvetica');
    const metaY = doc.y;
    doc.text(`Audit Type: ${audit.template.name}`, 50, metaY);
    doc.text(`Audit ID: ${audit.id.substring(0, 8)}...`, 350, metaY);
    doc.moveDown();

    doc.text(`Store: ${audit.store.name} (${audit.store.storeCode})`);
    doc.text(`Zone: ${audit.store.zone}${audit.store.floor ? `, Floor ${audit.store.floor}` : ''}`);
    doc.text(`Store Type: ${audit.store.storeType}`);
    doc.moveDown();

    doc.text(`Conducted By: ${audit.conductedBy.name || audit.conductedBy.email}`);
    doc.text(`Audit Date: ${new Date(audit.auditDate).toLocaleDateString('en-ZA')}`);
    doc.text(`Status: ${audit.status}`);
    if (audit.overallScore !== null) {
      doc.text(`Overall Score: ${audit.overallScore.toFixed(1)}%`);
    }
    doc.moveDown();

    // =========================================================================
    // GEO-LOCATION PROOF
    // =========================================================================
    if (audit.geoProofCaptured && audit.geoLat && audit.geoLng) {
      doc.fontSize(12).font('Helvetica-Bold').text('Location Verification');
      doc.fontSize(10).font('Helvetica');
      doc.text(`GPS Coordinates: ${audit.geoLat.toFixed(6)}, ${audit.geoLng.toFixed(6)}`);
      doc.text(`Accuracy: ${audit.geoAccuracyMeters?.toFixed(1) || 'N/A'} meters`);
      doc.text(`Zone Match: ${audit.zoneMatch ? 'Verified ✓' : 'Mismatch ✗'}`);
      doc.moveDown();
    }

    // =========================================================================
    // SECTION SCORES SUMMARY
    // =========================================================================
    const sectionScores = (audit.sectionScores as any) || {};
    if (Object.keys(sectionScores).length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Section Scores Summary');
      doc.fontSize(10).font('Helvetica');

      audit.template.sections.forEach((section) => {
        const score = sectionScores[section.id];
        if (score) {
          doc.text(
            `${section.name}: ${score.score.toFixed(1)}% (${score.yes} Yes, ${score.no} No, ${score.na} N/A)`,
            { indent: 20 }
          );
        }
      });
      doc.moveDown();
    }

    // =========================================================================
    // DETAILED RESPONSES
    // =========================================================================
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('Audit Responses', { underline: true });
    doc.moveDown();

    audit.template.sections.forEach((section) => {
      doc.fontSize(12).font('Helvetica-Bold').text(section.name);
      doc.moveDown(0.5);

      const sectionResponses = audit.responses.filter(
        (r) => r.question.sectionId === section.id
      );

      section.questions.forEach((question, qIdx) => {
        const response = sectionResponses.find((r) => r.questionId === question.id);

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`${qIdx + 1}. ${question.question}${question.critical ? ' [CRITICAL]' : ''}`);

        if (response) {
          doc.font('Helvetica');
          const resultColor = response.result === 'YES' ? 'green' : response.result === 'NO' ? 'red' : 'gray';
          doc.fillColor(resultColor).text(`   Answer: ${response.result}`, { indent: 20 });
          doc.fillColor('black');

          if (response.notes) {
            doc.text(`   Notes: ${response.notes}`, { indent: 20 });
          }

          if (response.severity) {
            doc.text(`   Severity: ${response.severity}`, { indent: 20 });
          }

          // Photos
          if (response.photos && response.photos.length > 0) {
            doc.text(`   Photos: ${response.photos.length} attached`, { indent: 20 });
            response.photos.forEach((photo, pIdx) => {
              doc.fontSize(8).text(`     - ${photo.photoUrl}`, { indent: 30 });
            });
            doc.fontSize(10);
          }
        } else {
          doc.font('Helvetica').fillColor('gray').text('   [Not answered]', { indent: 20 });
          doc.fillColor('black');
        }

        doc.moveDown(0.5);

        // Add page break if needed
        if (doc.y > 700) {
          doc.addPage();
        }
      });

      doc.moveDown();
    });

    // =========================================================================
    // CORRECTIVE ACTIONS
    // =========================================================================
    if (audit.actions.length > 0) {
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('Corrective Actions', { underline: true });
      doc.moveDown();

      audit.actions.forEach((action, idx) => {
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`${idx + 1}. ${action.title}`);
        doc.font('Helvetica');
        
        if (action.description) {
          doc.text(`   Description: ${action.description}`, { indent: 20 });
        }

        doc.text(`   Severity: ${action.severity}`, { indent: 20 });
        doc.text(`   Due Date: ${new Date(action.dueDate).toLocaleDateString('en-ZA')}`, { indent: 20 });
        doc.text(`   Status: ${action.status}`, { indent: 20 });

        if (action.assignedTo) {
          doc.text(
            `   Assigned To: ${action.assignedTo.name || action.assignedTo.email}`,
            { indent: 20 }
          );
        }

        doc.moveDown();
      });
    }

    // =========================================================================
    // GENERAL COMMENTS
    // =========================================================================
    if (audit.generalComments) {
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('General Comments', { underline: true });
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').text(audit.generalComments);
      doc.moveDown();
    }

    // =========================================================================
    // TENANT ACKNOWLEDGEMENT
    // =========================================================================
    if (audit.tenantAcknowledged) {
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('Tenant Acknowledgement', { underline: true });
      doc.moveDown();
      doc.fontSize(10).font('Helvetica');
      doc.text(`Tenant Name: ${audit.tenantName || 'N/A'}`);
      doc.text(`Tenant Role: ${audit.tenantRole || 'N/A'}`);
      doc.text(`Tenant Contact: ${audit.tenantContact || 'N/A'}`);
      doc.text(`Acknowledged: ${audit.tenantAcknowledged ? 'Yes ✓' : 'No'}`);
      doc.moveDown();
    }

    // =========================================================================
    // SIGNATURES
    // =========================================================================
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('Signatures', { underline: true });
    doc.moveDown();

    // Officer Signature
    if (audit.officerSignatureUrl) {
      doc.fontSize(10).font('Helvetica');
      doc.text('Officer Signature:');
      doc.text(`Signed by: ${audit.conductedBy.name || audit.conductedBy.email}`);
      if (audit.officerSignedAt) {
        doc.text(`Date: ${new Date(audit.officerSignedAt).toLocaleString('en-ZA')}`);
      }
      doc.fontSize(8).text(`Signature URL: ${audit.officerSignatureUrl}`);
      doc.fontSize(10);
      doc.moveDown();
    }

    // Manager Signature
    if (audit.managerSignatureUrl) {
      doc.fontSize(10).font('Helvetica');
      doc.text('Manager Verification:');
      if (audit.managerVerifiedAt) {
        doc.text(`Verified Date: ${new Date(audit.managerVerifiedAt).toLocaleString('en-ZA')}`);
      }
      doc.fontSize(8).text(`Signature URL: ${audit.managerSignatureUrl}`);
      doc.fontSize(10);
      doc.moveDown();
    }

    // Rejection Reason
    if (audit.status === 'REJECTED' && audit.rejectionReason) {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('red');
      doc.text('REJECTION REASON:');
      doc.font('Helvetica').text(audit.rejectionReason);
      doc.fillColor('black');
      doc.moveDown();
    }

    // =========================================================================
    // FOOTER
    // =========================================================================
    doc.fontSize(8).font('Helvetica').fillColor('gray');
    doc.text(
      `Generated: ${new Date().toLocaleString('en-ZA')} | V&A Waterfront Compliance System`,
      50,
      750,
      { align: 'center' }
    );

    // Finalize PDF
    doc.end();

    // Wait for PDF to be generated
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // Return PDF
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="audit-${audit.store.storeCode}-${new Date(audit.auditDate).toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
