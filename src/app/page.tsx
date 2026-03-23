"use client";

import React from "react";
import { useUser } from "@/context/UserContext";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useRehearsals } from "@/hooks/useRehearsals";
import { useAttendance } from "@/hooks/useAttendance";
import { AnnouncementSection } from "@/components/section/AnnouncementSection";
import { RehearsalSection } from "@/components/section/RehearsalSection";
import { AttendanceModal } from "@/components/modal/AttendanceModal";
import { PublishRehearsalModal } from "@/components/modal/PublishRehearsalModal";
import { REHEARSAL_TYPE_FULL, REHEARSAL_TYPE_SECTION } from "@/lib/constants";
import type { RehearsalRow } from "@/lib/types";

export default function Home() {
  const { user } = useUser(); // 只解构需要的 user
  const role = user?.role;
  const isAdmin = role === "admin";

  const { announcement, announcementLoading, fetchLatestAnnouncement } = useAnnouncements();
  const { rehearsals, rehearsalsLoading, fetchRehearsals } = useRehearsals();
  const {
    myAttendanceByRehearsal,
    attendanceModalRehearsal,
    setAttendanceModalRehearsal,
    attendanceLoading,
    attendanceMembers,
    statusByUserId,
    setStatusByUserId,
    attendanceSaving,
    handleMemberSignIn,
    handleSaveAttendance,
  } = useAttendance(user?.id, isAdmin);

  /** 顶部 Tab：全团合排 | 声部分排（全员可见） */
  const [scheduleTab, setScheduleTab] = React.useState<"full" | "section">("full");
  const [publishOpen, setPublishOpen] = React.useState(false);

  React.useEffect(() => {
    void fetchLatestAnnouncement();
    void fetchRehearsals();
  }, [fetchLatestAnnouncement, fetchRehearsals]);

  /** 按 Tab 过滤：全团合排 / 声部分排（宽松匹配，避免全角/空格导致不显示） */
  const displayedRehearsals = React.useMemo(() => {
    return rehearsals.filter((r) => {
      const dbTitle = (r.title || "").toString().replace(/\u3000/g, " ").trim();
      const target = scheduleTab === "full" ? REHEARSAL_TYPE_FULL : REHEARSAL_TYPE_SECTION;
      if (dbTitle === target) return true;
      if (scheduleTab === "full") return dbTitle.includes("合排") && !dbTitle.includes("分排");
      return dbTitle.includes("分排");
    });
  }, [rehearsals, scheduleTab]);

  const handlePublishSuccess = () => {
    void fetchRehearsals();
  };

  return (
    <div className="min-h-screen pb-6">
      {/* 顶部区域：与社区【公告板】一一对齐 */}
      <header className="mb-1">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">
              本周排练日程
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              查看乐团合排与分排安排
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setPublishOpen(true)}
              className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm hover:bg-zinc-800"
            >
              ➕ 发布新日程
            </button>
          )}
        </div>
        <div className="mt-2 flex justify-start">
          <div
            role="tablist"
            aria-label="排练类型"
            className="inline-flex rounded-full bg-zinc-100 p-1 text-xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={scheduleTab === "full"}
              onClick={() => setScheduleTab("full")}
              className={`min-w-[64px] rounded-full px-3 py-1 text-center transition-colors ${
                scheduleTab === "full"
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              合排
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={scheduleTab === "section"}
              onClick={() => setScheduleTab("section")}
              className={`min-w-[64px] rounded-full px-3 py-1 text-center transition-colors ${
                scheduleTab === "section"
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              分排
            </button>
          </div>
        </div>
      </header>

      <AnnouncementSection
        announcement={announcement}
        announcementLoading={announcementLoading}
      />

      <PublishRehearsalModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        onSuccess={handlePublishSuccess}
      />

      <RehearsalSection
        displayedRehearsals={displayedRehearsals}
        rehearsalsLoading={rehearsalsLoading}
        isAdmin={isAdmin}
        userId={user?.id}
        myAttendanceByRehearsal={myAttendanceByRehearsal}
        onSignIn={handleMemberSignIn}
        onOpenAttendanceModal={setAttendanceModalRehearsal}
      />

      <AttendanceModal
        rehearsal={attendanceModalRehearsal}
        loading={attendanceLoading}
        members={attendanceMembers}
        statusByUserId={statusByUserId}
        onStatusChange={(userId, status) =>
          setStatusByUserId((prev) => ({ ...prev, [userId]: status }))
        }
        saving={attendanceSaving}
        onSave={handleSaveAttendance}
        onClose={() => setAttendanceModalRehearsal(null)}
      />
    </div>
  );
}