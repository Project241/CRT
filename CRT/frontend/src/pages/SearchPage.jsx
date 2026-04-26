import { useEffect, useState } from "react";
import { Link } from "wouter";
import AppShell from "../components/AppShell.jsx";
import Pagination from "../components/Pagination.jsx";
import { api } from "../lib/api.js";
import { useToast } from "../components/Toast.jsx";

const PAGE_SIZE = 10;

export default function SearchPage() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [submittedQ, setSubmittedQ] = useState("");
  const [users, setUsers] = useState({ items: [], total: 0, totalPages: 1 });
  const [cases, setCases] = useState({ items: [], total: 0, totalPages: 1 });
  const [usersPage, setUsersPage] = useState(1);
  const [casesPage, setCasesPage] = useState(1);
  const [busy, setBusy] = useState(false);

  // Refetch users page when changed (only after a search has been submitted).
  useEffect(() => {
    if (!submittedQ) return;
    const params = new URLSearchParams({
      q: submittedQ,
      type: "users",
      page: String(usersPage),
      pageSize: String(PAGE_SIZE),
    });
    api
      .get(`/api/search?${params}`)
      .then((r) =>
        setUsers({
          items: r.users || [],
          total: r.usersTotal || 0,
          totalPages: r.usersTotalPages || 1,
        })
      )
      .catch((e) => toast.error(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersPage, submittedQ]);

  // Refetch cases page when changed (only after a search has been submitted).
  useEffect(() => {
    if (!submittedQ) return;
    const params = new URLSearchParams({
      q: submittedQ,
      type: "cases",
      page: String(casesPage),
      pageSize: String(PAGE_SIZE),
    });
    api
      .get(`/api/search?${params}`)
      .then((r) =>
        setCases({
          items: r.cases || [],
          total: r.casesTotal || 0,
          totalPages: r.casesTotalPages || 1,
        })
      )
      .catch((e) => toast.error(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [casesPage, submittedQ]);

  async function doSearch(e) {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    setUsersPage(1);
    setCasesPage(1);
    setSubmittedQ(q.trim());
    setBusy(false);
  }

  return (
    <AppShell>
      <div className="container fade-in">
        <h2>Search</h2>
        <p className="muted" style={{ marginTop: 4 }}>
          Find users by name or username, or cases by title or content.
        </p>
        <div className="spacer-7" />
        <form onSubmit={doSearch} className="row">
          <input
            className="input"
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" disabled={busy || !q.trim()}>
            Search
          </button>
        </form>
        <div className="spacer-7" />
        <div className="dash-grid">
          <div className="card">
            <h3>People{submittedQ && users.total ? ` · ${users.total}` : ""}</h3>
            <div className="spacer-7" />
            {users.items.length === 0 ? (
              <div className="empty">{submittedQ ? "No matching people." : "Run a search to see people."}</div>
            ) : (
              <>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {users.items.map((u) => (
                    <li key={u.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                      <Link href={`/u/${u.username}`}><strong>{u.full_name}</strong></Link>
                      <div className="muted small">@{u.username} · {u.role} · {u.specialty || u.year_of_study || ""}</div>
                    </li>
                  ))}
                </ul>
                <Pagination
                  page={usersPage}
                  totalPages={users.totalPages}
                  total={users.total}
                  onChange={setUsersPage}
                />
              </>
            )}
          </div>
          <div className="card">
            <h3>Cases{submittedQ && cases.total ? ` · ${cases.total}` : ""}</h3>
            <div className="spacer-7" />
            {cases.items.length === 0 ? (
              <div className="empty">{submittedQ ? "No matching cases." : "Run a search to see cases."}</div>
            ) : (
              <>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {cases.items.map((c) => (
                    <li key={c.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                      <Link href={`/case/${c.id}`}><strong>{c.title}</strong></Link>
                      <div className="muted small">{c.specialty} · L{c.level}</div>
                    </li>
                  ))}
                </ul>
                <Pagination
                  page={casesPage}
                  totalPages={cases.totalPages}
                  total={cases.total}
                  onChange={setCasesPage}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
