"use client";

import React from "react";
import { INSTRUMENTS, OTHER_GROUP } from "@/lib/constants";
import { formatRehearsalTimeRange, instrumentGroupKey } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import { useMembers } from "@/hooks/useMembers";
import { RehearsalType, REHEARSAL_TYPE_LABEL } from "@/lib/enums";


export default function MembersPage() {
  const [attendanceOpen, setAttendanceOpen] = React.useState(false);
  const [rosterOpen, setRosterOpen] = React.useState(false);

  const {
    rosterLoading,
    rosterRows,
    rosterError,
    fetchRoster,
    rehearsalsLoading,
    rehearsalList,
    fetchRehearsalsForAttendance,
    startRehearsalIndex,
    setStartRehearsalIndex,
    endRehearsalIndex,
    setEndRehearsalIndex,
    statsLoading,
    statsRows,
    statsError,
    rehearsalIdsInRange,
    loadAttendanceStats,
  } = useMembers();

  React.useEffect(() => {
    if (rosterOpen) void fetchRoster();
  }, [rosterOpen, fetchRoster]);

  React.useEffect(() => {
    if (attendanceOpen) void fetchRehearsalsForAttendance();
  }, [attendanceOpen, fetchRehearsalsForAttendance]);

  React.useEffect(() => {
    if (!attendanceOpen) return;
    if (rehearsalIdsInRange.length === 0) return;
    void loadAttendanceStats();
  }, [attendanceOpen, rehearsalIdsInRange, loadAttendanceStats]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, typeof rosterRows>();
    for (const row of rosterRows) {
      const g = instrumentGroupKey(row.instrument);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(row);
    }
    for (const [, arr] of map) {
      arr.sort((a, b) =>
        String(a.full_name ?? "").localeCompare(String(b.full_name ?? ""), "zh-CN"),
      );
    }

    const ordered: { group: string; users: typeof rosterRows }[] = [];
    for (const key of INSTRUMENTS) {
      const users = map.get(key);
      if (users && users.length > 0) ordered.push({ group: key, users });
    }

    const otherUsers = map.get(OTHER_GROUP);
    if (otherUsers && otherUsers.length > 0) ordered.push({ group: OTHER_GROUP, users: otherUsers });
    return ordered;
  }, [rosterRows]);

  const handleExportCsv = () => {
    const header = "声部 - 姓名,出勤次数";
    const lines = statsRows.map((r) => `"${String(r.label).replace(/"/g, '\"')}",${r.count}`);
    const csv = "\uFEFF" + [header, ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "乐团合排考勤统计.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-2">
      <header className="mt-1">
        <h1 className="text-lg font-semibold text-text dark:text-text">成员</h1>
        <p className="mt-1 text-xs text-text-secondary dark:text-text-secondary">排练考勤与乐团花名册</p>
      </header>

      <button
        type="button"
        onClick={() => setAttendanceOpen(true)}
        className="w-full rounded-2xl border border-border bg-white p-4 text-left shadow-[0_1px_4px_rgba(15,23,42,0.06)] transition hover:border-border/80 dark:border-border dark:bg-background dark:hover:border-border/80"
      >
        <p className="text-sm font-semibold text-text dark:text-text">排练考勤</p>
        <p className="mt-1 text-xs text-text-secondary dark:text-text-secondary">按合排日程区间统计出勤并导出</p>
      </button>

      <button
        type="button"
        onClick={() => setRosterOpen(true)}
        className="w-full rounded-2xl border border-border bg-white p-4 text-left shadow-[0_1px_4px_rgba(15,23,42,0.06)] transition hover:border-border/80 dark:border-border dark:bg-background dark:hover:border-border/80"
      >
        <p className="text-sm font-semibold text-text dark:text-text">全团成员信息</p>
        <p className="mt-1 text-xs text-text-secondary dark:text-text-secondary">点击查看乐团最新花名册</p>
      </button>

      {attendanceOpen && (
        <Modal
          title="总排练考勤统计"
          onClose={() => setAttendanceOpen(false)}
          className="flex max-h-[85vh] flex-col rounded-t-3xl border border-border dark:border-border"
        >
          <p className="mb-2 text-[11px] text-text-secondary dark:text-text-secondary">仅统计标题含「合排」或「全团」的排练；请选择起止排练</p>
          {rehearsalsLoading ? (
            <p className="mb-3 text-xs text-text-secondary dark:text-text-secondary">加载合排日程…</p>
          ) : rehearsalList.length === 0 ? (
            <p className="mb-3 text-xs text-warning dark:text-warning">暂无合排/全团日程，请先在日程中发布</p>
          ) : (
            <div className="mb-3 space-y-2">
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-text-secondary dark:text-text-secondary">起始排练</label>
                <select
                  value={startRehearsalIndex}
                  onChange={(e) => setStartRehearsalIndex(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-form px-3 py-2 text-sm text-text dark:border-border dark:bg-form dark:text-text"
                >
                  {rehearsalList.map((r, idx) => (
                    <option key={r.id} value={idx}>
                      {formatRehearsalTimeRange(r.start_time, r.end_time)} {REHEARSAL_TYPE_LABEL[r.type || RehearsalType.FULL]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-text-secondary dark:text-text-secondary">结束排练</label>
                <select
                  value={endRehearsalIndex}
                  onChange={(e) => setEndRehearsalIndex(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-form px-3 py-2 text-sm text-text dark:border-border dark:bg-form dark:text-text"
                >
                  {rehearsalList.map((r, idx) => (
                    <option key={r.id} value={idx}>
                      {formatRehearsalTimeRange(r.start_time, r.end_time)} {REHEARSAL_TYPE_LABEL[r.type || RehearsalType.FULL]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={statsRows.length === 0}
            className="mb-3 w-full rounded-2xl bg-button-primary px-4 py-3 text-sm font-medium text-button-primary-text shadow-md hover:bg-button-primary/90 disabled:opacity-50 dark:bg-button-primary dark:text-button-primary-text dark:hover:bg-button-primary/90"
          >
            导出为 Excel (CSV)
          </button>

          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border dark:border-border">
            {statsLoading ? (
              <p className="p-4 text-center text-xs text-text-secondary dark:text-text-secondary">统计中…</p>
            ) : statsError ? (
              <p className="p-3 text-sm text-error dark:text-error">{statsError}</p>
            ) : statsRows.length === 0 ? (
              <p className="p-4 text-center text-xs text-text-secondary dark:text-text-secondary">该区间内暂无出勤记录</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-background-secondary dark:border-border dark:bg-background-secondary">
                    <th className="px-3 py-2 font-medium text-text-secondary dark:text-text-secondary">声部 - 姓名</th>
                    <th className="px-3 py-2 font-medium text-text-secondary dark:text-text-secondary">出勤次数</th>
                  </tr>
                </thead>
                <tbody>
                  {statsRows.map((r) => (
                    <tr key={r.userId} className="border-b border-border last:border-0 dark:border-border">
                      <td className="px-3 py-2 text-text dark:text-text">{r.label}</td>
                      <td className="px-3 py-2 text-text-secondary dark:text-text-secondary">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Modal>
      )}

      {rosterOpen && (
        <Modal
          title="全团成员信息统计"
          onClose={() => setRosterOpen(false)}
          className="flex max-h-[85vh] flex-col rounded-t-3xl border border-border transition-all duration-300 ease-out dark:border-border"
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            {rosterLoading ? (
              <p className="py-8 text-center text-xs text-text-secondary dark:text-text-secondary">加载中…</p>
            ) : rosterError ? (
              <p className="rounded-xl bg-error/20 px-3 py-2 text-sm text-error dark:bg-error/20 dark:text-error">{rosterError}</p>
            ) : grouped.length === 0 ? (
              <p className="py-8 text-center text-xs text-text-secondary dark:text-text-secondary">暂无已通过成员</p>
            ) : (
              <div className="space-y-5">
                {grouped.map(({ group, users }) => (
                  <div key={group}>
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-text-secondary dark:text-text-secondary">{group}</p>
                    <ul className="space-y-2">
                      {users.map((u) => (
                        <li key={u.id} className="rounded-xl border border-border bg-background-secondary/80 px-3 py-2 text-xs dark:border-border dark:bg-background-secondary/80">
                          <p className="font-medium text-text dark:text-text">{(u.instrument ?? "—") + " - " + (u.full_name ?? "—")}</p>
                          <p className="mt-0.5 text-text-secondary dark:text-text-secondary">学院：{u.college?.trim() || "—"}</p>
                          <p className="mt-0.5 text-text-secondary dark:text-text-secondary">邮箱：{u.email ?? "—"}</p>
                          <p className="mt-0.5 text-text-secondary dark:text-text-secondary">入团时间：{u.join_date?.trim() || "—"}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
