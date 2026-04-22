import PortalSection from "@/components/layout/PortalSection";
import PortalShell from "@/components/layout/PortalShell";
import PortalSidebar from "@/components/layout/PortalSidebar";
import LogoutButton from "@/components/LogoutButton";
import shellStyles from "@/components/layout/portal-shell.module.css";
import { tenantNav } from "@/lib/tenant-nav";
import { getTenantContext } from "@/lib/tenant-context";

type TenantNote = {
  id: string;
  title: string | null;
  note_text: string | null;
  created_at: string | null;
};

export default async function TenantNotesPage() {
  const { profile, supabase, tenantId, tenantLookupError } =
    await getTenantContext();

  let notes: TenantNote[] = [];
  let notesError: string | null = null;

  if (tenantId) {
    const { data, error } = await supabase
      .from("tenant_notes")
      .select("id, title, note_text, created_at")
      .eq("tenant_id", tenantId)
      .eq("visible_to_tenant", true)
      .order("created_at", { ascending: false });

    if (error) {
      notesError = error.message;
    } else {
      notes = (data || []) as TenantNote[];
    }
  }

  return (
    <PortalShell
      title="Tenant Portal"
      subtitle={`Welcome${
        profile?.full_name ? `, ${profile.full_name}` : ""
      }. Review notes and updates shared with your tenancy.`}
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
          title="Notes"
          description="Updates and notes that have been shared with your tenancy."
        >
          <div className={shellStyles.topBarRow}>
            <div />
            <LogoutButton />
          </div>

          {tenantLookupError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {tenantLookupError}
            </div>
          ) : notesError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {notesError}
            </div>
          ) : notes.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              <div className="text-2xl font-semibold text-slate-900">
                No Notes Found
              </div>
              <p className="mt-3">Shared notes will appear here when posted.</p>
              <p className="mt-4 text-xs text-slate-400">
                Tenant record: {tenantId || "missing"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {note.title || "Note"}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {note.created_at
                          ? new Date(note.created_at).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {note.note_text || ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </PortalSection>
      </div>
    </PortalShell>
  );
}
