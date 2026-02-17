'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { verifyAudit, rejectAudit } from '@/app/audits/actions';
import { useRouter } from 'next/navigation';
import SignaturePad from './signature-pad';
import Image from 'next/image';

interface AuditVerifyFormProps {
  auditId: string;
}

export default function AuditVerifyForm({ auditId }: AuditVerifyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [managerSignature, setManagerSignature] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!managerSignature) {
      setShowSignaturePad(true);
      return;
    }

    setLoading(true);
    try {
      await verifyAudit(auditId, managerSignature);
      router.refresh();
    } catch (error) {
      console.error('Verify audit error:', error);
      alert(error instanceof Error ? error.message : 'An error occurred while verifying the audit');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      await rejectAudit(auditId, rejectionReason);
      router.refresh();
    } catch (error) {
      console.error('Reject audit error:', error);
      alert(error instanceof Error ? error.message : 'An error occurred while rejecting the audit');
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureComplete = (signatureUrl: string) => {
    setManagerSignature(signatureUrl);
    setShowSignaturePad(false);
  };

  return (
    <>
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Manager Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Signature Section */}
          {managerSignature ? (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">
                Manager Signature
              </div>
              <div className="border-2 border-blue-300 rounded-lg p-4 bg-white">
                <Image
                  src={managerSignature}
                  alt="Manager signature"
                  width={200}
                  height={64}
                  className="h-16 object-contain"
                  unoptimized
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSignaturePad(true)}
                  className="mt-2"
                >
                  Update Signature
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">
                Manager Signature Required
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSignaturePad(true)}
                className="w-full"
              >
                Add Signature
              </Button>
            </div>
          )}

          {!showRejectForm ? (
            <div className="flex gap-3">
              <Button
                onClick={handleVerify}
                disabled={loading || !managerSignature}
                className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Verify & Approve
              </Button>
              <Button
                onClick={() => setShowRejectForm(true)}
                variant="destructive"
                disabled={loading}
                className="flex-1 gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Reason for Rejection
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a detailed reason for rejecting this audit..."
                  rows={4}
                  className="w-full"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleReject}
                  disabled={loading || !rejectionReason.trim()}
                  variant="destructive"
                  className="flex-1"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Confirm Rejection
                </Button>
                <Button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason('');
                  }}
                  variant="outline"
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showSignaturePad && (
        <SignaturePad
          onSave={handleSignatureComplete}
          onCancel={() => setShowSignaturePad(false)}
        />
      )}
    </>
  );
}
