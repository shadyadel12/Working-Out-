import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  importCatalog,
  listCatalogAudit,
  listCatalogSources,
  listModerationItems,
  listModerationReports,
  moderateCatalogItem,
  setCatalogSourceEnabled,
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
    "items" | "reports" | "audit" | "sources"
  >("items");
  const [importQuery, setImportQuery] = useState("");
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
  const sources = useQuery({
    queryKey: ["catalog-sources"],
    queryFn: listCatalogSources,
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
  const toggle = useMutation({
    mutationFn: ({
      provider,
      enabled,
    }: {
      provider: string;
      enabled: boolean;
    }) => setCatalogSourceEnabled(provider, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog-sources"] }),
  });
  const runImport = useMutation({
    mutationFn: (provider: string) => importCatalog(provider, importQuery, 20),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["moderation-items"] });
      qc.invalidateQueries({ queryKey: ["catalog-sources"] });
    },
  });
  const act = (id: string, status: "visible" | "hidden" | "removed") => {
    const reason =
      status === "visible"
        ? "Restored by administrator"
        : window.prompt("Reason for this moderation action?");
    if (reason) moderate.mutate({ id, status, reason });
  };
  return (
    <div className="catalog-page">
      <header className="catalog-heading">
        <div>
          <span className="overview-kicker">Safety & discovery</span>
          <h1>Public Library Moderation</h1>
          <p>
            Review reports, hide unsafe items, restore content and control
            external sources.
          </p>
        </div>
      </header>
      <div className="catalog-tabs">
        {(["items", "reports", "audit", "sources"] as const).map((x) => (
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
                </tr>
              </thead>
              <tbody>
                {(reports.data ?? []).map((x: any) => (
                  <tr key={x.id}>
                    <td>{new Date(x.created_at).toLocaleString()}</td>
                    <td>{x.entity_type}</td>
                    <td>{x.entity_id}</td>
                    <td>{x.reason}</td>
                    <td>{x.status}</td>
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
      {section === "sources" && (
        <>
          <div className="catalog-toolbar">
            <input
              value={importQuery}
              onChange={(e) => setImportQuery(e.target.value)}
              placeholder="Optional search term for a small import"
            />
          </div>
          <div className="recipe-card-grid">
            {(sources.data ?? []).map((x: any) => (
              <article className="recipe-library-card" key={x.provider}>
                <div>
                  <h2>{x.display_name}</h2>
                  <p>{x.attribution}</p>
                  <small>
                    {x.license_name} · {x.last_status}
                  </small>
                  <footer>
                    <button
                      className={x.enabled ? "danger" : "secondary"}
                      onClick={() =>
                        toggle.mutate({
                          provider: x.provider,
                          enabled: !x.enabled,
                        })
                      }
                    >
                      {x.enabled ? "Disable source" : "Enable source"}
                    </button>
                    <button
                      disabled={!x.enabled || runImport.isPending}
                      onClick={() => runImport.mutate(x.provider)}
                    >
                      Import up to 20
                    </button>
                  </footer>
                </div>
              </article>
            ))}
          </div>
          {runImport.error && (
            <p className="error">{(runImport.error as Error).message}</p>
          )}
        </>
      )}
    </div>
  );
}
