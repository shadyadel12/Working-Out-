import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  copyCatalogItem,
  itemsForTab,
  listPublicLibrary,
  publishCatalogItem,
  reportCatalogItem,
  type LibraryTab,
  type PublicLibraryItem,
  type PublicLibraryKind,
} from "../api/publicLibrary";

const english = {
  allPublic: "All Public Items",
  yourPublic: "Your Public Items",
  yourPrivate: "Your Private Items",
  drafts: "Drafts",
  search: "Search this library",
  allSources: "All sources",
  newest: "Newest",
  name: "Name",
  copy: "Copy to private",
  report: "Report",
  edit: "Edit",
  makePublic: "Publish publicly",
  makePrivate: "Publish privately",
  creator: "Created by",
  source: "Source",
};
const arabic = {
  allPublic: "كل العناصر العامة",
  yourPublic: "عناصرك العامة",
  yourPrivate: "عناصرك الخاصة",
  drafts: "المسودات",
  search: "ابحث في المكتبة",
  allSources: "كل المصادر",
  newest: "الأحدث",
  name: "الاسم",
  copy: "نسخ إلى مكتبتي الخاصة",
  report: "إبلاغ",
  edit: "تعديل",
  makePublic: "نشر للعامة",
  makePrivate: "نشر بشكل خاص",
  creator: "بواسطة",
  source: "المصدر",
};

export default function LibraryAccessPanel({
  kind,
  coachId,
  onEdit,
}: {
  kind: PublicLibraryKind;
  coachId: string;
  onEdit?: (item: PublicLibraryItem) => void;
}) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["public-library", kind, coachId],
    queryFn: () => listPublicLibrary(kind),
  });
  const [tab, setTab] = useState<LibraryTab>("all-public");
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState<"newest" | "name">("newest");
  const rtl =
    document.documentElement.dir === "rtl" ||
    document.documentElement.lang.startsWith("ar");
  const t = rtl ? arabic : english;
  const refresh = () =>
    qc.invalidateQueries({ queryKey: ["public-library", kind, coachId] });
  const copy = useMutation({
    mutationFn: (id: string) => copyCatalogItem(kind, id),
    onSuccess: refresh,
  });
  const publish = useMutation({
    mutationFn: ({
      id,
      visibility,
    }: {
      id: string;
      visibility: "private" | "public";
    }) => publishCatalogItem(kind, id, visibility),
    onSuccess: refresh,
  });
  const report = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      reportCatalogItem(kind, id, reason),
    onSuccess: () => window.alert(rtl ? "تم إرسال البلاغ." : "Report sent."),
  });
  const all = query.data ?? [];
  const counts = {
    "all-public": itemsForTab(all, "all-public", coachId).length,
    "your-public": itemsForTab(all, "your-public", coachId).length,
    "your-private": itemsForTab(all, "your-private", coachId).length,
    drafts: itemsForTab(all, "drafts", coachId).length,
  };
  const sources = [
    ...new Set(
      all.map((item) => item.sourceProvider).filter(Boolean) as string[],
    ),
  ];
  const rows = useMemo(
    () =>
      itemsForTab(all, tab, coachId)
        .filter(
          (item) =>
            (!source || item.sourceProvider === source) &&
            `${item.title} ${item.category ?? ""} ${item.creatorName}`
              .toLowerCase()
              .includes(search.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "name"
            ? a.title.localeCompare(b.title)
            : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
    [all, tab, coachId, source, search, sort],
  );
  const tabs: [LibraryTab, string][] = [
    ["all-public", t.allPublic],
    ["your-public", t.yourPublic],
    ["your-private", t.yourPrivate],
    ["drafts", t.drafts],
  ];
  return (
    <section className="library-access-panel" dir={rtl ? "rtl" : "ltr"}>
      <div className="library-access-tabs" role="tablist">
        {tabs.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            className={tab === value ? "active" : ""}
            onClick={() => setTab(value)}
          >
            {label} <span>{counts[value]}</span>
          </button>
        ))}
      </div>
      <div className="library-access-tools">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.search}
        />
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">{t.allSources}</option>
          {sources.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "newest" | "name")}
        >
          <option value="newest">{t.newest}</option>
          <option value="name">{t.name}</option>
        </select>
      </div>
      {query.error && <p className="error">{(query.error as Error).message}</p>}
      {!query.isLoading && (
        <div className="library-access-results">
          {rows.map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <small>
                  {item.category && <>{item.category} · </>}
                  {t.creator}: {item.creatorName} · v{item.revision}
                </small>
                {item.sourceProvider && (
                  <small>
                    {t.source}: {item.sourceProvider}
                    {item.sourceLicense ? ` · ${item.sourceLicense}` : ""}
                    {item.sourceUrl && (
                      <>
                        {" "}
                        ·{" "}
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.attribution || item.sourceUrl}
                        </a>
                      </>
                    )}
                  </small>
                )}
              </div>
              <div className="library-access-actions">
                {item.coachId === coachId && onEdit && (
                  <button className="secondary" onClick={() => onEdit(item)}>
                    {t.edit}
                  </button>
                )}
                {item.coachId === coachId && (
                  <>
                    <button
                      className="secondary"
                      disabled={publish.isPending}
                      onClick={() =>
                        publish.mutate({ id: item.id, visibility: "private" })
                      }
                    >
                      {t.makePrivate}
                    </button>
                    <button
                      disabled={publish.isPending}
                      onClick={() =>
                        publish.mutate({ id: item.id, visibility: "public" })
                      }
                    >
                      {t.makePublic}
                    </button>
                  </>
                )}
                {item.coachId !== coachId && item.visibility === "public" && (
                  <>
                    <button
                      disabled={copy.isPending}
                      onClick={() => copy.mutate(item.id)}
                    >
                      {t.copy}
                    </button>
                    <button
                      className="secondary"
                      onClick={() => {
                        const reason = window.prompt(
                          rtl
                            ? "سبب البلاغ"
                            : "Why are you reporting this item?",
                        );
                        if (reason?.trim())
                          report.mutate({ id: item.id, reason });
                      }}
                    >
                      {t.report}
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
