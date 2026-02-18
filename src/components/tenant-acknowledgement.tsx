'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SignaturePad from './signature-pad';
import { CheckCircle, Pencil } from 'lucide-react';
import Image from 'next/image';

interface TenantAcknowledgementProps {
  tenantAcknowledged: boolean;
  tenantName: string;
  tenantRole: string;
  tenantContact: string;
  tenantSignature: string | null;
  onAcknowledgedChange: (value: boolean) => void;
  onNameChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onContactChange: (value: string) => void;
  onSignatureChange: (signatureUrl: string) => void;
}

export default function TenantAcknowledgement({
  tenantAcknowledged,
  tenantName,
  tenantRole,
  tenantContact,
  tenantSignature,
  onAcknowledgedChange,
  onNameChange,
  onRoleChange,
  onContactChange,
  onSignatureChange,
}: TenantAcknowledgementProps) {
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Tenant Acknowledgement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="tenantAck"
              checked={tenantAcknowledged}
              onChange={(e) => onAcknowledgedChange(e.target.checked)}
              className="mt-1 w-4 h-4"
            />
            <label htmlFor="tenantAck" className="flex-1 text-sm">
              <div className="font-medium">Store representative has been informed</div>
              <div className="text-muted-foreground">
                Tenant/manager acknowledges audit findings and corrective actions
              </div>
            </label>
          </div>

          {tenantAcknowledged && (
            <div className="space-y-3 pt-3 border-t">
              <div>
                <Label htmlFor="tenantName">Representative Name *</Label>
                <Input
                  id="tenantName"
                  value={tenantName}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="e.g., John Smith"
                  required={tenantAcknowledged}
                />
              </div>

              <div>
                <Label htmlFor="tenantRole">Role/Position *</Label>
                <Input
                  id="tenantRole"
                  value={tenantRole}
                  onChange={(e) => onRoleChange(e.target.value)}
                  placeholder="e.g., Manager on Duty, Head Chef"
                  required={tenantAcknowledged}
                />
              </div>

              <div>
                <Label htmlFor="tenantContact">Contact Details *</Label>
                <Input
                  id="tenantContact"
                  value={tenantContact}
                  onChange={(e) => onContactChange(e.target.value)}
                  placeholder="Phone or email"
                  type="text"
                  required={tenantAcknowledged}
                />
              </div>

              {/* Tenant Signature */}
              <div className="pt-3 border-t">
                <Label className="mb-2 block">Digital Signature (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Capture the tenant&apos;s signature for formal acknowledgement
                </p>
                
                {tenantSignature ? (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <Image
                      src={tenantSignature}
                      alt="Tenant signature"
                      width={200}
                      height={64}
                      className="h-16 object-contain mb-2"
                      unoptimized
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSignaturePad(true)}
                      className="w-full"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Update Signature
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSignaturePad(true)}
                    className="w-full border-dashed border-2"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Add Tenant Signature
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <SignaturePad
          title="Tenant/Representative Signature"
          description="The store representative acknowledges receipt of audit findings"
          onSave={(url) => {
            onSignatureChange(url);
            setShowSignaturePad(false);
          }}
          onCancel={() => setShowSignaturePad(false)}
        />
      )}
    </>
  );
}
