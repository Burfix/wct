'use client';

/**
 * Signature Capture Component
 * Uses react-signature-canvas for touch-friendly signature drawing
 * Converts to PNG and uploads to cloud storage
 */

import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, Check, RotateCcw } from 'lucide-react';
import { useUploadThing } from '@/lib/uploadthing';

interface SignaturePadProps {
  onSave: (signatureUrl: string) => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export default function SignaturePad({
  onSave,
  onCancel,
  title = 'Add Your Signature',
  description = 'Sign in the box below using your finger or stylus',
}: SignaturePadProps) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { startUpload } = useUploadThing('signatureUploader');

  const handleClear = () => {
    signatureRef.current?.clear();
    setIsSigning(false);
  };

  const handleBegin = () => {
    setIsSigning(true);
  };

  const handleSave = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      alert('Please add your signature before saving');
      return;
    }

    setIsUploading(true);

    try {
      // Convert canvas to blob
      const canvas = signatureRef.current.getCanvas();
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });

      // Create file from blob
      const file = new File([blob], `signature-${Date.now()}.png`, {
        type: 'image/png',
      });

      // Upload to cloud storage
      const uploaded = await startUpload([file]);

      if (!uploaded || uploaded.length === 0) {
        throw new Error('Upload failed');
      }

      const signatureUrl = uploaded[0].url;
      onSave(signatureUrl);
    } catch (error) {
      console.error('Signature upload error:', error);
      alert('Failed to save signature. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-full"
              disabled={isUploading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Signature Canvas */}
        <div className="p-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                className: 'w-full h-64 touch-none',
                style: { touchAction: 'none' },
              }}
              backgroundColor="rgb(249, 250, 251)"
              onBegin={handleBegin}
              penColor="rgb(0, 0, 0)"
              minWidth={1}
              maxWidth={3}
            />
          </div>

          {/* Instructions */}
          {!isSigning && (
            <div className="text-center mt-4 text-sm text-gray-500">
              <p>Touch or click in the box above to sign</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t p-4 flex gap-3">
          <button
            onClick={handleClear}
            disabled={isUploading}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Clear
          </button>
          <button
            onClick={handleSave}
            disabled={!isSigning || isUploading}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Signature
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
