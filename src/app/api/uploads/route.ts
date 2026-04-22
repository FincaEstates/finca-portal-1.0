import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const ALLOWED_BUCKETS = new Set(["tenant-documents", "maintenance-photos"]);

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._/-]/g, "_");
}

function sanitizeFileName(fileName: string) {
  const cleaned = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned || "upload.bin";
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function handleRawUpload(request: Request) {
  const supabaseAdmin = createAdminClient();

  const bucketValue = safeDecode(request.headers.get("x-bucket") || "");
  const folderValue = safeDecode(request.headers.get("x-folder") || "general");
  const fileNameValue = safeDecode(request.headers.get("x-file-name") || "");
  const mimeType =
    request.headers.get("x-file-type") ||
    request.headers.get("content-type") ||
    "application/octet-stream";

  if (!bucketValue || !ALLOWED_BUCKETS.has(bucketValue)) {
    return NextResponse.json(
      { error: "Invalid or missing bucket." },
      { status: 400 }
    );
  }

  if (!fileNameValue) {
    return NextResponse.json(
      { error: "Missing x-file-name header." },
      { status: 400 }
    );
  }

  const bytes = await request.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (!buffer.length) {
    return NextResponse.json(
      { error: "Uploaded file body is empty." },
      { status: 400 }
    );
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File exceeds 15 MB limit." },
      { status: 400 }
    );
  }

  const safeFolder = sanitizeSegment(folderValue);
  const safeFileName = sanitizeFileName(fileNameValue);
  const objectPath = `${safeFolder}/${Date.now()}-${safeFileName}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucketValue)
    .upload(objectPath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload failed", uploadError);
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    bucket: bucketValue,
    path: objectPath,
    fileName: fileNameValue,
    mimeType,
    fileSize: buffer.length,
  });
}

async function handleMultipartUpload(request: Request) {
  const supabaseAdmin = createAdminClient();
  const formData = await request.formData();

  const fileValue = formData.get("file");
  const bucketValue = String(formData.get("bucket") || "");
  const folderValue = String(formData.get("folder") || "general");

  if (!(fileValue instanceof File)) {
    return NextResponse.json(
      { error: "A file is required." },
      { status: 400 }
    );
  }

  if (!bucketValue || !ALLOWED_BUCKETS.has(bucketValue)) {
    return NextResponse.json(
      { error: "Invalid or missing bucket." },
      { status: 400 }
    );
  }

  if (fileValue.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File exceeds 15 MB limit." },
      { status: 400 }
    );
  }

  const safeFolder = sanitizeSegment(folderValue);
  const safeFileName = sanitizeFileName(fileValue.name);
  const objectPath = `${safeFolder}/${Date.now()}-${safeFileName}`;

  const bytes = await fileValue.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucketValue)
    .upload(objectPath, buffer, {
      contentType: fileValue.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload failed", uploadError);
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    bucket: bucketValue,
    path: objectPath,
    fileName: fileValue.name,
    mimeType: fileValue.type || null,
    fileSize: fileValue.size,
  });
}

export async function POST(request: Request) {
  try {
    const uploadMode = (request.headers.get("x-upload-mode") || "").toLowerCase();
    const contentType = (request.headers.get("content-type") || "").toLowerCase();

    if (uploadMode === "raw") {
      return await handleRawUpload(request);
    }

    if (contentType.includes("multipart/form-data")) {
      return await handleMultipartUpload(request);
    }

    return NextResponse.json(
      {
        error:
          "Upload route expected either raw file mode or multipart/form-data.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST /api/uploads failed", error);
    return NextResponse.json(
      { error: "Unexpected upload error." },
      { status: 500 }
    );
  }
}
