import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { ProfileRow, RehearsalRow } from "@/lib/types";
import { AttendanceStatus, AttendanceStr2EnumMap } from "@/lib/enums";

/**
 * 考勤管理 Hook
 * 处理成员签到和管理员考勤管理功能
 *
 * @param userId 当前用户ID
 * @param isAdmin 是否为管理员
 * @returns 考勤相关的状态和方法
 */
export function useAttendance(userId?: string, isAdmin?: boolean) {
  const [myAttendanceByRehearsal, setMyAttendanceByRehearsal] = useState<
    Record<string, AttendanceStatus | string>
  >({});
  const [myAttendanceLoading, setMyAttendanceLoading] = useState(false);

  // 管理员考勤校验 Modal
  const [attendanceModalRehearsal, setAttendanceModalRehearsal] = useState<RehearsalRow | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceMembers, setAttendanceMembers] = useState<ProfileRow[]>([]);
  const [statusByUserId, setStatusByUserId] = useState<Record<string, AttendanceStatus>>({});
  const [attendanceSaving, setAttendanceSaving] = useState(false);

  // 获取当前用户的考勤记录（直接写在 effect 中，避免额外的 useCallback 依赖）
  useEffect(() => {
    let cancelled = false;

    const loadMyAttendances = async () => {
      if (!userId || isAdmin) {
        if (!cancelled) setMyAttendanceByRehearsal({});
        return;
      }

      setMyAttendanceLoading(true);
      const { data, error } = await supabase
        .from("attendances")
        .select("rehearsal_id, status")
        .eq("user_id", userId);

      if (cancelled) return;

      setMyAttendanceLoading(false);

      if (error) {
        console.warn("[Home] 加载我的考勤失败：", error.message);
        setMyAttendanceByRehearsal({});
        return;
      }

      const map: Record<string, string> = {};
      for (const row of (data ?? []) as {
        rehearsal_id: string | number;
        status: string;
      }[]) {
        map[row.rehearsal_id] = row.status;
      }
      setMyAttendanceByRehearsal(map);
    };

    void loadMyAttendances();

    return () => {
      cancelled = true;
    };
  }, [userId, isAdmin]);

  // 打开管理员面板时：正式团员 + 该场 attendances；无记录默认 absent
  useEffect(() => {
    if (!attendanceModalRehearsal || !isAdmin) return;

    let cancelled = false;
    const rid = attendanceModalRehearsal.id;

    const load = async () => {
      setAttendanceLoading(true);
      const [profilesRes, attendRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, instrument, status")
          .eq("status", "approved"),
        supabase
          .from("attendances")
          .select("user_id, status")
          .eq("rehearsal_id", rid),
      ]);

      if (cancelled) return;

      setAttendanceLoading(false);

      if (profilesRes.error) {
        console.warn("[Home] 加载团员失败：", profilesRes.error.message);
        if (!cancelled) {
          setAttendanceMembers([]);
          setStatusByUserId({});
        }
        return;
      }

      const members = (profilesRes.data as ProfileRow[]) ?? [];
      if (!cancelled) setAttendanceMembers(members);

      const existing: Record<string, AttendanceStatus> = {};
      if (!attendRes.error && attendRes.data) {
        for (const row of attendRes.data as {
          user_id: string;
          status: string;
        }[]) {
          const s = row.status;

          existing[row.user_id] = AttendanceStr2EnumMap[s];
          
        }
      }
      const initial: Record<string, AttendanceStatus> = {};
      for (const m of members) {
        // 无记录视为未自助签到 → 默认缺席，由管理员补录
        initial[m.id] = existing[m.id] ?? AttendanceStatus.ABSENT;
      }
      if (!cancelled) setStatusByUserId(initial);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [attendanceModalRehearsal, isAdmin]);

  /**
   * 成员签到
   * @param r 排练记录
   */
  const handleMemberSignIn = async (r: RehearsalRow) => {
    if (!userId || isAdmin) return;
    const { error } = await supabase.from("attendances").upsert(
      {
        rehearsal_id: r.id,
        user_id: userId,
        status: "present",
      },
      { onConflict: "rehearsal_id,user_id" },
    );
    if (error) {
      alert(error.message || "签到失败，请稍后重试。");
      return;
    }
    setMyAttendanceByRehearsal((prev) => ({
      ...prev,
      [r.id]: "present",
    }));
    alert("签到成功");
  };

  /**
   * 保存考勤记录（管理员功能）
   */
  const handleSaveAttendance = async () => {
    if (!attendanceModalRehearsal || attendanceSaving) return;
    const rid = attendanceModalRehearsal.id;
    const rows = attendanceMembers.map((m) => ({
      user_id: m.id,
      rehearsal_id: rid,
      status: statusByUserId[m.id] ?? "absent",
    }));

    if (rows.length === 0) {
      alert("没有可保存的团员数据");
      return;
    }

    setAttendanceSaving(true);
    const { error } = await supabase
      .from("attendances")
      .upsert(rows, { onConflict: "rehearsal_id,user_id" });
    setAttendanceSaving(false);

    if (error) {
      alert(error.message || "保存失败，请稍后重试。");
      return;
    }

    alert("考勤已保存");
    setAttendanceModalRehearsal(null);
    setAttendanceMembers([]);
    setStatusByUserId({});
  };

  return {
    /** 当前用户的考勤记录映射 */
    myAttendanceByRehearsal,
    /** 个人考勤数据加载状态 */
    myAttendanceLoading,
    /** 管理员考勤模态框当前显示的排练 */
    attendanceModalRehearsal,
    /** 设置考勤模态框显示的排练 */
    setAttendanceModalRehearsal,
    /** 考勤数据加载状态 */
    attendanceLoading,
    /** 考勤成员列表 */
    attendanceMembers,
    /** 用户考勤状态映射 */
    statusByUserId,
    /** 设置用户考勤状态 */
    setStatusByUserId,
    /** 考勤保存状态 */
    attendanceSaving,
    /** 成员签到方法 */
    handleMemberSignIn,
    /** 保存考勤记录方法 */
    handleSaveAttendance,
  };
}