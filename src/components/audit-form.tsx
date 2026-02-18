'use client';

/**
 * Mobile-Optimized Restaurant Audit Form
 * Features:
 * - Touch-friendly Yes/No/N/A buttons
 * - Collapsible sections
 * - Progress indicator
 * - Auto-save drafts
 * - Photo upload for failed items
 * - Real-time scoring display
 * - Signature capture
 * - Tenant acknowledgement
 * - Geo-location capture
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Camera, Check, X, Minus, ChevronDown, ChevronRight, Save, Send, MapPin, Pencil, Loader2 } from 'lucide-react';
import {
  calculateAuditScore,
  formatScore,
  getRiskColor,
  getScoreBadgeColor,
  type AuditResponseData,
} from '@/lib/audit-scoring';
import { ActionSeverity, AuditResult } from '@prisma/client';
import { useUploadThing } from '@/lib/uploadthing';
import SignaturePad from './signature-pad';
import TenantAcknowledgement from './tenant-acknowledgement';
import dynamic from 'next/dynamic';

interface AuditQuestion {
  id: string;
  question: string;
  description?: string | null;
  critical: boolean;
  order: number;
}

interface AuditSection {
  id: string;
  name: string;
  description?: string | null;
  weight: number;
  order: number;
  questions: AuditQuestion[];
}

interface AuditTemplate {
  id: string;
  name: string;
  description?: string | null;
  sections: AuditSection[];
}

interface Store {
  id: string;
  storeCode: string;
  name: string;
  zone: string;
}

interface AuditResponse {
  questionId: string;
  result: AuditResult | null;
  notes: string;
  severity: ActionSeverity | null;
  photos: File[];
  uploadedPhotoUrls?: string[]; // URLs of uploaded photos
}

interface Props {
  store: Store;
  template: AuditTemplate;
  auditId: string;
  existingResponses?: Record<string, AuditResponse>;
}

export default function AuditForm({ store, template, auditId, existingResponses = {} }: Props) {
  const router = useRouter();
  const [responses, setResponses] = useState<Record<string, AuditResponse>>(existingResponses);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([template.sections[0]?.id]));
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [generalComments, setGeneralComments] = useState('');
  const [tenantAcknowledged, setTenantAcknowledged] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantRole, setTenantRole] = useState('');
  const [tenantContact, setTenantContact] = useState('');
  const [tenantSignature, setTenantSignature] = useState<string | null>(null);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'CAPTURED' | 'DENIED' | 'UNAVAILABLE'>('UNAVAILABLE');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [officerSignature, setOfficerSignature] = useState<string | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState<Record<string, boolean>>({});
  
  const { startUpload } = useUploadThing('auditPhotoUploader');

  // Calculate progress
  const totalQuestions = template.sections.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredQuestions = Object.values(responses).filter((r) => r.result !== null).length;
  const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  // Calculate live score
  const scoreData = calculateLiveScore();

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleAutoSave();
    }, 30000);

    return () => clearInterval(interval);
  }, [responses]);

  // Request geo-location on mount
  useEffect(() => {
    requestGeoLocation();
  }, []);

  function requestGeoLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          setGeoStatus('CAPTURED');
        },
        (error) => {
          console.log('Geo permission denied:', error);
          setGeoStatus('DENIED');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    } else {
      setGeoStatus('UNAVAILABLE');
    }
  }

  function calculateLiveScore() {
    const responseData: AuditResponseData[] = [];
    
    template.sections.forEach((section) => {
      section.questions.forEach((question) => {
        const response = responses[question.id];
        if (response?.result) {
          responseData.push({
            questionId: question.id,
            result: response.result,
            sectionId: section.id,
            sectionName: section.name,
            sectionWeight: section.weight,
          });
        }
      });
    });

    const criticalQuestionIds = template.sections
      .flatMap((s) => s.questions)
      .filter((q) => q.critical)
      .map((q) => q.id);

    return calculateAuditScore(responseData, criticalQuestionIds);
  }

  async function handleAutoSave() {
    if (Object.keys(responses).length === 0) return;

    setIsSaving(true);
    try {
      // Save each response
      for (const [questionId, response] of Object.entries(responses)) {
        if (response.result) {
          await fetch('/api/audits/save-response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              auditId,
              questionId,
              result: response.result,
              notes: response.notes,
              severity: response.severity,
            }),
          });
        }
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }

  function handleResponseChange(questionId: string, result: AuditResult) {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        questionId,
        result,
        notes: prev[questionId]?.notes || '',
        severity: prev[questionId]?.severity || null,
        photos: prev[questionId]?.photos || [],
      },
    }));
  }

  function handleNotesChange(questionId: string, notes: string) {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        notes,
      },
    }));
  }

  function handleSeverityChange(questionId: string, severity: ActionSeverity) {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        severity,
      },
    }));
  }

  async function handlePhotoUpload(questionId: string, files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploadingPhotos(prev => ({ ...prev, [questionId]: true }));

    try {
      // Upload photos to cloud storage
      const filesArray = Array.from(files);
      const uploaded = await startUpload(filesArray);

      if (!uploaded || uploaded.length === 0) {
        throw new Error('Upload failed');
      }

      const photoUrls = uploaded.map(f => f.url);

      setResponses((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          questionId,
          photos: [...(prev[questionId]?.photos || []), ...filesArray],
          uploadedPhotoUrls: [...(prev[questionId]?.uploadedPhotoUrls || []), ...photoUrls],
        },
      }));

      // Save photo URLs to database
      await fetch('/api/audits/save-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditId,
          questionId,
          photoUrls,
        }),
      });
    } catch (error) {
      console.error('Photo upload error:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setUploadingPhotos(prev => ({ ...prev, [questionId]: false }));
    }
  }

  function toggleSection(sectionId: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }

  async function handleSubmit() {
    // Validate: all questions answered
    if (answeredQuestions < totalQuestions) {
      alert(`Please answer all questions (${answeredQuestions}/${totalQuestions} complete)`);
      return;
    }

    // Validate: all NO responses have notes and severity and photos
    for (const response of Object.values(responses)) {
      if (response.result === 'NO') {
        if (!response.notes || !response.severity) {
          alert('All non-compliant items must have notes and severity level');
          return;
        }
        if (!response.uploadedPhotoUrls || response.uploadedPhotoUrls.length === 0) {
          alert('All non-compliant items must have photo evidence');
          return;
        }
      }
    }

    // Require officer signature
    if (!officerSignature) {
      setShowSignaturePad(true);
      return;
    }

    setIsSaving(true);
    try {
      // Submit audit
      const submitResponse = await fetch('/api/audits/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditId,
          generalComments,
          tenantAcknowledged,
          tenantName: tenantAcknowledged ? tenantName : undefined,
          tenantRole: tenantAcknowledged ? tenantRole : undefined,
          tenantContact: tenantAcknowledged ? tenantContact : undefined,
          tenantSignatureUrl: tenantAcknowledged ? tenantSignature : undefined,
          officerSignatureUrl: officerSignature,
          geoLat: geoLocation?.lat,
          geoLng: geoLocation?.lng,
          geoAccuracyMeters: geoLocation?.accuracy,
          geoStatus,
        }),
      });

      if (!submitResponse.ok) {
        throw new Error('Failed to submit audit');
      }

      alert('Audit submitted successfully!');
      router.push(`/audits/${auditId}`);
    } catch (error) {
      console.error('Submit failed:', error);
      alert('Failed to submit audit. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-lg font-bold">{template.name}</h1>
              <p className="text-sm text-gray-600">
                {store.storeCode} - {store.name}
              </p>
            </div>
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Save className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Progress: {answeredQuestions}/{totalQuestions}</span>
              <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Live Score */}
          {answeredQuestions > 0 && (
            <div className={`mt-3 p-3 rounded-lg border ${getRiskColor(scoreData.riskLevel)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium uppercase">Live Score</div>
                  <div className="text-2xl font-bold">{formatScore(scoreData.overallScore)}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(scoreData.riskLevel)}`}>
                  {scoreData.riskLevel}
                </div>
              </div>
              {scoreData.criticalFailures > 0 && (
                <div className="mt-2 text-sm font-medium">
                  ⚠️ {scoreData.criticalFailures} Critical Failure(s)
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="px-4 py-4 space-y-4">
        {template.sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          const sectionResponses = section.questions.filter((q) => responses[q.id]?.result);
          const sectionProgress = section.questions.length > 0 
            ? (sectionResponses.length / section.questions.length) * 100 
            : 0;

          return (
            <div key={section.id} className="bg-white rounded-lg border shadow-sm">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{section.name}</h2>
                    {section.weight > 1 && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        Weight {section.weight}x
                      </span>
                    )}
                  </div>
                  {section.description && (
                    <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-green-500 h-1 rounded-full transition-all"
                        style={{ width: `${sectionProgress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {sectionResponses.length}/{section.questions.length}
                    </span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Section Questions */}
              {isExpanded && (
                <div className="border-t divide-y">
                  {section.questions.map((question) => {
                    const response = responses[question.id];
                    const showDetails = response?.result === 'NO';

                    return (
                      <div key={question.id} className="p-4">
                        {/* Question */}
                        <div className="flex items-start gap-2 mb-3">
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {question.question}
                              {question.critical && (
                                <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                                  CRITICAL
                                </span>
                              )}
                            </div>
                            {question.description && (
                              <p className="text-xs text-gray-600 mt-1">{question.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Response Buttons */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <button
                            onClick={() => handleResponseChange(question.id, 'YES')}
                            className={`py-3 rounded-lg font-medium transition-all ${
                              response?.result === 'YES'
                                ? 'bg-green-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <Check className="w-5 h-5 mx-auto mb-1" />
                            <div className="text-xs">Yes</div>
                          </button>

                          <button
                            onClick={() => handleResponseChange(question.id, 'NO')}
                            className={`py-3 rounded-lg font-medium transition-all ${
                              response?.result === 'NO'
                                ? 'bg-red-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <X className="w-5 h-5 mx-auto mb-1" />
                            <div className="text-xs">No</div>
                          </button>

                          <button
                            onClick={() => handleResponseChange(question.id, 'NA')}
                            className={`py-3 rounded-lg font-medium transition-all ${
                              response?.result === 'NA'
                                ? 'bg-gray-400 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <Minus className="w-5 h-5 mx-auto mb-1" />
                            <div className="text-xs">N/A</div>
                          </button>
                        </div>

                        {/* Details for NO response */}
                        {showDetails && (
                          <div className="space-y-3 p-3 bg-red-50 rounded-lg border border-red-200">
                            {/* Notes */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes (Required) *
                              </label>
                              <textarea
                                value={response.notes}
                                onChange={(e) => handleNotesChange(question.id, e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                placeholder="Describe the non-compliance issue..."
                                required
                              />
                            </div>

                            {/* Severity */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Severity (Required) *
                              </label>
                              <select
                                value={response.severity || ''}
                                onChange={(e) => handleSeverityChange(question.id, e.target.value as ActionSeverity)}
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                required
                              >
                                <option value="">Select severity...</option>
                                <option value="LOW">Low (30 days)</option>
                                <option value="MEDIUM">Medium (14 days)</option>
                                <option value="HIGH">High (7 days)</option>
                                <option value="CRITICAL">Critical (3 days)</option>
                              </select>
                            </div>

                            {/* Photo Upload */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Photos (Required) *
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                capture="environment"
                                onChange={(e) => handlePhotoUpload(question.id, e.target.files)}
                                className="w-full text-sm"
                                disabled={uploadingPhotos[question.id]}
                              />
                              {uploadingPhotos[question.id] && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Uploading photos...
                                </div>
                              )}
                              {response.uploadedPhotoUrls && response.uploadedPhotoUrls.length > 0 && (
                                <div className="mt-2">
                                  <div className="text-sm text-green-600 flex items-center gap-1 mb-2">
                                    <Check className="w-4 h-4" />
                                    {response.uploadedPhotoUrls.length} photo(s) uploaded
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    {response.uploadedPhotoUrls.map((url, idx) => (
                                      <img
                                        key={idx}
                                        src={url}
                                        alt={`Evidence ${idx + 1}`}
                                        className="w-full h-20 object-cover rounded border"
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* General Comments */}
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            General Comments
          </label>
          <textarea
            value={generalComments}
            onChange={(e) => setGeneralComments(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded-md text-sm"
            placeholder="Additional observations, recommendations, or concerns..."
          />
        </div>

        {/* Tenant Acknowledgement */}
        <TenantAcknowledgement
          tenantAcknowledged={tenantAcknowledged}
          tenantName={tenantName}
          tenantRole={tenantRole}
          tenantContact={tenantContact}
          tenantSignature={tenantSignature}
          onAcknowledgedChange={setTenantAcknowledged}
          onNameChange={setTenantName}
          onRoleChange={setTenantRole}
          onContactChange={setTenantContact}
          onSignatureChange={setTenantSignature}
        />

        {/* Geo Location */}
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div className="text-sm">
                <div className="font-medium">Location Proof</div>
                <div className="text-gray-600">
                  {geoStatus === 'CAPTURED' && `Captured ✅ (±${geoLocation?.accuracy.toFixed(0)}m)`}
                  {geoStatus === 'DENIED' && 'Permission denied 🚫'}
                  {geoStatus === 'UNAVAILABLE' && 'Unavailable ⚪'}
                </div>
              </div>
            </div>
            {geoStatus === 'DENIED' && (
              <button
                onClick={requestGeoLocation}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md"
              >
                Retry
              </button>
            )}
          </div>
        </div>

        {/* Officer Signature */}
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium text-gray-700">Officer Signature</div>
              <div className="text-xs text-gray-600">Required before submission</div>
            </div>
            {officerSignature && (
              <div className="text-green-600 text-sm font-medium flex items-center gap-1">
                <Check className="w-4 h-4" />
                Signed
              </div>
            )}
          </div>

          {officerSignature ? (
            <div className="border rounded-lg p-2 bg-gray-50">
              <img
                src={officerSignature}
                alt="Officer signature"
                className="h-20 object-contain mx-auto"
              />
              <button
                onClick={() => setShowSignaturePad(true)}
                className="mt-2 w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md flex items-center justify-center gap-1"
              >
                <Pencil className="w-4 h-4" />
                Update Signature
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSignaturePad(true)}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 font-medium flex items-center justify-center gap-2"
            >
              <Pencil className="w-5 h-5" />
              Add Signature
            </button>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <button
          onClick={handleSubmit}
          disabled={isSaving || answeredQuestions < totalQuestions || !officerSignature}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Audit ({answeredQuestions}/{totalQuestions})
            </>
          )}
        </button>
        {!officerSignature && (
          <p className="text-center text-sm text-gray-600 mt-2">
            Please add your signature before submitting
          </p>
        )}
      </div>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <SignaturePad
          title="Officer Signature"
          description="Sign to confirm audit completion and accuracy"
          onSave={(url) => {
            setOfficerSignature(url);
            setShowSignaturePad(false);
          }}
          onCancel={() => setShowSignaturePad(false)}
        />
      )}
    </div>
  );
}
