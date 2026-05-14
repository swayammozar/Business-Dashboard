"use client";

import { Component, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Brain,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import type { BrainDump, Business, Task, TaskCategory, TaskPriority, TaskStatus } from "@/lib/app-types";
import {
  getStoredSession,
  hasSupabaseConfig,
  restDelete,
  restInsert,
  restSelect,
  restUpdate,
  signIn,
  signOut,
  signUp,
  storeSession,
  type SupabaseSession,
} from "@/lib/supabase-browser";
import {
  categoryLabels,
  categoryOptions,
  formatDate,
  isDueTodayOrOverdue,
  priorityLabels,
  priorityOptions,
  statusLabels,
  statusOptions,
  taskPriorityRank,
} from "@/lib/utils";

type View = "dashboard" | "today" | "all" | "brain" | "completed" | "settings";
type BootState = "checking" | "signed-out" | "signed-in";

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: "" };

  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : "The dashboard crashed while loading." };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center px-4 py-10">
          <Card className="w-full max-w-lg border-red-400/30">
            <CardHeader>
              <CardTitle>Dashboard could not load</CardTitle>
              <CardDescription>{this.state.error}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                type="button"
                onClick={() => {
                  window.localStorage.removeItem("business_cmd_supabase_session");
                  window.location.reload();
                }}
              >
                Reset login and reload
              </Button>
              <p className="text-sm text-slate-400">This keeps your Supabase data safe. It only clears the saved login in this browser.</p>
            </CardContent>
          </Card>
        </main>
      );
    }

    return this.props.children;
  }
}

const navItems: Array<{ view: View; label: string; icon: typeof LayoutDashboard }> = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { view: "today", label: "Today Mode", icon: Gauge },
  { view: "all", label: "All Tasks", icon: ClipboardList },
  { view: "brain", label: "Brain Dump", icon: Brain },
  { view: "completed", label: "Completed", icon: CheckCircle2 },
  { view: "settings", label: "Settings", icon: Settings },
];

const defaultBusinesses = [
  { name: "Mozar Jewellery", description: "GST, catalog, marketplace, reels, and jewellery growth moves.", color: "#a855f7" },
  { name: "FitnessLive", description: "Relaunch planning, offers, pricing, and client follow-up.", color: "#22c55e" },
  { name: "AI Influencer", description: "Character, niche, reel systems, and viral format research.", color: "#38bdf8" },
  { name: "FL Enterprise", description: "Operations, admin, partnerships, and business systems.", color: "#f97316" },
  { name: "Random Ideas", description: "A parking zone for thoughts that might become real later.", color: "#eab308" },
];

const defaultTasks: Record<string, Array<[string, string, TaskPriority, TaskCategory]>> = {
  "Mozar Jewellery": [
    ["Register GST", "Complete GST registration paperwork and submit documents.", "HIGH", "LEGAL_GST"],
    ["Add 20 products to website", "Upload product photos, prices, descriptions, and inventory.", "HIGH", "WEBSITE"],
    ["Make 3 reels for imitation jewellery", "Shoot or generate three short reels for Instagram.", "MEDIUM", "CONTENT_REELS"],
    ["Call Flipkart/Amazon/Etsy account handler", "Ask about category approval, onboarding, and ad setup.", "HIGH", "CALLS"],
    ["Start Flipkart ads", "Launch the first low-budget campaign after listings are ready.", "MEDIUM", "ADS"],
  ],
  FitnessLive: [
    ["Plan relaunch offer", "Create a simple offer for returning and new clients.", "HIGH", "IDEAS"],
    ["Create Instagram content ideas", "Draft hooks and formats for the first two weeks.", "MEDIUM", "SOCIAL_MEDIA"],
    ["Decide pricing", "Finalize monthly and transformation package pricing.", "HIGH", "OTHER"],
    ["Make client follow-up list", "Prepare a list of old leads and existing clients to call.", "MEDIUM", "CALLS"],
  ],
  "AI Influencer": [
    ["Create Instagram account", "Reserve the handle and set profile basics.", "HIGH", "SOCIAL_MEDIA"],
    ["Decide influencer niche", "Pick a niche with repeatable content formats.", "HIGH", "IDEAS"],
    ["Generate first AI character", "Create the first consistent face and visual style.", "MEDIUM", "CONTENT_REELS"],
    ["Make 3 reels", "Publish three test reels with different hooks.", "MEDIUM", "CONTENT_REELS"],
    ["Research viral reel formats", "Collect patterns from top accounts in the niche.", "MEDIUM", "IDEAS"],
  ],
};

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function dueFromInput(value: string) {
  return value ? new Date(`${value}T12:00:00`).toISOString() : null;
}

