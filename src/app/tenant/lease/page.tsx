import PortalSection from "@/components/layout/PortalSection";
import PortalShell from "@/components/layout/PortalShell";
import PortalSidebar from "@/components/layout/PortalSidebar";
import LogoutButton from "@/components/LogoutButton";
import shellStyles from "@/components/layout/portal-shell.module.css";
import { tenantNav } from "@/lib/tenant-nav";
import { getTenantContext } from "@/lib/tenant-context";

type TenantDocument = {
  id: string;
  document_name: string | null;
  title: string | null;
  file_name: string | null;
  category: string | null;
  created_at: string | null;
};

export default async function TenantLeasePage() {
  const { profile, supabase, tenantId, tenantLookupError } =
    await getTenantContext();

  let documents: TenantDocument[] = [];
  let documentsError: string | null = null;

  if (tenantId) {
    const { data, error } = await supabase
      .from("tenant_documents")
      .select("id, document_name, title, file_name, category, created_at")
      .eq("tenant_id", tenantId)
      .eq("visible_to_tenant", true)
      .order("created_at", { ascending: false });

    if (error) {
      documentsError = error.message;
    } else {
      documents = (data || []) as TenantDocument[];
    }
  }

  return (
    <PortalShell
      title="Tenant Portal"
      subtitle={`Welcome${
        profile?.full_name ? `, ${profile.full_name}` : ""
      }. Access your lease agreement and other documents tied to your tenancy.`}
      sidebar={
        <PortalSidebar
          portalName="Tenant Portal"
          homeHref="/tenant"
          items={tenantNav}
        />
      }
    >
      <div className={shellStyles.stack}>
        <PortalSection
          title="Lease & Documents"
          description="Access your lease agreement and other documents tied to your tenancy."
        >
          <div className={shellStyles.topBarRow}>
            <div />
            <LogoutButton />
          </div>

          {tenantLookupError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {tenantLookupError}
            </div>
          ) : documentsError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {documentsError}
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              <div className="text-2xl font-semibold text-slate-900">
                No Documents Found
              </div>
              <p className="mt-3">
                Lease files and related documents will appear here when uploaded.
              </p>
              <p className="mt-4 text-xs text-slate-400">
                Tenant record: {tenantId || "missing"}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-left text-slate-700">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Title</th>
                      <th className="px-5 py-4 font-semibold">Category</th>
                      <th className="px-5 py-4 font-semibold">Uploaded</th>
                      <th className="px-5 py-4 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-medium text-slate-900">
                          {doc.title || doc.document_name || doc.file_name || "Document"}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {doc.category || "general"}
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {doc.created_at
                            ? new Date(doc.created_at).toLocaleString()
                            : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <a
                            href={`/api/documents/${doc.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                          >
                            Open
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </PortalSection>
      </div>
    </PortalShell>
  );
}
