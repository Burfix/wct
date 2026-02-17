'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { generateAuditPDF } from '@/lib/pdf-generator';

interface DownloadPDFButtonProps {
  audit: unknown;
}

export default function DownloadPDFButton({ audit }: DownloadPDFButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      await generateAuditPDF({
        audit,
        watermark: 'Mall Risk Compliance Platform – Confidential',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={handleDownload}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      Download PDF
    </Button>
  );
}
