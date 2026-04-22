import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseAdmin = createAdminClient();
    const { id } = await params;

    const { data: document, error } = await supabaseAdmin
      .from("tenant_documents")
      .select("id, bucket, file_path")
      .eq("id", id)
      .single();

    if (error || !document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const { data: signed, error: signedError } = await supabaseAdmin.storage
      .from(document.bucket)
      .createSignedUrl(document.file_path, 60 * 10);

    if (signedError || !signed?.signedUrl) {
      return NextResponse.json(
        { error: signedError?.message || "Failed to open document." },
        { status: 500 }
      );
    }

    return NextResponse.redirect(signed.signedUrl, 302);
  } catch (error) {
    console.error("GET /api/documents/[id] failed", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}