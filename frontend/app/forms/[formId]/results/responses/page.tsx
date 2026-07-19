"use client";

import { useEffect, useMemo, useState } from "react";
import { getFormById, getFormResponses, submitResponse, type FormRead, type FormResponse } from "@/lib/api";
import ResponsesToolbar from "@/components/results/responses/ResponsesToolbar";
import ResponsesTable from "@/components/results/responses/ResponsesTable";
import EmptyResponsesState from "@/components/results/responses/EmptyResponsesState";
import FilterModal from "@/components/results/responses/FilterModal";
import { buildColumns } from "@/components/results/responses/columns";
import { buildSampleAnswers } from "@/components/results/responses/sampleAnswers";
import { exportResponsesCsv } from "@/components/results/responses/exportCsv";
import Toast from "@/components/share/Toast";

export default function ResponsesPage({ params }: { params: { formId: string } }) {
  const formId = params.formId;
  const [form, setForm] = useState<FormRead | null>(null);
  const [responses, setResponses] = useState<FormResponse[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<{ type: string; start?: Date; end?: Date }>({ type: "All time" });

  function flashToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage((m) => (m === message ? null : m)), 2500);
  }

  async function load() {
    const [formData, responseData] = await Promise.all([getFormById(Number(formId)), getFormResponses(Number(formId))]);
    setForm(formData);
    setResponses(responseData);
  }

  useEffect(() => {
    if (!formId) return;
    setLoading(true);
    load()
      .catch(() => flashToast("Failed to load responses"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  const { identity, rest } = useMemo(() => buildColumns(form?.questions ?? []), [form]);

  const filteredResponses = useMemo(() => {
    if (!responses) return [];
    let list = responses;

    // 1. Search query filter
    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter((r) => {
        if (r.completed && "completed".includes(query)) return true;
        return r.answers.some((a) => String(a.value ?? "").toLowerCase().includes(query));
      });
    }

    // 2. Date range filter
    if (dateFilter.type !== "All time") {
      const now = new Date();
      list = list.filter((r) => {
        if (!r.submitted_at) return false;
        const submittedAt = new Date(r.submitted_at);
        if (dateFilter.type === "Today") {
          return submittedAt.toDateString() === now.toDateString();
        } else if (dateFilter.type === "Last week") {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          return submittedAt >= sevenDaysAgo;
        } else if (dateFilter.type === "Last month") {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          return submittedAt >= thirtyDaysAgo;
        } else if (dateFilter.type === "Last year") {
          const oneYearAgo = new Date();
          oneYearAgo.setDate(now.getDate() - 365);
          return submittedAt >= oneYearAgo;
        } else if (dateFilter.type === "custom" && dateFilter.start) {
          const start = new Date(dateFilter.start);
          start.setHours(0, 0, 0, 0);
          const end = dateFilter.end ? new Date(dateFilter.end) : new Date(dateFilter.start);
          end.setHours(23, 59, 59, 999);
          return submittedAt >= start && submittedAt <= end;
        }
        return true;
      });
    }

    return list;
  }, [responses, search, dateFilter]);

  function toggleColumn(key: string) {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleGenerateTestResponse() {
    if (!form) return;
    setGenerating(true);
    try {
      const answers = buildSampleAnswers(form.questions as any);
      await submitResponse(form.id, answers);
      await load();
      flashToast("Test response added");
    } catch (err) {
      flashToast(form.status !== "published" ? "Publish your form first to generate test responses" : "Failed to generate a test response");
    } finally {
      setGenerating(false);
    }
  }

  function handleExport() {
    if (!form || !responses) return;
    const columns = identity ? [identity, ...rest] : rest;
    exportResponsesCsv(form.title, columns, filteredResponses);
  }

  if (loading || !form || !responses) {
    return <div className="flex h-full items-center justify-center text-sm text-gray-400">Loading responses…</div>;
  }

  if (responses.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyResponsesState formId={formId} onGenerateTestResponse={handleGenerateTestResponse} generating={generating} />
        <Toast message={toastMessage} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ResponsesToolbar
        search={search}
        onSearchChange={setSearch}
        onOpenFilters={() => setFiltersOpen(true)}
        columns={rest}
        hiddenKeys={hiddenKeys}
        onToggleColumn={toggleColumn}
        onExport={handleExport}
        onGenerateTestResponse={handleGenerateTestResponse}
        generating={generating}
        onDateFilterChange={setDateFilter}
      />
      <div className="min-h-0 flex-1">
        <ResponsesTable questions={form.questions} responses={filteredResponses} hiddenKeys={hiddenKeys} />
      </div>
      <FilterModal isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} />
      <Toast message={toastMessage} />
    </div>
  );
}
