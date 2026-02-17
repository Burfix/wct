import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { auditId, questionId, photoUrls } = body;

    if (!auditId || !questionId || !photoUrls || !Array.isArray(photoUrls)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Find the response
    const response = await prisma.auditResponse.findUnique({
      where: {
        auditId_questionId: {
          auditId,
          questionId,
        },
      },
    });

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    // Create photo records
    const photos = await Promise.all(
      photoUrls.map((url: string) =>
        prisma.auditPhoto.create({
          data: {
            responseId: response.id,
            auditId,
            photoUrl: url,
            uploadedById: session.user.id!,
          },
        })
      )
    );

    return NextResponse.json({ success: true, photos });
  } catch (error: any) {
    console.error('Save photos error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
