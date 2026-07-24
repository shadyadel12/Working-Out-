import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listCatalogAudit,
  listModerationItems,
  listModerationReports,
  moderateCatalogItem,
  moderateUserAccount,
  type PublicLibraryKind,
} from "../../api/publicLibrary";

const kinds: PublicLibraryKind[] = [
  "exercises",
  "workouts",
  "ingredients",
  "recipes",
  "meal-plans",
];
export default function LibraryModeration() {
  const qc = useQueryClient();
  const [kind, setKind] = useState<PublicLibraryKind>("exercises");
  const [section, setSection] = useState<
    "items" | "reports" | "audit"
  >("items");
  const items = useQuery({
    queryKey: ["moderation-items", kind],
    queryFn: () => listModerationItems(kind),
  });
  const reports = useQuery({
    queryKey: ["catalog-reports"],
    queryFn: listModerationReports,
  });
  const audit = useQuery({
    queryKey: ["catalog-audit"],
    queryFn: listCatalogAudit,
  });
  const moderate = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: "visible" | "hidden" | "removed";
      reason: string;
    }) => moderateCatalogItem(kind, id, status, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["moderation-items"] }),
  });
  const act = (id: string, status: "visible" | "hidden" | "removed") => {
    const reason =
      status === "visible"
        ? "Restored by administrator"
        : window.prompt("Reason for this moderation action?");
    if (reason) moderate.mutate({ id, status, reason });
  };
  const tableKinds: Record<string, PublicLibraryKind> = { exercise_library:'exercises',workout_templates:'workouts',food_items:'ingredients',dishes:'recipes',menu_templates:'meal-plans' };
  async function actOnReport(report: any, status: 'hidden'|'removed'|'visible') {
    const reason = window.prompt('Moderation reason / escalation note:', report.details || report.reason_code || report.reason) || '';
    if (!reason) return;
    await moderateCatalogItem(tableKinds[report.entity_type], report.entity_id, status, reason);
    await qc.invalidateQueries({ queryKey: ['catalog-reports'] });
    await qc.invalidateQueries({ queryKey: ['moderation-items'] });
  }
  async function suspendOwner(report: any) {
    const reason=window.prompt('Suspension reason and escalation note:'); if(!reason||!report.owner_id)return;
    await moderateUserAccount(report.owner_id,true,reason); await qc.invalidateQueries({queryKey:['catalog-reports']});
  }
  return (
    <div className="catalog-page">
      <header className="catalog-heading">
        <div>
          <span className="overview-kicker">Safety & discovery</span>
          <h1>Public Library Moderation</h1>
          <p>
            Review reports, hide unsafe items and restore content.
          </p>
        </div>
      </header>
      <div className="catalog-tabs">
        {(["items", "reports", "audit"] as const).map((x) => (
          <button
            className={section === x ? "active" : ""}
            onClick={() => setSection(x)}
            key={x}
          >
            {x}
          </button>
        ))}
      </div>
      {section === "items" && (
        <>
          <div className="catalog-toolbar">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as PublicLibraryKind)}
            >
              {kinds.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div className="library-table-card">
            <div className="clients-table-scroll">
              <table className="clients-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Creator</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(items.data ?? []).map((x: any) => (
                    <tr key={x.id}>
                      <td>{x.name ?? x.title}</td>
                      <td>{x.creator_name ?? "Coach"}</td>
                      <td>{x.moderation_status}</td>
                      <td>{x.source_provider ?? "Coach-created"}</td>
                      <td className="library-actions">
                        {x.moderation_status !== "visible" && (
                          <button onClick={() => act(x.id, "visible")}>
                            Restore
                          </button>
                        )}
                        <button
                          className="secondary"
                          onClick={() => act(x.id, "hidden")}
                        >
                          Hide
                        </button>
                        <button
                          className="danger"
                          onClick={() => act(x.id, "removed")}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {section === "reports" && (
        <div className="library-table-card">
          <div className="clients-table-scroll">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Item</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Severity</th><th>Owner / preview</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(reports.data ?? []).map((x: any) => (
                  <tr key={x.id}>
                    <td>{new Date(x.created_at).toLocaleString()}</td>
                    <td>{x.entity_type}</td>
                    <td>{x.entity_id}</td>
                    <td>{x.reason_code ?? x.reason}{x.details ? ` — ${x.details}` : ''}</td>
                    <td>{x.status}</td>
                    <td>{x.severity ?? 'normal'}{x.acknowledged_at ? ' · acknowledged' : ''}</td>
                    <td>{x.owner_preview ?? x.owner_id ?? 'Deleted user'}<small style={{display:'block'}}>{x.item_preview?.name ?? x.item_preview?.title ?? ''}</small></td>
                    <td className="library-actions"><button className="secondary" onClick={()=>void actOnReport(x,'hidden')}>Hide</button><button className="danger" onClick={()=>void actOnReport(x,'removed')}>Remove</button><button onClick={()=>void actOnReport(x,'visible')}>Restore / dismiss</button><button className="danger" onClick={()=>void suspendOwner(x)}>Suspend user</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {section === "audit" && (
        <div className="library-table-card">
          <div className="clients-table-scroll">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Type</th>
                  <th>Item</th>
                  <th>Actor</th>
                </tr>
              </thead>
              <tbody>
                {(audit.data ?? []).map((x: any) => (
                  <tr key={x.id}>
                    <td>{new Date(x.created_at).toLocaleString()}</td>
                    <td>{x.action}</td>
                    <td>{x.entity_type}</td>
                    <td>{x.entity_id}</td>
                    <td>{x.actor_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