function AuthScreen({ onSession }: { onSession: (session: SupabaseSession) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    try {
      const session = mode === "login" ? await signIn(email, password) : await signUp(email, password);
      if (!session.access_token) {
        setError("Check your email confirmation setting in Supabase, then log in.");
        return;
      }
      storeSession(session);
      onSession(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-300">Business CMD Dashboard</p>
          <CardTitle className="text-3xl">{mode === "login" ? "Welcome back" : "Create your account"}</CardTitle>
          <CardDescription>GitHub hosts the app. Supabase handles your login and data.</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasSupabaseConfig() ? (
            <div className="mb-4 rounded-md border border-orange-400/30 bg-orange-500/10 px-3 py-2 text-sm text-orange-100">
              Add Supabase URL and anon key in `.env`, then restart the app.
            </div>
          ) : null}
          {error ? <div className="mb-4 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div> : null}
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input name="password" type="password" minLength={6} required placeholder="6+ characters" />
            </div>
            <Button type="submit" disabled={busy || !hasSupabaseConfig()} className="w-full">
              {busy ? "Working..." : mode === "login" ? "Log in" : "Sign up"}
            </Button>
          </form>
          <button className="mt-5 w-full text-center text-sm font-semibold text-sky-300" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
          </button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function Home() {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [bootState, setBootState] = useState<BootState>("checking");
  const [view, setView] = useState<View>("dashboard");
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [brainDumps, setBrainDumps] = useState<BrainDump[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const storedSession = getStoredSession();
      setSession(storedSession);
      setBootState(storedSession ? "signed-in" : "signed-out");
    } catch {
      setSession(null);
      setBootState("signed-out");
    }
  }, []);

  async function loadData(currentSession = session) {
    if (!currentSession) return;
    const [businessRows, taskRows, brainRows] = await Promise.all([
      restSelect<Business[]>(currentSession, "businesses?select=*&order=created_at.asc"),
      restSelect<Task[]>(currentSession, "tasks?select=*&order=created_at.desc"),
      restSelect<BrainDump[]>(currentSession, "brain_dumps?select=*&archived=eq.false&order=created_at.desc"),
    ]);
    setBusinesses(businessRows);
    setTasks(taskRows);
    setBrainDumps(brainRows);
  }

  useEffect(() => {
    if (session) {
      loadData(session).catch((err) => {
        storeSession(null);
        setSession(null);
        setBootState("signed-out");
        setMessage(err instanceof Error ? err.message : "Please log in again.");
      });
    }
  }, [session]);

  async function seedDefaults() {
    if (!session) return;
    const created = await restInsert<Business[]>(session, "businesses", defaultBusinesses.map((business) => ({ ...business, user_id: session.user.id })));
    const seedTasks = created.flatMap((business) =>
      (defaultTasks[business.name] || []).map(([title, description, priority, category]) => ({
        user_id: session.user.id,
        business_id: business.id,
        title,
        description,
        priority,
        category,
        status: title === "Create Instagram account" ? "DOING" : "TODO",
        due_date: priority === "HIGH" ? new Date().toISOString() : null,
        is_today: priority === "HIGH",
      })),
    );
    if (seedTasks.length) await restInsert<Task[]>(session, "tasks", seedTasks);
    await restInsert<BrainDump[]>(session, "brain_dumps", [
      { user_id: session.user.id, text: "Try a behind-the-scenes jewellery packaging reel." },
      { user_id: session.user.id, text: "Bundle FitnessLive relaunch with a 7-day accountability challenge." },
    ]);
    await loadData();
  }

  async function createBusiness(form: FormData) {
    if (!session) return;
    await restInsert<Business[]>(session, "businesses", {
      user_id: session.user.id,
      name: String(form.get("name") || "").trim(),
      description: String(form.get("description") || "").trim(),
      color: String(form.get("color") || "#38bdf8"),
    });
    await loadData();
  }

  async function deleteBusiness(id: string) {
    if (!session) return;
    await restDelete(session, `businesses?id=eq.${id}`);
    setActiveBusinessId(null);
    await loadData();
  }

  async function createTask(form: FormData, businessId: string) {
    if (!session) return;
    await restInsert<Task[]>(session, "tasks", {
      user_id: session.user.id,
      business_id: businessId,
      title: String(form.get("title") || "").trim(),
      description: String(form.get("description") || "").trim(),
      status: form.get("status") as TaskStatus,
      priority: form.get("priority") as TaskPriority,
      category: form.get("category") as TaskCategory,
      due_date: dueFromInput(String(form.get("due_date") || "")),
      is_today: form.get("is_today") === "on",
    });
    await loadData();
  }

  async function updateTask(id: string, data: Partial<Task>) {
    if (!session) return;
    await restUpdate<Task[]>(session, `tasks?id=eq.${id}`, data);
    await loadData();
  }

  async function deleteTask(id: string) {
    if (!session) return;
    await restDelete(session, `tasks?id=eq.${id}`);
    await loadData();
  }

  async function createBrainDump(form: FormData) {
    if (!session) return;
    await restInsert<BrainDump[]>(session, "brain_dumps", {
      user_id: session.user.id,
      text: String(form.get("text") || "").trim(),
      business_id: String(form.get("business_id") || "") || null,
    });
    await loadData();
  }

  const activeBusiness = businesses.find((business) => business.id === activeBusinessId) || null;
  const openTasks = tasks.filter((task) => task.status !== "DONE");
  const doneTasks = tasks.filter((task) => task.status === "DONE");
  const todayTasks = [...openTasks]
    .filter((task) => !task.skipped_today)
    .sort((a, b) => {
      const aDue = isDueTodayOrOverdue(a.due_date ? new Date(a.due_date) : null) || a.is_today ? 0 : 1;
      const bDue = isDueTodayOrOverdue(b.due_date ? new Date(b.due_date) : null) || b.is_today ? 0 : 1;
      return aDue - bDue || taskPriorityRank(a.priority) - taskPriorityRank(b.priority);
    })
    .slice(0, 5);

  const filteredTasks = useMemo(() => {
    const term = query.toLowerCase();
    return tasks.filter((task) => {
      const business = businesses.find((item) => item.id === task.business_id);
      return `${task.title} ${task.description} ${business?.name || ""}`.toLowerCase().includes(term);
    });
  }, [businesses, query, tasks]);

  if (bootState === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading Business CMD</CardTitle>
            <CardDescription>Checking your saved login.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!session) {
    return (
      <AppErrorBoundary>
        <AuthScreen
          onSession={(nextSession) => {
            setSession(nextSession);
            setBootState("signed-in");
          }}
        />
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary>
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/10 bg-slate-950/90 p-5 lg:block">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-sky-400 text-slate-950"><Sparkles size={22} /></span>
          <div>
            <p className="text-lg font-black text-white">Business CMD</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">GitHub + Supabase</p>
          </div>
        </div>
        <nav className="mt-10 space-y-2">
          {navItems.map((item) => (
            <button key={item.view} onClick={() => { setView(item.view); setActiveBusinessId(null); }} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <form className="absolute bottom-5 left-5 right-5" action={async () => { await signOut(session); setSession(null); }}>
          <Button type="submit" variant="ghost" className="w-full justify-start"><LogOut size={16} /> Log out</Button>
        </form>
      </aside>

      <main className="px-4 py-6 lg:ml-72 lg:px-8 lg:py-8">
        <header className="mb-6 flex flex-col justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-300">Business Command Center</p>
            <h1 className="mt-2 text-3xl font-black text-white">{activeBusiness ? activeBusiness.name : view === "today" ? "Today's Battle Plan" : view === "brain" ? "Brain Dump" : "Business CMD Dashboard"}</h1>
          </div>
          <div className="flex flex-wrap gap-2 lg:hidden">
            {navItems.map((item) => (
              <Button
                key={item.view}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setView(item.view);
                  setActiveBusinessId(null);
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </header>

        {message ? <div className="mb-4 rounded-md border border-orange-400/30 bg-orange-500/10 p-3 text-sm text-orange-100">{message}</div> : null}

        {businesses.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Set up your dashboard</CardTitle>
              <CardDescription>Add starter businesses and tasks for Mozar Jewellery, FitnessLive, AI Influencer, FL Enterprise, and Random Ideas.</CardDescription>
            </CardHeader>
            <CardContent><Button onClick={seedDefaults}>Create starter workspace</Button></CardContent>
          </Card>
        ) : null}

        {view === "dashboard" && !activeBusiness ? (
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <section className="grid gap-4 md:grid-cols-2">
              {businesses.map((business) => {
                const businessTasks = tasks.filter((task) => task.business_id === business.id);
                const pending = businessTasks.filter((task) => task.status !== "DONE");
                const progress = businessTasks.length ? Math.round(((businessTasks.length - pending.length) / businessTasks.length) * 100) : 0;
                const priority = pending.find((task) => task.is_today) || pending.find((task) => task.priority === "HIGH") || pending[0];
                return (
                  <Card key={business.id} className="overflow-hidden">
                    <div className="h-1.5" style={{ backgroundColor: business.color }} />
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Building2 size={18} style={{ color: business.color }} /> {business.name}</CardTitle>
                      <CardDescription>{business.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Progress value={progress} />
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <Badge>{pending.length} pending</Badge>
                        <Badge variant="done">{businessTasks.length - pending.length} done</Badge>
                        <Badge>{progress}%</Badge>
                      </div>
                      <div className="rounded-md bg-white/[0.04] p-3 text-sm text-slate-300">Priority: {priority?.title || "Clear"}</div>
                      <div className="flex gap-2">
                        <Button type="button" variant="secondary" onClick={() => setActiveBusinessId(business.id)}>Open</Button>
                        <Button type="button" variant="danger" onClick={() => deleteBusiness(business.id)}><Trash2 size={16} /></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </section>
            <Card className="h-fit">
              <CardHeader><CardTitle><Plus size={18} /> Add Business</CardTitle></CardHeader>
              <CardContent>
                <form action={createBusiness} className="space-y-3">
                  <Input name="name" placeholder="Business name" required />
                  <Textarea name="description" placeholder="Description" />
                  <Input name="color" type="color" defaultValue="#38bdf8" className="h-11 p-1" />
                  <Button type="submit" className="w-full">Add</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {activeBusiness ? (
          <BusinessPanel
            business={activeBusiness}
            tasks={tasks.filter((task) => task.business_id === activeBusiness.id)}
            onBack={() => {
              setActiveBusinessId(null);
              setView("dashboard");
            }}
            onCreateTask={createTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        ) : null}

        {view === "today" && !activeBusiness ? (
          <TaskList businesses={businesses} tasks={todayTasks} compact onUpdateTask={updateTask} onDeleteTask={deleteTask} />
        ) : null}

        {view === "all" && !activeBusiness ? (
          <div className="space-y-4">
            <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-500" size={16} /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search all tasks" className="pl-9" /></div>
            <TaskList businesses={businesses} tasks={filteredTasks} onUpdateTask={updateTask} onDeleteTask={deleteTask} />
          </div>
        ) : null}

        {view === "brain" && !activeBusiness ? (
          <BrainDumpPanel businesses={businesses} items={brainDumps} onCreate={createBrainDump} onArchive={async (id) => updateBrainDump(session, id, { archived: true }, loadData)} onConvert={async (item, businessId) => {
            await createTask(new FormData(Object.assign(document.createElement("form"), { innerHTML: `<input name="title" value="${item.text.replace(/"/g, "&quot;")}"><input name="description" value="${item.text.replace(/"/g, "&quot;")}"><input name="status" value="TODO"><input name="priority" value="MEDIUM"><input name="category" value="IDEAS">` })), businessId);
            await updateBrainDump(session, item.id, { archived: true, business_id: businessId }, loadData);
          }} />
        ) : null}

        {view === "completed" && !activeBusiness ? <TaskList businesses={businesses} tasks={doneTasks} onUpdateTask={updateTask} onDeleteTask={deleteTask} /> : null}

        {view === "settings" && !activeBusiness ? (
          <Card>
            <CardHeader><CardTitle>Settings</CardTitle><CardDescription>{session.user.email}</CardDescription></CardHeader>
            <CardContent><Button variant="danger" onClick={async () => { await signOut(session); setSession(null); }}>Log out</Button></CardContent>
          </Card>
        ) : null}
      </main>
    </div>
    </AppErrorBoundary>
  );
}

function BusinessPanel({ business, tasks, onBack, onCreateTask, onUpdateTask, onDeleteTask }: { business: Business; tasks: Task[]; onBack: () => void; onCreateTask: (form: FormData, businessId: string) => Promise<void>; onUpdateTask: (id: string, data: Partial<Task>) => Promise<void>; onDeleteTask: (id: string) => Promise<void> }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="space-y-4">
        <Button variant="secondary" onClick={onBack}>Back to Dashboard</Button>
        <TaskList businesses={[business]} tasks={tasks} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} />
      </section>
      <Card className="h-fit">
        <CardHeader><CardTitle>Add Task</CardTitle></CardHeader>
        <CardContent>
          <form action={(form) => onCreateTask(form, business.id)} className="space-y-3">
            <Input name="title" placeholder="Task title" required />
            <Textarea name="description" placeholder="Notes" />
            <Select name="status" defaultValue="TODO">{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
            <Select name="priority" defaultValue="MEDIUM">{priorityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
            <Select name="category" defaultValue="OTHER">{categoryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
            <Input name="due_date" type="date" defaultValue={todayInput()} />
            <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="is_today" className="accent-sky-400" /> Today Mode</label>
            <Button className="w-full">Add task</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function TaskList({ businesses, tasks, compact, onUpdateTask, onDeleteTask }: { businesses: Business[]; tasks: Task[]; compact?: boolean; onUpdateTask: (id: string, data: Partial<Task>) => Promise<void>; onDeleteTask: (id: string) => Promise<void> }) {
  if (!tasks.length) return <Card><CardHeader><CardTitle>No tasks here</CardTitle><CardDescription>Clear and focused.</CardDescription></CardHeader></Card>;
  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const business = businesses.find((item) => item.id === task.business_id);
        return (
          <Card key={task.id}>
            <CardContent className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  {business ? <Badge>{business.name}</Badge> : null}
                  <Badge variant={task.status === "DONE" ? "done" : task.status === "BLOCKED" ? "blocked" : "default"}>{statusLabels[task.status]}</Badge>
                  <Badge variant={task.priority === "HIGH" ? "high" : task.priority === "MEDIUM" ? "medium" : "low"}>{priorityLabels[task.priority]}</Badge>
                  <Badge>{categoryLabels[task.category]}</Badge>
                  <Badge><CalendarDays size={13} /> {formatDate(task.due_date)}</Badge>
                </div>
                <h2 className="mt-3 text-lg font-black text-white">{task.title}</h2>
                {!compact ? <p className="mt-1 text-sm text-slate-400">{task.description || "No notes."}</p> : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button variant="success" onClick={() => onUpdateTask(task.id, { status: "DONE", completed_at: new Date().toISOString(), is_today: false })}><CheckCircle2 size={16} /> Done</Button>
                <Button variant="secondary" onClick={() => onUpdateTask(task.id, { status: task.status === "DOING" ? "TODO" : "DOING", is_today: true, skipped_today: false })}>Focus</Button>
                <Button variant="ghost" onClick={() => onUpdateTask(task.id, { skipped_today: true, is_today: false })}>Skip</Button>
                <Button variant="danger" size="icon" onClick={() => onDeleteTask(task.id)}><Trash2 size={16} /></Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

async function updateBrainDump(session: SupabaseSession, id: string, data: Partial<BrainDump>, reload: () => Promise<void>) {
  await restUpdate<BrainDump[]>(session, `brain_dumps?id=eq.${id}`, data);
  await reload();
}

function BrainDumpPanel({ businesses, items, onCreate, onArchive, onConvert }: { businesses: Business[]; items: BrainDump[]; onCreate: (form: FormData) => Promise<void>; onArchive: (id: string) => Promise<void>; onConvert: (item: BrainDump, businessId: string) => Promise<void> }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="h-fit">
        <CardHeader><CardTitle><Brain size={18} /> Quick Capture</CardTitle></CardHeader>
        <CardContent>
          <form action={onCreate} className="space-y-3">
            <Textarea name="text" placeholder="Random thought..." required />
            <Select name="business_id"><option value="">Unassigned</option>{businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}</Select>
            <Button className="w-full">Capture</Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
              <p className="font-semibold text-white">{item.text}</p>
              <div className="flex gap-2">
                <Select defaultValue={item.business_id || businesses[0]?.id} onChange={(event) => onConvert(item, event.target.value)}>
                  {businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}
                </Select>
                <Button variant="secondary" onClick={() => item.business_id && onConvert(item, item.business_id)}><Wand2 size={16} /></Button>
                <Button variant="ghost" onClick={() => onArchive(item.id)}><Archive size={16} /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
