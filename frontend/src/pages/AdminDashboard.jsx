import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import AppShell from "../components/AppShell.jsx";
import Modal from "../components/Modal.jsx";
import Pagination from "../components/Pagination.jsx";
import Skeleton from "../components/Skeleton.jsx";
import { api } from "../lib/api.js";
import { useToast } from "../components/Toast.jsx";

const PAGE_SIZE = 10;

// Inline icon: replaces the previous 📜 emoji on the Server logs button.
function LogsIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ verticalAlign: "-2px" }}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
      <line x1="8" y1="9" x2="10" y2="9" />
    </svg>
  );
}

// Used in place of "—" while stats are loading so the row doesn't look broken.
function StatValue({ value }) {
  if (value === null || value === undefined) {
    return <Skeleton width="60%" height={26} />;
  }
  return <span>{value}</span>;
}

export default function AdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);

  // Pending doctors
  const [pending, setPending] = useState({ items: [], total: 0, totalPages: 1, loading: true });
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingQ, setPendingQ] = useState("");

  // Delete requests
  const [drs, setDrs] = useState({ items: [], total: 0, totalPages: 1, loading: true });
  const [drPage, setDrPage] = useState(1);
  const [drQ, setDrQ] = useState("");
  const [drStatus, setDrStatus] = useState("pending");

  // Reports
  const [reports, setReports] = useState({ items: [], total: 0, totalPages: 1, loading: true });
  const [repPage, setRepPage] = useState(1);
  const [repQ, setRepQ] = useState("");
  const [repStatus, setRepStatus] = useState("open");

  // Practice activity
  const [caseAttempts, setCaseAttempts] = useState([]);
  const [studentAttempts, setStudentAttempts] = useState([]);
  const [attemptsSort, setAttemptsSort] = useState("most");

  // AI generate
  const [genCount, setGenCount] = useState(5);
  const [genLevel, setGenLevel] = useState(3);
  const [genSpecialty, setGenSpecialty] = useState("");
  const [specialtyList, setSpecialtyList] = useState([]);
  const [genBusy, setGenBusy] = useState(false);

  // Server logs badge
  const [unseenLogs, setUnseenLogs] = useState({ count: 0, hasError: false });

  // Modals
  const [doctorModal, setDoctorModal] = useState(null); // { doctor, action: 'approve'|'reject' }
  const [editInsteadModal, setEditInsteadModal] = useState(null); // { request, case }
  const [reportNoteModal, setReportNoteModal] = useState(null); // { report, status }

  function loadStats() {
    setStats(null);
    api.get("/api/admin/stats").then(setStats).catch(() => setStats({}));
  }

  function loadPending(page = pendingPage, q = pendingQ) {
    setPending((p) => ({ ...p, loading: true }));
    const params = new URLSearchParams({ page, pageSize: PAGE_SIZE });
    if (q.trim()) params.set("q", q.trim());
    api.get(`/api/admin/doctors/pending?${params}`)
      .then((r) => setPending({
        items: r.items || r.doctors || [],
        total: r.total || 0,
        totalPages: r.totalPages || 1,
        loading: false,
      }))
      .catch(() => setPending({ items: [], total: 0, totalPages: 1, loading: false }));
  }

  function loadDrs(page = drPage, q = drQ, status = drStatus) {
    setDrs((p) => ({ ...p, loading: true }));
    const params = new URLSearchParams({ page, pageSize: PAGE_SIZE, status });
    if (q.trim()) params.set("q", q.trim());
    api.get(`/api/discussions/delete-requests?${params}`)
      .then((r) => setDrs({
        items: r.items || r.requests || [],
        total: r.total || 0,
        totalPages: r.totalPages || 1,
        loading: false,
      }))
      .catch(() => setDrs({ items: [], total: 0, totalPages: 1, loading: false }));
  }

  function loadReports(page = repPage, q = repQ, status = repStatus) {
    setReports((p) => ({ ...p, loading: true }));
    const params = new URLSearchParams({ page, pageSize: PAGE_SIZE, status });
    if (q.trim()) params.set("q", q.trim());
    api.get(`/api/admin/reports?${params}`)
      .then((r) => setReports({
        items: r.items || r.reports || [],
        total: r.total || 0,
        totalPages: r.totalPages || 1,
        loading: false,
      }))
      .catch(() => setReports({ items: [], total: 0, totalPages: 1, loading: false }));
  }

  function loadActivity() {
    Promise.all([
      api.get(`/api/admin/case-attempts?limit=200&sort=${attemptsSort === "least" ? "least" : "most"}`).catch(() => ({ cases: [] })),
      api.get("/api/admin/student-attempts?limit=200").catch(() => ({ users: [] })),
    ]).then(([ca, sa]) => {
      setCaseAttempts(ca.cases || []);
      setStudentAttempts(sa.users || []);
    });
  }

  // Initial load
  useEffect(() => {
    loadStats();
    api.get("/api/cases/specialties").then((r) => setSpecialtyList(r.specialties || [])).catch(() => {});
  }, []);

  // Pending: refetch on page or search change (debounced for q).
  useEffect(() => {
    const t = setTimeout(() => loadPending(pendingPage, pendingQ), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [pendingPage, pendingQ]);

  // Delete requests
  useEffect(() => {
    const t = setTimeout(() => loadDrs(drPage, drQ, drStatus), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [drPage, drQ, drStatus]);

  // Reports
  useEffect(() => {
    const t = setTimeout(() => loadReports(repPage, repQ, repStatus), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [repPage, repQ, repStatus]);

  // Activity
  useEffect(() => { loadActivity(); /* eslint-disable-next-line */ }, [attemptsSort]);

  // Server-logs badge listener
  useEffect(() => {
    function onStatus(e) {
      const d = e.detail || {};
      setUnseenLogs({ count: d.count || 0, hasError: !!d.hasError });
    }
    window.addEventListener("admin:logs:status", onStatus);
    return () => window.removeEventListener("admin:logs:status", onStatus);
  }, []);

  async function generateCases() {
    setGenBusy(true);
    try {
      const r = await api.post("/api/admin/cases/generate", {
        count: genCount,
        level: genLevel,
        specialty: genSpecialty || null,
      });
      const okN = r.inserted?.length || 0;
      if (okN === 0) toast.error("AI generation failed — check server logs");
      else if (r.failedCount) toast.success(`Generated ${okN} of ${genCount} cases (${r.failedCount} failed)`);
      else toast.success(`Generated ${okN} cases with diagnoses`);
      loadStats();
    } catch (e) { toast.error(e.message); }
    finally { setGenBusy(false); }
  }

  // ----- Doctor approve / reject (modal) -----
  function openDoctorModal(doctor, action) {
    setDoctorModal({ doctor, action, note: "" });
  }
  async function submitDoctorDecision() {
    const { doctor, action, note } = doctorModal;
    if (action === "reject" && !note.trim()) {
      toast.error("Please provide a reason for rejecting this applicant.");
      return;
    }
    try {
      await api.patch(`/api/admin/doctors/${doctor.id}/${action}`, { note: note.trim() });
      toast.success(action === "approve" ? "Doctor approved" : "Application rejected");
      setDoctorModal(null);
      loadPending();
      loadStats();
    } catch (e) { toast.error(e.message); }
  }

  // ----- Delete request decisions -----
  async function deleteRequestApprove(request) {
    const ok = window.confirm(
      `Delete the case "${request.case_title}" permanently?\n\nThis will hide it from learners. The requester will be notified.`
    );
    if (!ok) return;
    try {
      await api.patch(`/api/admin/delete-requests/${request.id}`, { decision: "approved" });
      toast.success("Case deleted");
      loadDrs(); loadStats();
    } catch (e) { toast.error(e.message); }
  }
  async function deleteRequestReject(request) {
    const ok = window.confirm(`Reject the delete request for "${request.case_title}"?`);
    if (!ok) return;
    try {
      await api.patch(`/api/admin/delete-requests/${request.id}`, { decision: "rejected" });
      toast.success("Request rejected");
      loadDrs(); loadStats();
    } catch (e) { toast.error(e.message); }
  }
  async function openEditInstead(request) {
    try {
      const c = await api.get(`/api/cases/${request.case_id}`);
      setEditInsteadModal({
        request,
        form: {
          title: c.title || "",
          specialty: c.specialty || "",
          level: c.level ?? 3,
          body: c.body || "",
          diagnosis: c.diagnosis || "",
          diagnosis_explanation: c.diagnosis_explanation || "",
        },
      });
    } catch (e) {
      toast.error("Could not load case for editing: " + e.message);
    }
  }
  async function submitEditInstead() {
    const { request, form } = editInsteadModal;
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and presentation are required.");
      return;
    }
    try {
      await api.patch(`/api/cases/${request.case_id}`, {
        title: form.title.trim(),
        specialty: form.specialty.trim(),
        level: parseInt(form.level, 10) || 3,
        body: form.body.trim(),
        diagnosis: form.diagnosis.trim(),
        diagnosis_explanation: form.diagnosis_explanation.trim(),
      });
      await api.patch(`/api/admin/delete-requests/${request.id}`, { decision: "edit_instead" });
      toast.success("Case updated and request resolved");
      setEditInsteadModal(null);
      loadDrs(); loadStats();
    } catch (e) { toast.error(e.message); }
  }

  // ----- Reports actions -----
  function openReportAction(report, status) {
    setReportNoteModal({ report, status, note: "" });
  }
  async function submitReportAction() {
    const { report, status, note } = reportNoteModal;
    try {
      await api.patch(`/api/admin/reports/${report.id}`, { status, note: note.trim() });
      toast.success(status === "actioned" ? "Marked as actioned" : status === "dismissed" ? "Report dismissed" : "Report re-opened");
      setReportNoteModal(null);
      loadReports();
    } catch (e) { toast.error(e.message); }
  }

  const pendingDoctorBadge = useMemo(() => stats?.pendingDoctors ?? null, [stats]);

  return (
    <AppShell>
      <div className="container fade-in">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0 }}>Admin</h2>
            <p className="muted" style={{ marginTop: 4 }}>Approvals, reports, and platform health.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Link href="/admin/logs" className="btn" style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <LogsIcon /> Server logs
              {unseenLogs.count > 0 && (
                <span
                  title={`${unseenLogs.count} new ${unseenLogs.hasError ? "error/warning" : "warning"}${unseenLogs.count > 1 ? "s" : ""}`}
                  style={{
                    position: "absolute", top: -6, right: -6,
                    minWidth: 18, height: 18, padding: "0 5px",
                    borderRadius: 999,
                    background: unseenLogs.hasError ? "#dc2626" : "#d97706",
                    color: "#fff", fontSize: 11, fontWeight: 700, lineHeight: "18px",
                    textAlign: "center", boxShadow: "0 0 0 2px var(--bg, #fff)",
                    animation: "pulseDot 1.6s ease-in-out infinite",
                  }}
                >
                  {unseenLogs.count > 99 ? "99+" : unseenLogs.count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="spacer-7" />
        <div className="stat-row">
          <div className="stat"><div className="stat-label">Cases</div><div className="stat-value"><StatValue value={stats?.cases} /></div></div>
          <div className="stat"><div className="stat-label">Total attempts</div><div className="stat-value"><StatValue value={stats?.responses} /></div></div>
          <div className="stat"><div className="stat-label">Cases attempted</div><div className="stat-value"><StatValue value={stats?.attemptedCases} /></div></div>
          <div className="stat"><div className="stat-label">Active learners</div><div className="stat-value"><StatValue value={stats?.distinctAttempters} /></div></div>
          <div className="stat"><div className="stat-label">Pending doctors</div><div className="stat-value"><StatValue value={stats?.pendingDoctors} /></div></div>
          <div className="stat"><div className="stat-label">Open delete reqs</div><div className="stat-value"><StatValue value={stats?.openDeleteRequests} /></div></div>
        </div>

        {/* Pending doctors */}
        <div className="spacer-7" />
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <h3 style={{ margin: 0 }}>
              Doctor approvals
              {pendingDoctorBadge ? <span className="muted small" style={{ marginLeft: 8 }}>({pendingDoctorBadge} pending)</span> : null}
            </h3>
            <input
              className="input"
              placeholder="Search name, email, license, hospital…"
              value={pendingQ}
              onChange={(e) => { setPendingQ(e.target.value); setPendingPage(1); }}
              style={{ maxWidth: 320 }}
            />
          </div>
          <div className="spacer-7" />
          {pending.loading && pending.items.length === 0 ? (
            <Skeleton height={120} />
          ) : pending.items.length === 0 ? (
            <div className="empty">{pendingQ ? "No applications match your search." : "No pending doctor applications."}</div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead><tr><th>Name</th><th>Specialty</th><th>License</th><th>Hospital</th><th>Proof</th><th></th></tr></thead>
                  <tbody>
                    {pending.items.map((d) => (
                      <tr key={d.id}>
                        <td><strong>{d.full_name}</strong><div className="muted small">@{d.username} · {d.email}</div></td>
                        <td>{d.specialty}<div className="muted small">{d.years_exp || 0}y</div></td>
                        <td>{d.license_number}</td>
                        <td>{d.hospital || "—"}</td>
                        <td className="muted small" style={{ maxWidth: 280 }}>{d.proof_text || "—"}</td>
                        <td>
                          <div className="row">
                            <button className="btn btn-primary btn-sm" onClick={() => openDoctorModal(d, "approve")}>Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={() => openDoctorModal(d, "reject")}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={pendingPage} totalPages={pending.totalPages} total={pending.total} onChange={setPendingPage} />
            </>
          )}
        </div>

        {/* Delete requests */}
        <div className="spacer-7" />
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <h3 style={{ margin: 0 }}>Delete requests</h3>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <select
                className="select"
                value={drStatus}
                onChange={(e) => { setDrStatus(e.target.value); setDrPage(1); }}
                style={{ width: 160 }}
              >
                <option value="pending">Pending only</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="edit_instead">Edited instead</option>
                <option value="all">All</option>
              </select>
              <input
                className="input"
                placeholder="Search case, requester, reason…"
                value={drQ}
                onChange={(e) => { setDrQ(e.target.value); setDrPage(1); }}
                style={{ maxWidth: 280 }}
              />
            </div>
          </div>
          <div className="spacer-7" />
          {drs.loading && drs.items.length === 0 ? (
            <Skeleton height={120} />
          ) : drs.items.length === 0 ? (
            <div className="empty">{drQ ? "No requests match your search." : `No ${drStatus === "all" ? "" : drStatus + " "}delete requests.`}</div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead><tr><th>Case</th><th>Specialty</th><th>Requester</th><th>Reason</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {drs.items.map((d) => (
                      <tr key={d.id}>
                        <td><Link href={`/case/${d.case_id}`}><strong>{d.case_title}</strong></Link></td>
                        <td>{d.specialty}</td>
                        <td><Link href={`/u/${d.requester_username}`}>@{d.requester_username}</Link></td>
                        <td className="muted small" style={{ maxWidth: 320 }}>{d.reason}</td>
                        <td><span className="muted small">{d.status}</span></td>
                        <td>
                          {d.status === "pending" ? (
                            <div className="row">
                              <button className="btn btn-danger btn-sm" onClick={() => deleteRequestApprove(d)}>Delete</button>
                              <button className="btn btn-secondary btn-sm" onClick={() => openEditInstead(d)}>Edit instead</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => deleteRequestReject(d)}>Reject</button>
                            </div>
                          ) : (
                            <span className="muted small">resolved</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={drPage} totalPages={drs.totalPages} total={drs.total} onChange={setDrPage} />
            </>
          )}
        </div>

        {/* Reports */}
        <div className="spacer-7" />
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <h3 style={{ margin: 0 }}>Reports</h3>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <select
                className="select"
                value={repStatus}
                onChange={(e) => { setRepStatus(e.target.value); setRepPage(1); }}
                style={{ width: 160 }}
              >
                <option value="open">Open only</option>
                <option value="actioned">Actioned</option>
                <option value="dismissed">Dismissed</option>
                <option value="all">All</option>
              </select>
              <input
                className="input"
                placeholder="Search case, reporter, reason…"
                value={repQ}
                onChange={(e) => { setRepQ(e.target.value); setRepPage(1); }}
                style={{ maxWidth: 280 }}
              />
            </div>
          </div>
          <div className="spacer-7" />
          {reports.loading && reports.items.length === 0 ? (
            <Skeleton height={120} />
          ) : reports.items.length === 0 ? (
            <div className="empty">{repQ ? "No reports match your search." : `No ${repStatus === "all" ? "" : repStatus + " "}reports.`}</div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead><tr><th>Case</th><th>By</th><th>Reason</th><th>Status</th><th>When</th><th></th></tr></thead>
                  <tbody>
                    {reports.items.map((r) => (
                      <tr key={r.id}>
                        <td><Link href={`/case/${r.case_id}`}><strong>{r.title}</strong></Link></td>
                        <td>@{r.username}</td>
                        <td className="muted small" style={{ maxWidth: 320 }}>{r.reason}</td>
                        <td><span className="muted small">{r.status || "open"}</span></td>
                        <td className="muted small">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td>
                          {(r.status || "open") === "open" ? (
                            <div className="row">
                              <button className="btn btn-primary btn-sm" onClick={() => openReportAction(r, "actioned")}>Mark actioned</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => openReportAction(r, "dismissed")}>Dismiss</button>
                            </div>
                          ) : (
                            <button className="btn btn-ghost btn-sm" onClick={() => openReportAction(r, "open")}>Re-open</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={repPage} totalPages={reports.totalPages} total={reports.total} onChange={setRepPage} />
            </>
          )}
        </div>

        {/* Practice activity — by case */}
        <div className="spacer-7" />
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <h3 style={{ margin: 0 }}>Practice activity — by case</h3>
              <p className="muted small" style={{ marginTop: 4 }}>How many times each case has been attempted, and by how many distinct learners.</p>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <button className={`btn btn-sm ${attemptsSort === "most" ? "btn-primary" : "btn-ghost"}`} onClick={() => setAttemptsSort("most")}>Most attempted</button>
              <button className={`btn btn-sm ${attemptsSort === "least" ? "btn-primary" : "btn-ghost"}`} onClick={() => setAttemptsSort("least")}>Least attempted</button>
            </div>
          </div>
          <div className="spacer-7" />
          {caseAttempts.length === 0 ? (
            <p className="muted small">No attempts yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table" style={{ width: "100%", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Case</th>
                    <th style={{ textAlign: "left" }}>Specialty</th>
                    <th style={{ textAlign: "center" }}>Lvl</th>
                    <th style={{ textAlign: "right" }}>Attempts</th>
                    <th style={{ textAlign: "right" }}>Unique learners</th>
                    <th style={{ textAlign: "left" }}>Last attempt</th>
                  </tr>
                </thead>
                <tbody>
                  {caseAttempts.slice(0, 50).map((c) => (
                    <tr key={c.id}>
                      <td><Link href={`/case/${c.id}`}>{c.title || `Case #${c.id}`}</Link></td>
                      <td>{c.specialty || "—"}</td>
                      <td style={{ textAlign: "center" }}>{c.level ?? "—"}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>{c.attempts}</td>
                      <td style={{ textAlign: "right" }}>{c.unique_students}</td>
                      <td style={{ color: "var(--muted, #888)" }}>{c.last_attempt ? new Date(c.last_attempt).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {caseAttempts.length > 50 && (
                <p className="muted small" style={{ marginTop: 8 }}>Showing top 50 of {caseAttempts.length}.</p>
              )}
            </div>
          )}
        </div>

        {/* Practice activity — by learner */}
        <div className="spacer-7" />
        <div className="card">
          <h3 style={{ margin: 0 }}>Practice activity — by learner</h3>
          <p className="muted small" style={{ marginTop: 4 }}>Who is practicing the most. Includes both students and doctors.</p>
          <div className="spacer-7" />
          {studentAttempts.length === 0 ? (
            <p className="muted small">No attempts yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table" style={{ width: "100%", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>User</th>
                    <th style={{ textAlign: "left" }}>Role</th>
                    <th style={{ textAlign: "right" }}>Total attempts</th>
                    <th style={{ textAlign: "right" }}>Unique cases</th>
                    <th style={{ textAlign: "left" }}>Last attempt</th>
                  </tr>
                </thead>
                <tbody>
                  {studentAttempts.slice(0, 50).map((u) => (
                    <tr key={u.id}>
                      <td><Link href={`/u/${u.username}`}>{u.full_name || u.username}</Link></td>
                      <td>{u.role}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>{u.attempts}</td>
                      <td style={{ textAlign: "right" }}>{u.unique_cases}</td>
                      <td style={{ color: "var(--muted, #888)" }}>{u.last_attempt ? new Date(u.last_attempt).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {studentAttempts.length > 50 && (
                <p className="muted small" style={{ marginTop: 8 }}>Showing top 50 of {studentAttempts.length}.</p>
              )}
            </div>
          )}
        </div>

        {/* AI generate (moved to bottom) */}
        <div className="spacer-7" />
        <div className="card">
          <h3>Generate cases with AI</h3>
          <p className="muted small" style={{ marginTop: 4 }}>
            Generates clinical cases with diagnoses and accepted-answer aliases. Cases are tagged as AI-generated. Review and verify before relying on them clinically.
          </p>
          <div className="spacer-7" />
          <div className="row" style={{ gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="field" style={{ minWidth: 140 }}>
              <label className="label">How many?</label>
              <select className="select" value={genCount} onChange={(e) => setGenCount(parseInt(e.target.value, 10))} disabled={genBusy}>
                <option value={1}>1 case</option>
                <option value={3}>3 cases</option>
                <option value={5}>5 cases</option>
                <option value={10}>10 cases</option>
              </select>
            </div>
            <div className="field" style={{ minWidth: 180 }}>
              <label className="label">Level (difficulty)</label>
              <select className="select" value={genLevel} onChange={(e) => setGenLevel(parseInt(e.target.value, 10))} disabled={genBusy}>
                <option value={1}>Level 1 — easiest (1st year)</option>
                <option value={2}>Level 2 — 2nd year</option>
                <option value={3}>Level 3 — 3rd year</option>
                <option value={4}>Level 4 — 4th year</option>
                <option value={5}>Level 5 — intern</option>
                <option value={6}>Level 6 — resident</option>
                <option value={7}>Level 7 — hardest (advanced resident)</option>
              </select>
            </div>
            <div className="field" style={{ minWidth: 220 }}>
              <label className="label">Specialty</label>
              <select className="select" value={genSpecialty} onChange={(e) => setGenSpecialty(e.target.value)} disabled={genBusy}>
                <option value="">Mixed (random per case)</option>
                {specialtyList.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={generateCases} disabled={genBusy} style={{ height: 40 }}>
              {genBusy ? <><span className="spinner" /> Generating… (may take 30–90s)</> : `Generate ${genCount} case${genCount === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      </div>

      {/* ----- Doctor approve / reject modal ----- */}
      <Modal
        open={!!doctorModal}
        onClose={() => setDoctorModal(null)}
        title={doctorModal?.action === "approve" ? "Approve doctor" : "Reject doctor"}
      >
        {doctorModal && (
          <div>
            <p className="muted small" style={{ marginTop: 0 }}>
              {doctorModal.action === "approve"
                ? `Approving ${doctorModal.doctor.full_name}. They will be able to log in and verify cases.`
                : `Rejecting ${doctorModal.doctor.full_name}. They will be notified with the reason below.`}
            </p>
            <label className="label">
              {doctorModal.action === "reject" ? "Reason (required)" : "Note to applicant (optional)"}
            </label>
            <textarea
              className="input"
              rows={4}
              value={doctorModal.note}
              onChange={(e) => setDoctorModal({ ...doctorModal, note: e.target.value })}
              placeholder={doctorModal.action === "reject"
                ? "Explain why this application is being rejected…"
                : "Optional welcome message or onboarding note…"}
              style={{ width: "100%", resize: "vertical" }}
              autoFocus
            />
            <div className="row" style={{ justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setDoctorModal(null)}>Cancel</button>
              <button
                className={doctorModal.action === "approve" ? "btn btn-primary" : "btn btn-danger"}
                onClick={submitDoctorDecision}
              >
                {doctorModal.action === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ----- Edit-instead modal ----- */}
      <Modal
        open={!!editInsteadModal}
        onClose={() => setEditInsteadModal(null)}
        title="Edit case instead of deleting"
        width={680}
      >
        {editInsteadModal && (
          <div>
            <p className="muted small" style={{ marginTop: 0 }}>
              Make the changes that resolve the concern raised in the delete request, then save.
              The requester will be notified that the case was edited.
            </p>

            <label className="label">Title</label>
            <input
              className="input"
              value={editInsteadModal.form.title}
              onChange={(e) => setEditInsteadModal({
                ...editInsteadModal,
                form: { ...editInsteadModal.form, title: e.target.value },
              })}
              style={{ width: "100%" }}
            />

            <div className="row" style={{ gap: 8, marginTop: 8 }}>
              <div style={{ flex: 1 }}>
                <label className="label">Specialty</label>
                <input
                  className="input"
                  value={editInsteadModal.form.specialty}
                  onChange={(e) => setEditInsteadModal({
                    ...editInsteadModal,
                    form: { ...editInsteadModal.form, specialty: e.target.value },
                  })}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ width: 120 }}>
                <label className="label">Level</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="7"
                  value={editInsteadModal.form.level}
                  onChange={(e) => setEditInsteadModal({
                    ...editInsteadModal,
                    form: { ...editInsteadModal.form, level: e.target.value },
                  })}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <label className="label" style={{ marginTop: 8 }}>Presentation</label>
            <textarea
              className="input"
              rows={6}
              value={editInsteadModal.form.body}
              onChange={(e) => setEditInsteadModal({
                ...editInsteadModal,
                form: { ...editInsteadModal.form, body: e.target.value },
              })}
              style={{ width: "100%", resize: "vertical" }}
            />

            <label className="label" style={{ marginTop: 8 }}>Diagnosis</label>
            <input
              className="input"
              value={editInsteadModal.form.diagnosis}
              onChange={(e) => setEditInsteadModal({
                ...editInsteadModal,
                form: { ...editInsteadModal.form, diagnosis: e.target.value },
              })}
              style={{ width: "100%" }}
            />

            <label className="label" style={{ marginTop: 8 }}>Diagnosis explanation</label>
            <textarea
              className="input"
              rows={4}
              value={editInsteadModal.form.diagnosis_explanation}
              onChange={(e) => setEditInsteadModal({
                ...editInsteadModal,
                form: { ...editInsteadModal.form, diagnosis_explanation: e.target.value },
              })}
              style={{ width: "100%", resize: "vertical" }}
            />

            <div className="row" style={{ justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setEditInsteadModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitEditInstead}>Save edits & resolve</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ----- Report action modal ----- */}
      <Modal
        open={!!reportNoteModal}
        onClose={() => setReportNoteModal(null)}
        title={
          reportNoteModal?.status === "actioned" ? "Mark report as actioned" :
          reportNoteModal?.status === "dismissed" ? "Dismiss report" :
          "Re-open report"
        }
      >
        {reportNoteModal && (
          <div>
            <p className="muted small" style={{ marginTop: 0 }}>
              <strong>Report:</strong> {reportNoteModal.report.title || "Untitled case"}
              <br />
              <em>{reportNoteModal.report.reason}</em>
            </p>
            <label className="label">Note (optional, for internal records)</label>
            <textarea
              className="input"
              rows={3}
              value={reportNoteModal.note}
              onChange={(e) => setReportNoteModal({ ...reportNoteModal, note: e.target.value })}
              placeholder="What did you do? e.g. 'Edited the case to remove the inaccurate dose.'"
              style={{ width: "100%", resize: "vertical" }}
              autoFocus
            />
            <div className="row" style={{ justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setReportNoteModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitReportAction}>Save</button>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
