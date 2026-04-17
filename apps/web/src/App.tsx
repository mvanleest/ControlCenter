import { useEffect, useMemo, useState } from "react";
import type {
  Agent,
  Approval,
  DashboardMetrics,
  DashboardSummary,
  KnowledgeDocument,
  Locale,
  Run,
} from "@control-center/domain";

type TranslationKey =
  | "appTitle"
  | "subtitle"
  | "locale"
  | "username"
  | "password"
  | "login"
  | "logout"
  | "dashboard"
  | "agents"
  | "runs"
  | "approvals"
  | "knowledge"
  | "metrics"
  | "status"
  | "pendingApprovals"
  | "openTasks"
  | "activeRuns"
  | "activeAgents"
  | "tokenUsage"
  | "cost"
  | "approvalWait"
  | "latency"
  | "loginError";

const copy: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    appTitle: "Control Center",
    subtitle: "Operate and intervene in AI-only company workflows.",
    locale: "Language",
    username: "Username",
    password: "Password",
    login: "Log in",
    logout: "Log out",
    dashboard: "Dashboard",
    agents: "Agents",
    runs: "Runs",
    approvals: "Approvals",
    knowledge: "Knowledge",
    metrics: "Metrics",
    status: "Status",
    pendingApprovals: "Pending approvals",
    openTasks: "Open tasks",
    activeRuns: "Active runs",
    activeAgents: "Active agents",
    tokenUsage: "Token usage",
    cost: "Provider cost",
    approvalWait: "Approval wait",
    latency: "Average latency",
    loginError: "Login failed. Check credentials.",
  },
  nl: {
    appTitle: "Control Center",
    subtitle: "Beheer en grijp in op AI-bedrijfsworkflows.",
    locale: "Taal",
    username: "Gebruikersnaam",
    password: "Wachtwoord",
    login: "Inloggen",
    logout: "Uitloggen",
    dashboard: "Dashboard",
    agents: "Agents",
    runs: "Runs",
    approvals: "Goedkeuringen",
    knowledge: "Kennis",
    metrics: "Metingen",
    status: "Status",
    pendingApprovals: "Open goedkeuringen",
    openTasks: "Open taken",
    activeRuns: "Actieve runs",
    activeAgents: "Actieve agents",
    tokenUsage: "Tokenverbruik",
    cost: "Providerkosten",
    approvalWait: "Wachttijd goedkeuring",
    latency: "Gemiddelde latency",
    loginError: "Inloggen mislukt. Controleer gegevens.",
  },
};

function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return `${base}${path}`;
}

async function fetchJson<T>(path: string, token?: string): Promise<T> {
  const response = await fetch(
    apiUrl(path),
    token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
  );

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function App() {
  const [locale, setLocale] = useState<Locale>("en");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("changeme");
  const [token, setToken] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);

  const t = useMemo(() => copy[locale], [locale]);

  useEffect(() => {
    if (!token) {
      return;
    }

    void Promise.all([
      fetchJson<DashboardSummary>("/dashboard/summary", token),
      fetchJson<DashboardMetrics>("/dashboard/metrics", token),
      fetchJson<Agent[]>("/agents", token),
      fetchJson<Run[]>("/runs", token),
      fetchJson<Approval[]>("/approvals", token),
      fetchJson<KnowledgeDocument[]>("/knowledge-documents", token),
    ]).then(([summaryData, metricsData, agentData, runData, approvalData, documentData]) => {
      setSummary(summaryData);
      setMetrics(metricsData);
      setAgents(agentData);
      setRuns(runData);
      setApprovals(approvalData);
      setDocuments(documentData);
    });
  }, [token]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);

    try {
      const response = await fetch(apiUrl("/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("login_failed");
      }

      const body = (await response.json()) as { token: string };
      setToken(body.token);
    } catch {
      setLoginError(t.loginError);
    }
  }

  if (!token) {
    return (
      <main className="shell login-shell">
        <section className="hero">
          <div>
            <p className="eyebrow">AI-only company operations</p>
            <h1>{t.appTitle}</h1>
            <p className="muted">{t.subtitle}</p>
          </div>
          <label className="locale-picker">
            <span>{t.locale}</span>
            <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
              <option value="en">English</option>
              <option value="nl">Nederlands</option>
            </select>
          </label>
        </section>

        <form className="panel login-panel" onSubmit={handleLogin}>
          <label>
            <span>{t.username}</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label>
            <span>{t.password}</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {loginError ? <p className="error">{loginError}</p> : null}
          <button type="submit">{t.login}</button>
        </form>
      </main>
    );
  }

  return (
    <main className="shell app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Digital Galore B.V.</p>
          <h1>{t.appTitle}</h1>
        </div>
        <div className="topbar-actions">
          <label className="locale-picker compact">
            <span>{t.locale}</span>
            <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
              <option value="en">English</option>
              <option value="nl">Nederlands</option>
            </select>
          </label>
          <button className="secondary" onClick={() => setToken(null)}>
            {t.logout}
          </button>
        </div>
      </header>

      <section className="card-grid">
        <StatCard label={t.activeAgents} value={summary?.activeAgents ?? 0} />
        <StatCard label={t.openTasks} value={summary?.openTasks ?? 0} />
        <StatCard label={t.activeRuns} value={summary?.activeRuns ?? 0} />
        <StatCard label={t.pendingApprovals} value={summary?.pendingApprovals ?? 0} />
      </section>

      <section className="content-grid">
        <Panel title={t.agents}>
          {agents.map((agent) => (
            <ListRow key={agent.id} title={agent.displayName} subtitle={`${agent.roleKey} • ${agent.provider}/${agent.model}`} status={agent.status} />
          ))}
        </Panel>

        <Panel title={t.runs}>
          {runs.map((run) => (
            <ListRow key={run.id} title={run.id} subtitle={`${run.currentStage} • $${run.cost.toFixed(2)}`} status={run.status} />
          ))}
        </Panel>

        <Panel title={t.approvals}>
          {approvals.map((approval) => (
            <ListRow key={approval.id} title={approval.stageKey} subtitle={approval.runId} status={approval.status} />
          ))}
        </Panel>

        <Panel title={t.knowledge}>
          {documents.map((document) => (
            <ListRow key={document.id} title={document.title} subtitle={`${document.language} • ${document.sourceType}`} status={document.status} />
          ))}
        </Panel>

        <Panel title={t.metrics}>
          <MetricRow label={t.tokenUsage} value={String(metrics?.totalTokens ?? 0)} />
          <MetricRow label={t.cost} value={`$${(metrics?.providerModelCost ?? 0).toFixed(2)}`} />
          <MetricRow label={t.approvalWait} value={`${Math.round((metrics?.averageApprovalWaitMs ?? 0) / 1000)}s`} />
          <MetricRow label={t.latency} value={`${Math.round((metrics?.averageLatencyMs ?? 0) / 1000)}s`} />
        </Panel>
      </section>
    </main>
  );
}

function Panel(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{props.title}</h2>
      </div>
      <div className="panel-body">{props.children}</div>
    </section>
  );
}

function StatCard(props: { label: string; value: number }) {
  return (
    <article className="stat-card">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </article>
  );
}

function ListRow(props: { title: string; subtitle: string; status: string }) {
  return (
    <article className="list-row">
      <div>
        <h3>{props.title}</h3>
        <p>{props.subtitle}</p>
      </div>
      <span className="status-pill">{props.status}</span>
    </article>
  );
}

function MetricRow(props: { label: string; value: string }) {
  return (
    <div className="metric-row">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}
