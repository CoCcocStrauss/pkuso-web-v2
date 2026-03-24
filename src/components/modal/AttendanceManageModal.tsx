import React from "react";
import type { ProfileRow, RehearsalRow } from "@/lib/types";
import { AttendanceStatus } from "@/lib/enums";
import { instrumentGroupKey } from "@/lib/utils";
import { INSTRUMENT_ORDER, OTHER_GROUP } from "@/lib/constants";

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
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-zinc-200 p-4">
          <div className="flex items-center justify-between">
            <h2 id="attendance-modal-title" className="text-sm font-semibold text-zinc-900">
              考勤管理 - {rehearsal.title || "未命名排练"}
            </h2>
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] text-zinc-600 hover:bg-zinc-200 disabled:opacity-50"
            >
              关闭
            </button>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-zinc-200 rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {groupedMembers.map(({ group, users }) => (
                <div key={group}>
                  <h3 className="text-xs font-medium text-zinc-700 mb-2">{group}</h3>
                  <div className="space-y-2">
                    {users.map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-2">
                        <span className="text-sm text-zinc-900">
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
                                    ? "bg-green-100 text-green-800"
                                    : status === AttendanceStatus.LATE
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
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

          <div className="mt-6 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="w-full rounded-full bg-zinc-900 py-3 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
            >
              {saving ? "保存中…" : "保存考勤"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}