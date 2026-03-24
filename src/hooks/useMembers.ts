import { useCallback, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ProfileRow, RehearsalRow } from "@/lib/types";
import { RehearsalType } from "@/lib/enums";

export function useMembers() {
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterRows, setRosterRows] = useState<ProfileRow[]>([]);
  const [rosterError, setRosterError] = useState<string | null>(null);

  const [rehearsalsLoading, setRehearsalsLoading] = useState(false);
  const [rehearsalList, setRehearsalList] = useState<RehearsalRow[]>([]);
  const [startRehearsalIndex, setStartRehearsalIndex] = useState(0);
  const [endRehearsalIndex, setEndRehearsalIndex] = useState(0);

  const [statsLoading, setStatsLoading] = useState(false);
  const [statsRows, setStatsRows] = useState<
    { userId: string; label: string; count: number }[]
  >([]);
  const [statsError, setStatsError] = useState<string | null>(null);

  const fetchRoster = useCallback(async () => {
    setRosterLoading(true);
    setRosterError(null);

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, instrument, status, role, college, join_date, created_at",
      )
      .eq("status", "approved");

    setRosterLoading(false);

    if (error) {
      setRosterError(error.message);
      setRosterRows([]);
      return;
    }

    const rows = (data as ProfileRow[]) ?? [];
    setRosterRows(rows.filter((r) => (r.role ?? "") !== "admin"));
  }, []);

  const fetchRehearsalsForAttendance = useCallback(async () => {
    setRehearsalsLoading(true);
    const { data, error } = await supabase
      .from("rehearsals")
      .select("id, start_time, end_time, title, type, date")
      .order("date", { ascending: true });
    setRehearsalsLoading(false);

    if (error || !data) {
      setRehearsalList([]);
      return;
    }

    const list = (data as RehearsalRow[]).filter((r) => {
      return r.type === RehearsalType.FULL;
    });
    setRehearsalList(list);
    if (list.length > 0) {
      setStartRehearsalIndex(0);
      setEndRehearsalIndex(list.length - 1);
    } else {
      setStartRehearsalIndex(0);
      setEndRehearsalIndex(0);
    }
  }, []);

  const rehearsalIdsInRange = useMemo(() => {
    if (rehearsalList.length === 0) return [];

    const startIdx = Math.max(
      0,
      Math.min(startRehearsalIndex, rehearsalList.length - 1),
    );
    const endIdx = Math.max(
      0,
      Math.min(endRehearsalIndex, rehearsalList.length - 1),
    );
    const lo = Math.min(startIdx, endIdx);
    const hi = Math.max(startIdx, endIdx);
    return rehearsalList.slice(lo, hi + 1).map((r) => r.id);
  }, [rehearsalList, startRehearsalIndex, endRehearsalIndex]);

  const loadAttendanceStats = useCallback(async () => {
    if (rehearsalIdsInRange.length === 0) {
      setStatsRows([]);
      setStatsError(null);
      return;
    }

    setStatsLoading(true);
    setStatsError(null);
    const { data, error } = await supabase
      .from("attendances")
      .select("user_id, status")
      .in("rehearsal_id", rehearsalIdsInRange);
    setStatsLoading(false);

    if (error) {
      setStatsError(error.message);
      setStatsRows([]);
      return;
    }

    const rows = (data as { user_id: string; status: string }[]) ?? [];
    const countMap = new Map<string, number>();
    for (const row of rows) {
      if (row.status !== "present") continue;
      const uid = row.user_id;
      countMap.set(uid, (countMap.get(uid) ?? 0) + 1);
    }

    const userIds = [...countMap.keys()];
    if (userIds.length === 0) {
      setStatsRows([]);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, instrument")
      .in("id", userIds);
    const profList = (profiles as {
      id: string;
      full_name: string | null;
      instrument: string | null;
    }[]) ?? [];

    const idToProfile = new Map(profList.map((p) => [p.id, p]));
    const result = Array.from(countMap.entries()).map(([userId, count]) => {
      const p = idToProfile.get(userId);
      const name = p?.full_name ?? "—";
      const inst = p?.instrument ?? "—";
      return {
        userId,
        label: `${inst} - ${name}`,
        count,
      };
    });

    result.sort((a, b) => a.label.localeCompare(b.label, "zh-CN"));
    setStatsRows(result);
  }, [rehearsalIdsInRange]);

  return {
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
    rehearsalIdsInRange,
    statsLoading,
    statsRows,
    statsError,
    loadAttendanceStats,
  };
}
