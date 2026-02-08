"use client";

import { useMemo } from "react";
import { useDashboard } from "@/context/store-context";
import { useUserSettings } from "@/context/settings-context";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  DollarSign,
  ClipboardCheck,
  Users,
  Plane,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { format, isPast, isValid, parseISO } from "date-fns";
import type { Paper, PaperStage } from "@/lib/types";

// ============================================
// Helpers
// ============================================

const STAGE_LABELS: Record<PaperStage, string> = {
  idea: "Idea",
  drafting: "Drafting",
  "internal-review": "Internal Review",
  submitted: "Submitted",
  "under-review": "Under Review",
  "revise-resubmit": "Revise & Resubmit",
  accepted: "Accepted",
  published: "Published",
};

const STAGE_BADGE_VARIANT: Record<PaperStage, "default" | "success" | "warning" | "danger" | "info" | "outline"> = {
  idea: "outline",
  drafting: "default",
  "internal-review": "info",
  submitted: "warning",
  "under-review": "warning",
  "revise-resubmit": "danger",
  accepted: "success",
  published: "success",
};

/** Pipeline stages in display order (excludes "published") */
const PIPELINE_STAGES: PaperStage[] = [
  "idea",
  "drafting",
  "internal-review",
  "submitted",
  "under-review",
  "revise-resubmit",
  "accepted",
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function safeDateFormat(dateStr: string, fmt: string): string {
  if (!dateStr) return "";
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? format(d, fmt) : "";
  } catch {
    return "";
  }
}

// ============================================
// Loading Skeleton
// ============================================

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8 p-8">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-56 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-7 w-10 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-2.5 w-28 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="h-12 w-12 rounded-lg bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700">
              <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="space-y-4 px-6 py-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-4 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="h-4 flex-1 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Dashboard Page
// ============================================

