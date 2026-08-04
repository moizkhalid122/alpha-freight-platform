"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Package,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  EmployeePageHeader,
  EmployeePanel,
} from "@/components/employee/EmployeeShell";
import { useEmployeeUserId } from "@/hooks/useEmployeeData";
import {
  EMPLOYEE_TRAINING_CATALOG,
  getTrainingProgress,
  setTrainingLessonComplete,
  type TrainingSection,
} from "@/lib/employee-training-catalog";
import { cn } from "@/lib/utils";

const SECTION_ICONS: Record<TrainingSection["icon"], typeof Sparkles> = {
  welcome: Sparkles,
  company: Building2,
  sales: TrendingUp,
  product: Package,
  scripts: FileText,
  knowledge: BookOpen,
};

export default function EmployeeTrainingWorkspace() {
  const userId = useEmployeeUserId();
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<string>("welcome");
  const [activeLesson, setActiveLesson] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProgress({});
      return;
    }
    setProgress(getTrainingProgress(userId));
  }, [userId]);

  const pct = useMemo(() => {
    const all = EMPLOYEE_TRAINING_CATALOG.flatMap((s) => s.lessons);
    if (!all.length) return 0;
    const completed = all.filter((l) => progress[l.id]).length;
    return Math.round((completed / all.length) * 100);
  }, [progress]);

  const allLessons = EMPLOYEE_TRAINING_CATALOG.flatMap((s) => s.lessons);
  const lesson = allLessons.find((l) => l.id === activeLesson);

  const toggleLesson = (lessonId: string, done: boolean) => {
    if (!userId) return;
    setTrainingLessonComplete(userId, lessonId, done);
    setProgress(getTrainingProgress(userId));
  };

  return (
    <div>
      <EmployeePageHeader
        title="Training"
        description="Company onboarding, sales skills, scripts, and knowledge base — all in one place."
      />

      <EmployeePanel className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overall Progress</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{pct}%</p>
            <p className="mt-1 text-xs text-slate-500">
              {Object.keys(progress).length} of {allLessons.length} modules complete
            </p>
          </div>
          <div className="w-full sm:max-w-md">
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#BFFF07] transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </EmployeePanel>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {EMPLOYEE_TRAINING_CATALOG.map((section) => {
            const Icon = SECTION_ICONS[section.icon];
            const isOpen = expanded === section.id;
            const sectionDone = section.lessons.filter((l) => progress[l.id]).length;
            const sectionTotal = section.lessons.length;

            return (
              <EmployeePanel key={section.id} className="overflow-hidden p-0">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? "" : section.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50/80"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900">{section.title}</p>
                    <p className="text-xs text-slate-500">
                      {sectionDone}/{sectionTotal} complete
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                  )}
                </button>

                {isOpen ? (
                  <ul className="border-t border-slate-100 divide-y divide-slate-100">
                    {section.lessons.map((item) => {
                      const done = Boolean(progress[item.id]);
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => setActiveLesson(item.id)}
                            className={cn(
                              "flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-slate-50/80",
                              activeLesson === item.id && "bg-blue-50/50"
                            )}
                          >
                            <span className={cn("shrink-0", done ? "text-emerald-500" : "text-slate-300")}>
                              <CheckCircle2 className="h-5 w-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-slate-900">{item.title}</span>
                              {item.durationMin ? (
                                <span className="text-xs text-slate-400">{item.durationMin} min</span>
                              ) : null}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </EmployeePanel>
            );
          })}
        </div>

        <EmployeePanel className="sticky top-24 h-fit">
          {lesson ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Module</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">{lesson.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{lesson.summary}</p>
              {lesson.durationMin ? (
                <p className="mt-2 text-xs font-semibold text-slate-400">Estimated {lesson.durationMin} minutes</p>
              ) : null}
              <div className="mt-6 space-y-2">
                {progress[lesson.id] ? (
                  <button
                    type="button"
                    onClick={() => toggleLesson(lesson.id, false)}
                    className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Mark as incomplete
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleLesson(lesson.id, true)}
                    className="w-full rounded-xl bg-[#FFD666] py-2.5 text-sm font-bold text-slate-900 hover:bg-[#f5c84d]"
                  >
                    Mark complete
                  </button>
                )}
              </div>
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                Full video and document content can be linked here by admin. For now, review the summary and mark complete when done.
              </p>
            </>
          ) : (
            <div className="py-8 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-700">Select a module</p>
              <p className="mt-1 text-xs text-slate-500">Choose a lesson from the catalog to view details.</p>
            </div>
          )}
        </EmployeePanel>
      </div>
    </div>
  );
}
