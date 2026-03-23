import React from "react";
import type { RehearsalRow, AttendanceStatusType } from "@/lib/types";
import { formatDateLong, isRehearsalEnded } from "@/lib/utils";

/**
 * 排练列表组件属性接口
 */
interface RehearsalSectionProps {
  /** 要显示的排练列表 */
  displayedRehearsals: RehearsalRow[];
  /** 加载状态 */
  loading: boolean;
  /** 当前用户ID */
  userId?: string;
  /** 是否为管理员 */
  isAdmin?: boolean;
  /** 用户的考勤记录映射 */
  myAttendanceByRehearsal: Record<string, AttendanceStatusType | string>;
  /** 签到回调函数 */
  onSignIn: (r: RehearsalRow) => void;
  /** 打开考勤模态框回调函数 */
  onOpenAttendanceModal: (r: RehearsalRow) => void;
}

/**
 * 排练列表组件
 * 显示排练日程列表，包含成员签到功能和管理员考勤管理
 *
 * @param props 组件属性
 * @returns 排练列表组件
 */
export function RehearsalSection({
  displayedRehearsals,
  loading,
  userId,
  isAdmin,
  myAttendanceByRehearsal,
  onSignIn,
  onOpenAttendanceModal,
}: RehearsalSectionProps) {
  /**
   * 渲染成员考勤按钮
   * @param r 排练记录
   * @param compact 是否为紧凑模式
   * @returns 考勤按钮组件
   */
  const renderMemberAttendanceButton = (r: RehearsalRow, compact?: boolean) => {
    if (!userId || isAdmin) return null;
    const key = r.id
    const status = myAttendanceByRehearsal[key];
    const compactClass =
      "inline-block rounded border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-700";

    if (status === "present") {
      return (
        <button
          type="button"
          disabled
          className={compact ? compactClass + " cursor-not-allowed text-zinc-500" : "w-full cursor-not-allowed rounded-full border border-zinc-200 bg-zinc-100 py-2 text-sm font-medium text-zinc-500"}
        >
          ✅ 已签到
        </button>
      );
    }
    if (status === "leave") {
      return (
        <button
          type="button"
          disabled
          className={compact ? compactClass + " cursor-not-allowed text-zinc-500" : "w-full cursor-not-allowed rounded-full border border-zinc-200 bg-zinc-100 py-2 text-sm font-medium text-zinc-500"}
        >
          ⏸️ 已请假
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => onSignIn(r)}
        className={compact ? compactClass + " hover:bg-zinc-50" : "w-full rounded-full bg-zinc-900 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"}
      >
        📍 点击签到
      </button>
    );
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="mx-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="animate-pulse">
              <div className="h-4 bg-zinc-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-zinc-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-zinc-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (displayedRehearsals.length === 0) {
    return (
      <div className="mx-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-zinc-500">暂无排练日程</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayedRehearsals.map((r) => {
        const ended = isRehearsalEnded(r.date, r.end_time, r.start_time);
        const timeRange = r.start_time && r.end_time
          ? `${r.start_time.slice(11, 16)}-${r.end_time.slice(11, 16)}`
          : r.start_time?.slice(11, 16) || r.time || "—";

        return (
          <div key={r.id} className="mx-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-zinc-900 truncate">
                  {r.title || "未命名排练"}
                </h3>
                <p className="mt-1 text-xs text-zinc-600">
                  {formatDateLong(r.date, timeRange)}
                </p>
                <p className="mt-0.5 text-xs text-zinc-600">
                  📍 {r.location || "未设置地点"}
                </p>
                <p className="mt-0.5 text-xs text-zinc-600">
                  🎵 {r.repertoire || "未设置曲目"}
                </p>
              </div>
              <div className="shrink-0">
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => onOpenAttendanceModal(r)}
                    className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-zinc-800"
                  >
                    📋 考勤
                  </button>
                ) : (
                  !ended && renderMemberAttendanceButton(r, true)
                )}
              </div>
            </div>
            {!isAdmin && !ended && (
              <div className="mt-3">
                {renderMemberAttendanceButton(r)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
  const renderMemberAttendanceButton = (r: RehearsalRow, compact?: boolean) => {
    if (!userId || isAdmin) return null;
    const key = r.id
    const status = myAttendanceByRehearsal[key];
    const compactClass =
      "inline-block rounded border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-700";

    if (status === "present") {
      return (
        <button
          type="button"
          disabled
          className={compact ? compactClass + " cursor-not-allowed text-zinc-500" : "w-full cursor-not-allowed rounded-full border border-zinc-200 bg-zinc-100 py-2 text-sm font-medium text-zinc-500"}
        >
          ✅ 已签到
        </button>
      );
    }
    if (status === "leave") {
      return (
        <button
          type="button"
          disabled
          className={compact ? compactClass + " cursor-not-allowed text-zinc-500" : "w-full cursor-not-allowed rounded-full border border-zinc-200 bg-zinc-100 py-2 text-sm font-medium text-zinc-500"}
        >
          ⏸️ 已请假
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => onSignIn(r)}
        className={compact ? compactClass + " hover:bg-zinc-50" : "w-full rounded-full bg-zinc-900 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"}
      >
        📍 点击签到
      </button>
    );
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="mx-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="animate-pulse">
              <div className="h-4 bg-zinc-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-zinc-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-zinc-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (displayedRehearsals.length === 0) {
    return (
      <div className="mx-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-zinc-500">暂无排练日程</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayedRehearsals.map((r) => {
        const ended = isRehearsalEnded(r.date, r.end_time, r.start_time);
        const timeRange = r.start_time && r.end_time
          ? `${r.start_time.slice(11, 16)}-${r.end_time.slice(11, 16)}`
          : r.start_time?.slice(11, 16) || r.time || "—";

        return (
          <div key={r.id} className="mx-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-zinc-900 truncate">
                  {r.title || "未命名排练"}
                </h3>
                <p className="mt-1 text-xs text-zinc-600">
                  {formatDateLong(r.date, timeRange)}
                </p>
                <p className="mt-0.5 text-xs text-zinc-600">
                  📍 {r.location || "未设置地点"}
                </p>
                <p className="mt-0.5 text-xs text-zinc-600">
                  🎵 {r.repertoire || "未设置曲目"}
                </p>
              </div>
              <div className="shrink-0">
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => onOpenAttendanceModal(r)}
                    className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-zinc-800"
                  >
                    📋 考勤
                  </button>
                ) : (
                  !ended && renderMemberAttendanceButton(r, true)
                )}
              </div>
            </div>
            {!isAdmin && !ended && (
              <div className="mt-3">
                {renderMemberAttendanceButton(r)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}