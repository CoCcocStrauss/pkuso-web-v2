import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { RehearsalRow } from "@/lib/types";

/**
 * 排练管理 Hook
 * 负责获取和管理排练日程数据
 *
 * @returns 排练相关的状态和方法
 */
export function useRehearsals() {
  const [rehearsals, setRehearsals] = useState<RehearsalRow[]>([]);
  const [rehearsalsLoading, setRehearsalsLoading] = useState(false);

  /**
   * 获取所有排练日程
   * 按日期和开始时间升序排列
   */
  const fetchRehearsals = useCallback(async () => {
    setRehearsalsLoading(true);
    const { data, error } = await supabase
      .from("rehearsals")
      .select("id, title, date, start_time, end_time, location, repertoire, created_at, type, sign_in_code")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });
    setRehearsalsLoading(false);

    console.log("[useRehearsals] 获取排练数据：", data, error);

    if (error) {
      console.warn("[Home] 加载排练日程失败：", error.message);
      setRehearsals([]);
      return;
    }

    setRehearsals((data as RehearsalRow[]) || []);
  }, []);

  /**
   * 删除排练
   * @param id 排练 ID
   * @returns 是否删除成功
   */
  const deleteRehearsal = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("rehearsals").delete().eq("id", id);
    if (error) {
      console.warn("[useRehearsals] 删除排练失败：", error.message);
      return false;
    }
    return true;
  }, []);

  return {
    /** 排练列表 */
    rehearsals,
    /** 排练数据加载状态 */
    rehearsalsLoading,
    /** 获取排练数据的方法 */
    fetchRehearsals,
    /** 删除排练的方法 */
    deleteRehearsal,
  };
}