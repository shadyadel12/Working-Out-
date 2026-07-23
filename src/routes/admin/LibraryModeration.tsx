import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listCatalogAudit,
  listModerationItems,
  listModerationReports,
  moderateCatalogItem,
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
    </div>
  );
}
