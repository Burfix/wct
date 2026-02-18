import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getAudit } from '../actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  User,
  Store,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import AuditVerifyForm from '@/components/audit-verify-form';
import { formatScore, getRiskColor } from '@/lib/audit-scoring';
import DownloadPDFButton from '@/components/download-pdf-button';
import Image from 'next/image';

export default async function AuditViewPage({
  params,
}: {
  params: { id: string };
}) {
  // @ts-nocheck - Prisma deep includes create complex types that TypeScript can't properly infer
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const audit = await getAudit(params.id);

  if (!audit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Audit Not Found</h1>
          <p className="text-gray-600 mt-2">The requested audit could not be found.</p>
        </div>
      </div>
    );
  }

  interface SectionScore {
    sectionId: string;
    sectionName: string;
    yes: number;
    no: number;
    na: number;
    score: number;
    weight: number;
    criticalFailures: number;
  }

  const isManager = session.user.role === 'ADMIN';
  const canVerify = isManager && (audit.status === 'SUBMITTED' || audit.status === 'COMPLETE');

  // Calculate section scores from sectionScores JSON
  // @ts-expect-error - Prisma types with deep includes are complex
  const sectionScores = (audit.sectionScores as SectionScore[]) || [];

  // Count critical failures
  const criticalFailures = sectionScores.reduce((sum: number, section: SectionScore) => 
    sum + (section.criticalFailures || 0), 0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">
                  {audit.template.name}
                </h1>
                <Badge
                  variant={
                    audit.status === 'SUBMITTED'
                      ? 'success'
                      : audit.status === 'DRAFT'
                      ? 'error'
                      : 'warning'
                  }
                >
                  {audit.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  <span>
                    {audit.store?.storeCode} - {audit.store?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(audit.auditDate), 'PPP')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>
                    Conducted by: {audit.conductedBy?.name || audit.conductedBy?.email}
                  </span>
                </div>
                {audit.geoProofCaptured && audit.geoStatus && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>
                      Location: {audit.geoStatus} 
                      {audit.geoAccuracyMeters && ` (±${audit.geoAccuracyMeters.toFixed(0)}m)`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <DownloadPDFButton auditId={audit.id} />
          </div>

          {/* Overall Score */}
          {audit.overallScore !== null && (
            <div className={`mt-4 p-4 rounded-lg border ${getRiskColor('HIGH')}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium uppercase text-gray-600">
                    Overall Compliance Score
                  </div>
                  <div className="text-3xl font-bold mt-1">
                    {formatScore(audit.overallScore)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Risk Level</div>
                  <div className="text-lg font-semibold mt-1">
                    {audit.overallScore >= 80
                      ? 'LOW'
                      : audit.overallScore >= 60
                      ? 'MEDIUM'
                      : 'HIGH'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section Scores */}
        {sectionScores && Array.isArray(sectionScores) && (
          <Card>
            <CardHeader>
              <CardTitle>Section Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sectionScores.map((section: SectionScore) => (
                  <div key={section.sectionId} className="border-b pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{section.sectionName}</div>
                        <div className="text-sm text-gray-600">
                          {section.yes} YES • {section.no} NO • {section.na} N/A
                          {section.weight > 1 && ` • Weight: ${section.weight}x`}
                        </div>
                      </div>
                      <div className="text-2xl font-bold">
                        {section.score.toFixed(1)}%
                      </div>
                    </div>
                    {section.criticalFailures > 0 && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        {section.criticalFailures} Critical Failure(s)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Responses */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {audit.template?.sections.map((section) => {
                const sectionResponses = audit.responses?.filter(
                  (r) => r.question.sectionId === section.id
                );

                return (
                  <div key={section.id}>
                    <h3 className="font-semibold text-lg mb-3">{section.name}</h3>
                    <div className="space-y-4">
                      {section.questions.map((question) => {
                        const response = sectionResponses.find(
                          (r) => r.questionId === question.id
                        );

                        return (
                          <div
                            key={question.id}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="font-medium mb-1">
                                  {question.question}
                                  {question.critical && (
                                    <Badge variant="error" className="ml-2">
                                      CRITICAL
                                    </Badge>
                                  )}
                                </div>
                                {question.description && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    {question.description}
                                  </p>
                                )}

                                {response && (
                                  <>
                                    {response.notes && (
                                      <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                                        <div className="font-medium text-gray-700 mb-1">
                                          Notes:
                                        </div>
                                        <div>{response.notes}</div>
                                      </div>
                                    )}

                                    {response.severity && (
                                      <div className="mt-2">
                                        <Badge variant="warning">
                                          Severity: {response.severity}
                                        </Badge>
                                      </div>
                                    )}

                                    {response.photos.length > 0 && (
                                      <div className="mt-3">
                                        <div className="text-sm font-medium text-gray-700 mb-2">
                                          Evidence Photos:
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                          {response.photos.map((photo) => (
                                            <a
                                              key={photo.id}
                                              href={photo.photoUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="block"
                                            >
                                          <Image
                                            src={photo.photoUrl}
                                            alt="Evidence"
                                            width={400}
                                            height={300}
                                            className="w-full h-32 object-cover rounded border hover:opacity-80"
                                            unoptimized
                                          />
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>

                              {response && (
                                <div>
                                  {response.result === 'YES' && (
                                    <Badge variant="success" className="gap-1">
                                      <CheckCircle className="w-4 h-4" />
                                      YES
                                    </Badge>
                                  )}
                                  {response.result === 'NO' && (
                                    <Badge variant="error" className="gap-1">
                                      <XCircle className="w-4 h-4" />
                                      NO
                                    </Badge>
                                  )}
                                  {response.result === 'NA' && (
                                    <Badge variant="secondary">N/A</Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* General Comments */}
        {audit.generalComments && (
          <Card>
            <CardHeader>
              <CardTitle>General Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {audit.generalComments}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tenant Acknowledgement */}
        {audit.acknowledgement && audit.acknowledgement.acknowledged && (
          <Card>
            <CardHeader>
              <CardTitle>Tenant Acknowledgement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Name</div>
                  <div className="font-medium">{audit.acknowledgement.name}</div>
                </div>
                <div>
                  <div className="text-gray-600">Role</div>
                  <div className="font-medium">{audit.acknowledgement.role}</div>
                </div>
                <div>
                  <div className="text-gray-600">Contact</div>
                  <div className="font-medium">{audit.acknowledgement.contact}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signatures */}
        {(audit.officerSignatureUrl || audit.managerSignatureUrl) && (
          <Card>
            <CardHeader>
              <CardTitle>Signatures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {audit.officerSignatureUrl && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Officer</div>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      {audit.officerSignatureUrl && (
                        <>
                          <Image
                            src={audit.officerSignatureUrl}
                            alt="Officer signature"
                            width={200}
                            height={64}
                            className="h-16 object-contain"
                            unoptimized
                          />
                          <div className="text-xs text-gray-600 mt-2">
                            {audit.officerSignedAt &&
                              format(new Date(audit.officerSignedAt), 'PPp')}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {audit.managerSignatureUrl && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Manager</div>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <Image
                        src={audit.managerSignatureUrl}
                        alt="Manager signature"
                        width={200}
                        height={64}
                        className="h-16 object-contain"
                        unoptimized
                      />
                      <div className="text-xs text-gray-600 mt-2">
                        {audit.managerSignedAt &&
                          format(new Date(audit.managerSignedAt), 'PPp')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Corrective Actions */}
        {audit.actions && audit.actions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Auto-Generated Corrective Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {audit.actions.map((action) => (
                  <div key={action.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium mb-1">{action.title}</div>
                        <div className="text-sm text-gray-600 mb-2">
                          {action.description}
                        </div>
                        <div className="flex gap-2 text-sm">
                          <Badge variant={action.severity === 'CRITICAL' ? 'error' : 'warning'}>
                            {action.severity}
                          </Badge>
                          <Badge variant="outline">
                            Due: {format(new Date(action.dueDate), 'PP')}
                          </Badge>
                          {action.assignedTo && (
                            <Badge variant="secondary">
                              Assigned: {action.assignedTo.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={
                          action.status === 'RESOLVED'
                            ? 'success'
                            : action.status === 'IN_PROGRESS'
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {action.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manager Verification */}
        {canVerify && (
          <AuditVerifyForm 
            auditId={audit.id}
            auditStatus={audit.status}
            storeName={audit.store?.name}
            storeCode={audit.store?.storeCode}
            overallScore={audit.overallScore}
            criticalFailures={criticalFailures}
          />
        )}

        {/* Rejection Reason */}
        {audit.status === 'REJECTED' && audit.rejectionReason && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Audit Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{audit.rejectionReason}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
