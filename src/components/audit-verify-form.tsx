'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, AlertTriangle, Shield } from 'lucide-react';
import { verifyAudit, rejectAudit } from '@/app/audits/actions';
import { useRouter } from 'next/navigation';
import SignaturePad from './signature-pad';
import Image from 'next/image';

interface AuditVerifyFormProps {
  auditId: string;
  auditStatus: string;
  storeName: string;
  storeCode: string;
  overallScore?: number | null;
  criticalFailures?: number;
}

export default function AuditVerifyForm({ 
  auditId, 
  auditStatus,
  storeName,
  storeCode,
  overallScore,
  criticalFailures = 0
}: AuditVerifyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [managerSignature, setManagerSignature] = useState<string | null>(null);

  const canVerify = auditStatus === 'SUBMITTED' || auditStatus === 'COMPLETE';
  const isLowScore = overallScore !== null && overallScore !== undefined && overallScore < 70;
  const hasCriticalFailures = criticalFailures > 0;

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

  if (!canVerify) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This audit is {auditStatus} and cannot be verified at this time.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg">
        <CardHeader className="border-b bg-white/50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Manager Verification
              </CardTitle>
              <CardDescription className="mt-2">
                Review and verify audit for {storeName} ({storeCode})
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          {/* Score & Critical Warnings */}
          {(isLowScore || hasCriticalFailures) && (
            <Alert variant="destructive" className="border-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="ml-2">
                <div className="font-semibold mb-1">Attention Required:</div>
                <ul className="text-sm space-y-1 ml-4 list-disc">
                  {isLowScore && (
                    <li>Low compliance score: {overallScore?.toFixed(1)}%</li>
                  )}
                  {hasCriticalFailures && (
                    <li>{criticalFailures} critical failure(s) detected</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Manager Signature Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Manager Signature</Label>
            <p className="text-sm text-muted-foreground">
              Your signature confirms that you have reviewed the audit findings and corrective actions
            </p>
            
            {managerSignature ? (
              <div className="border-2 border-blue-300 rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Signature Captured
                  </span>
                </div>
                <Image
                  src={managerSignature}
                  alt="Manager signature"
                  width={200}
                  height={64}
                  className="h-16 object-contain mb-3"
                  unoptimized
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSignaturePad(true)}
                  className="w-full"
                >
                  Update Signature
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSignaturePad(true)}
                className="w-full h-24 border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50"
              >
                <div className="text-center">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <span className="font-medium">Add Manager Signature</span>
                </div>
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={() => setShowRejectForm(!showRejectForm)}
              variant="destructive"
              className="flex-1"
              disabled={loading}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            
            <Button
              onClick={handleVerify}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={loading || !managerSignature}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify & Approve
                </>
              )}
            </Button>
          </div>

          {!managerSignature && (
            <p className="text-center text-sm text-muted-foreground">
              Please add your signature before verifying
            </p>
          )}

          {/* Rejection Form */}
          {showRejectForm && (
            <div className="space-y-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg animate-in slide-in-from-top">
              <Label htmlFor="rejectionReason" className="text-red-900 font-semibold">
                Reason for Rejection *
              </Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this audit is being rejected and what needs to be corrected..."
                rows={4}
                className="border-red-300 focus:border-red-500"
                required
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowRejectForm(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReject}
                  variant="destructive"
                  className="flex-1"
                  disabled={loading || !rejectionReason.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    'Confirm Rejection'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <SignaturePad
          title="Manager Verification Signature"
          description="Sign to verify audit findings and approve corrective actions"
          onSave={handleSignatureComplete}
          onCancel={() => setShowSignaturePad(false)}
        />
      )}
    </>
  );
}
