import React from "react";
import type { ProfileRow, RehearsalRow } from "@/lib/types";
import { AttendanceStatus, REHEARSAL_TYPE_LABEL, RehearsalType } from "@/lib/enums";
import { instrumentGroupKey } from "@/lib/utils";
import { INSTRUMENT_ORDER, OTHER_GROUP } from "@/lib/constants";
import { formatRehearsalTimeRange } from "@/lib/utils";

/**
 * 考勤管理模态框组件属性接口
 */
interface AttendanceManageModalProps {
  /** 当前管理的排练记录 */
  rehearsal: RehearsalRow | null;
  /** 加载状态 */
  loading: boolean;
  /** 成员列表 */
  members: ProfileRow[];
  /** 用户考勤状态映射 */
  statusByUserId: Record<string, AttendanceStatus>;
  /** 考勤状态变更回调 */
  onStatusChange: (userId: string, status: AttendanceStatus) => void;
  /** 保存状态 */
  saving: boolean;
  /** 保存回调 */
  onSave: () => void;
  /** 关闭回调 */
  onClose: () => void;
}

/**
 * 考勤管理模态框组件
 * 管理员用于管理特定排练的成员考勤状态
 *
 * @param props 组件属性
 * @returns 考勤管理模态框组件
 */
export function AttendanceManageModal({
  rehearsal,
  loading,
  members,
  statusByUserId,
  onStatusChange,
  saving,
  onSave,
  onClose,
}: AttendanceManageModalProps) {
  /**
   * 按乐器分组的成员列表
   * 成员按乐器分组并排序，便于管理员管理
   */
  const groupedMembers = React.useMemo(() => {
    const map = new Map<string, ProfileRow[]>();
    for (const row of members) {
      const g = instrumentGroupKey(row.instrument);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(row);
    }
    for (const [, arr] of map) {
      arr.sort((a, b) =>
        String(a.full_name ?? "").localeCompare(
          String(b.full_name ?? ""),
          "zh-CN",
        ),
      );
    }
    const ordered: { group: string; users: ProfileRow[] }[] = [];
    for (const key of INSTRUMENT_ORDER) {
      const users = map.get(key);
      if (users && users.length > 0) ordered.push({ group: key, users });
    }
    const other = map.get(OTHER_GROUP);
    if (other && other.length > 0) ordered.push({ group: OTHER_GROUP, users: other });
    return ordered;
  }, [members]);

  if (!rehearsal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendance-modal-title"
    >
      <button
        type="button"
        aria-label="关闭"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl max-h-[85vh] overflow-y-auto dark:bg-background">
        <div className="sticky top-0 bg-white border-b border-border p-4 dark:bg-background dark:border-border">
          <div className="flex items-center justify-between">
            <h2 id="attendance-modal-title" className="text-sm font-semibold text-text dark:text-text">
              考勤管理 - {rehearsal ? `${REHEARSAL_TYPE_LABEL[rehearsal.type || RehearsalType.FULL]} - ${rehearsal.repertoire || ""} - ${formatRehearsalTimeRange(rehearsal.start_time, rehearsal.end_time)} @ ${rehearsal.location || ""}` : "未命名排练"}
            </h2>
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-full bg-background-secondary px-3 py-1 text-[11px] text-text-secondary hover:bg-background-secondary/80 disabled:opacity-50 dark:bg-background-secondary dark:text-text-secondary dark:hover:bg-background-secondary/80"
            >
              关闭
            </button>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-background-secondary rounded dark:bg-background-secondary"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {groupedMembers.map(({ group, users }) => (
                <div key={group}>
                  <h3 className="text-xs font-medium text-text-secondary mb-2 dark:text-text-secondary">{group}</h3>
                  <div className="space-y-2">
                    {users.map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-2">
                        <span className="text-sm text-text dark:text-text">
                          {member.full_name || "未命名"}
                        </span>
                        <div className="flex gap-1">
                          {([AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.ABSENT] as const).map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => onStatusChange(member.id, status)}
                              className={`px-2 py-1 text-xs rounded ${
                                statusByUserId[member.id] === status
                                  ? status === AttendanceStatus.PRESENT
                                    ? "bg-success/20 text-success dark:bg-success/20 dark:text-success"
                                    : status === AttendanceStatus.LATE
                                    ? "bg-warning/20 text-warning dark:bg-warning/20 dark:text-warning"
                                    : "bg-error/20 text-error dark:bg-error/20 dark:text-error"
                                  : "bg-background-secondary text-text-secondary hover:bg-background-secondary/80 dark:bg-background-secondary dark:text-text-secondary dark:hover:bg-background-secondary/80"
                              }`}
                            >
                              {status === AttendanceStatus.PRESENT ? "✅" : status === AttendanceStatus.LATE ? "🟨" : "❌"}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-border dark:border-border">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="w-full rounded-full bg-button-primary py-3 text-sm font-medium text-button-primary-text shadow-sm hover:bg-button-primary/90 disabled:opacity-60 dark:bg-button-primary dark:text-button-primary-text dark:hover:bg-button-primary/90"
            >
              {saving ? "保存中…" : "保存考勤"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}