export default function DashboardPage() {
  const {
    isHydrated,
    papers,
    courses,
    grants,
    peerReviews,
    students,
    conferences,
  } = useDashboard();

  const { isPaneVisible } = useUserSettings();

  // --- Derived data ---

  const pipelinePapers = useMemo(
    () => papers.list.filter((p) => p.stage !== "published"),
    [papers.list]
  );

  const pipelineStageSummary = useMemo(() => {
    const counts: Partial<Record<PaperStage, number>> = {};
    for (const p of pipelinePapers) {
      counts[p.stage] = (counts[p.stage] || 0) + 1;
    }
    return PIPELINE_STAGES.filter((s) => counts[s])
      .map((s) => `${counts[s]} ${STAGE_LABELS[s].toLowerCase()}`)
      .join(", ");
  }, [pipelinePapers]);

  const activeCourses = useMemo(
    () => courses.list.filter((c) => c.isActive),
    [courses.list]
  );

  const fundedGrants = useMemo(
    () => grants.list.filter((g) => g.status === "funded"),
    [grants.list]
  );

  const totalFundedAmount = useMemo(
    () => fundedGrants.reduce((sum, g) => sum + g.amount, 0),
    [fundedGrants]
  );

  const pendingReviews = useMemo(
    () =>
      peerReviews.list.filter(
        (r) => r.status === "in-progress" || r.status === "accepted"
      ),
    [peerReviews.list]
  );

  const activeStudents = useMemo(
    () => students.list.filter((s) => s.status === "active"),
    [students.list]
  );

  const upcomingConferences = useMemo(
    () => conferences.list.filter((c) => c.status !== "attended"),
    [conferences.list]
  );

  // --- Papers grouped by pipeline stage ---

  const papersByStage = useMemo(() => {
    const grouped: Partial<Record<PaperStage, Paper[]>> = {};
    for (const stage of PIPELINE_STAGES) {
      const papersInStage = pipelinePapers.filter((p) => p.stage === stage);
      if (papersInStage.length > 0) {
        grouped[stage] = papersInStage;
      }
    }
    return grouped;
  }, [pipelinePapers]);

  // --- Upcoming deadlines aggregation ---

  interface DeadlineItem {
    id: string;
    date: Date;
    dateStr: string;
    label: string;
    detail: string;
    module: "review" | "conference" | "grant";
    moduleLabel: string;
    isOverdue: boolean;
  }

  const upcomingDeadlines = useMemo<DeadlineItem[]>(() => {
    const items: DeadlineItem[] = [];

    for (const review of pendingReviews) {
      if (review.dueDate) {
        const d = parseISO(review.dueDate);
        if (isValid(d)) {
          items.push({
            id: `review-${review.id}`,
            date: d,
            dateStr: review.dueDate,
            label: review.manuscriptTitle || "Untitled manuscript",
            detail: review.journal,
            module: "review",
            moduleLabel: "Peer Review",
            isOverdue: isPast(d),
          });
        }
      }
    }

    for (const conf of upcomingConferences) {
      if (conf.submissionDeadline) {
        const d = parseISO(conf.submissionDeadline);
        if (isValid(d)) {
          items.push({
            id: `conf-sub-${conf.id}`,
            date: d,
            dateStr: conf.submissionDeadline,
            label: `${conf.name} - Submission`,
            detail: conf.presentationTitle || "",
            module: "conference",
            moduleLabel: "Conference",
            isOverdue: isPast(d),
          });
        }
      }
      if (conf.registrationDeadline) {
        const d = parseISO(conf.registrationDeadline);
        if (isValid(d)) {
          items.push({
            id: `conf-reg-${conf.id}`,
            date: d,
            dateStr: conf.registrationDeadline,
            label: `${conf.name} - Registration`,
            detail: "",
            module: "conference",
            moduleLabel: "Conference",
            isOverdue: isPast(d),
          });
        }
      }
    }

    const activeGrantStatuses = new Set(["planning", "drafting", "submitted", "under-review"]);
    for (const grant of grants.list) {
      if (activeGrantStatuses.has(grant.status) && grant.submissionDeadline) {
        const d = parseISO(grant.submissionDeadline);
        if (isValid(d)) {
          items.push({
            id: `grant-${grant.id}`,
            date: d,
            dateStr: grant.submissionDeadline,
            label: grant.title,
            detail: grant.agency,
            module: "grant",
            moduleLabel: "Grant",
            isOverdue: isPast(d),
          });
        }
      }
    }

    items.sort((a, b) => a.date.getTime() - b.date.getTime());
    return items;
  }, [pendingReviews, upcomingConferences, grants.list]);

  const moduleBadgeVariant: Record<string, "default" | "success" | "warning" | "danger" | "info" | "outline"> = {
    review: "danger",
    conference: "info",
    grant: "warning",
  };

  // --- Render ---

  if (!isHydrated) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Your academic life at a glance"
      />

      <div className="space-y-8 p-8">
        {/* Stat Cards Row */}
        {isPaneVisible("stats") && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Papers in Pipeline"
              value={pipelinePapers.length}
              icon={FileText}
              color="indigo"
              trend={pipelineStageSummary || "No active papers"}
            />
            <StatCard
              label="Active Courses"
              value={activeCourses.length}
              icon={GraduationCap}
              color="emerald"
            />
            <StatCard
              label="Active Grants"
              value={fundedGrants.length}
              icon={DollarSign}
              color="amber"
              trend={
                totalFundedAmount > 0
                  ? `${formatCurrency(totalFundedAmount)} total funded`
                  : "No funded grants"
              }
            />
            <StatCard
              label="Pending Reviews"
              value={pendingReviews.length}
              icon={ClipboardCheck}
              color="rose"
            />
            <StatCard
              label="Active Students"
              value={activeStudents.length}
              icon={Users}
              color="blue"
            />
            <StatCard
              label="Upcoming Conferences"
              value={upcomingConferences.length}
              icon={Plane}
              color="purple"
            />
          </div>
        )}

        {/* Content Cards Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Papers Pipeline Card */}
          {isPaneVisible("papers-pipeline") && (
            <Card>
              <CardHeader>
                <CardTitle>Papers Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                {pipelinePapers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No papers in the pipeline yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {PIPELINE_STAGES.map((stage) => {
                      const stagePapers = papersByStage[stage];
                      if (!stagePapers || stagePapers.length === 0) return null;

                      return (
                        <div key={stage}>
                          <div className="mb-2 flex items-center gap-2">
                            <Badge variant={STAGE_BADGE_VARIANT[stage]}>
                              {STAGE_LABELS[stage]}
                            </Badge>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              ({stagePapers.length})
                            </span>
                          </div>
                          <ul className="space-y-2">
                            {stagePapers.map((paper) => (
                              <li
                                key={paper.id}
                                className="flex items-start justify-between rounded-md border border-slate-100 px-3 py-2 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                                    {paper.title}
                                  </p>
                                  {paper.targetJournal && (
                                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                      {paper.targetJournal}
                                    </p>
                                  )}
                                </div>
                                {paper.coAuthors.length > 0 && (
                                  <span className="ml-2 shrink-0 text-xs text-slate-400 dark:text-slate-500">
                                    +{paper.coAuthors.length} co-author
                                    {paper.coAuthors.length !== 1 ? "s" : ""}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Deadlines Card */}
          {isPaneVisible("deadlines") && (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingDeadlines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No upcoming deadlines. Enjoy the calm!
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {upcomingDeadlines.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-3 rounded-md border border-slate-100 px-3 py-2 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <div className="flex shrink-0 flex-col items-center">
                          <span
                            className={`text-xs font-semibold ${
                              item.isOverdue
                                ? "text-red-600 dark:text-red-400"
                                : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {safeDateFormat(item.dateStr, "MMM d")}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {safeDateFormat(item.dateStr, "yyyy")}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                              {item.label}
                            </p>
                            {item.isOverdue && (
                              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500 dark:text-red-400" />
                            )}
                          </div>
                          {item.detail && (
                            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                              {item.detail}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={moduleBadgeVariant[item.module]}
                          className="shrink-0"
                        >
                          {item.moduleLabel}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          {/* Teaching pane */}
          {isPaneVisible("teaching") && (
            <Card>
              <CardHeader>
                <CardTitle>Active Courses</CardTitle>
              </CardHeader>
              <CardContent>
                {activeCourses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <GraduationCap className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No active courses.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {activeCourses.map((c) => (
                      <li key={c.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 dark:border-slate-700">
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{c.code} &mdash; {c.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{c.semester} {c.year} &middot; {c.enrollment} students</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          {/* Grants pane */}
          {isPaneVisible("grants") && (
            <Card>
              <CardHeader>
                <CardTitle>Grant Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {grants.list.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <DollarSign className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No grants tracked yet.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {grants.list.filter((g) => g.status !== "completed" && g.status !== "declined").map((g) => (
                      <li key={g.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 dark:border-slate-700">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{g.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{g.agency} &middot; {g.role}</p>
                        </div>
                        <Badge variant={g.status === "funded" ? "success" : "warning"} className="ml-2 shrink-0">
                          {g.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reviews pane */}
          {isPaneVisible("reviews") && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingReviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <ClipboardCheck className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No pending reviews.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {pendingReviews.map((r) => (
                      <li key={r.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 dark:border-slate-700">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{r.manuscriptTitle || "Untitled"}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{r.journal}{r.dueDate ? ` · Due ${safeDateFormat(r.dueDate, "MMM d")}` : ""}</p>
                        </div>
                        <Badge variant={r.status === "in-progress" ? "info" : "outline"} className="ml-2 shrink-0">{r.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          {/* Students pane */}
          {isPaneVisible("students") && (
            <Card>
              <CardHeader>
                <CardTitle>Active Students</CardTitle>
              </CardHeader>
              <CardContent>
                {activeStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No active advisees.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {activeStudents.map((s) => (
                      <li key={s.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 dark:border-slate-700">
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{s.level.toUpperCase()} &middot; {s.program}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          {/* Conferences pane */}
          {isPaneVisible("conferences") && (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Conferences</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingConferences.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Plane className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming conferences.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {upcomingConferences.map((c) => (
                      <li key={c.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 dark:border-slate-700">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{c.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{c.location}{c.startDate ? ` · ${safeDateFormat(c.startDate, "MMM d, yyyy")}` : ""}</p>
                        </div>
                        <Badge variant="info" className="ml-2 shrink-0">{c.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
