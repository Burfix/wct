import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const uploadRouter = {
  // Audit photo uploader
  auditPhotoUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    .middleware(async () => {
      const session = await auth();

      if (!session?.user) {
        throw new Error("Unauthorized");
      }

      return { userId: session.user.id, uploadedAt: new Date() };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Photo uploaded:", file.url);
      console.log("Uploaded by:", metadata.userId);

      return { url: file.url, uploadedBy: metadata.userId };
    }),

  // Signature uploader (officer and manager)
  signatureUploader: f({ image: { maxFileSize: "1MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();

      if (!session?.user) {
        throw new Error("Unauthorized");
      }

      return { userId: session.user.id, uploadedAt: new Date() };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Signature uploaded:", file.url);
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
