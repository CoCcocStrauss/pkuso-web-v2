"use client";

import React, { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { PracticeSessionRow } from "@/lib/types";

export function usePracticeSession() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // 查询指定日期的预约
  const fetchPracticeSessions = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);


    try {
      const { data, error } = await supabase
        .from("practice_sessions")
        .select(`
          id,
          created_at,
          user_id,
          date,
          start_time,
          end_time,
          title,
          location,
          profiles(full_name, instrument, email)
        `)
        .eq("date", date)
        .order("start_time", { ascending: true });

      if (error) {
        setError(error.message);
        return [];
      }

      const normalized: PracticeSessionRow[] = (data as any[])
        ?.map((row) => ({
          id: row.id,
          created_at: row.created_at,
          user_id: row.user_id,
          date: row.date,
          start_time: row.start_time!,
          end_time: row.end_time!,
          title: row.title,
          location: row.location,
          profiles: row.profiles
            ? {
                full_name: row.profiles.full_name,
                instrument: row.profiles.instrument,
                email: row.profiles.email,
              }
            : null,
        })) ?? [];
        
      return normalized;
    } catch (err) {
      setError("获取预约信息失败");
      return [];
    } finally {
      setLoading(false);
    }
  }, [])

  // 检查预约冲突
  const checkConflict = async (
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from("practice_sessions")
        .select("id, start_time, end_time")
        .eq("date", date);

      if (error) {
        return { hasConflict: false, error: error.message };
      }

      const conflictingSession = data.find((session) => {
        // 排除当前编辑的预约
        if (excludeId && session.id === excludeId) {
          return false;
        }

        // 提取时间部分进行比较
        const sessionStartTime = session.start_time!;
        const sessionEndTime = session.end_time!;

        // 检查时间冲突：新预约的开始时间在现有预约的结束时间之前，且新预约的结束时间在现有预约的开始时间之后
        return startTime < sessionEndTime && endTime > sessionStartTime;
      });

      return { hasConflict: !!conflictingSession, error: null };
    } catch (err) {
      return { hasConflict: false, error: "检查冲突失败" };
    }
  };

  // 创建新预约
  const createPracticeSession = async (session: Omit<PracticeSessionRow, "id" | "created_at">) => {
    setLoading(true);
    setError(null);

    // 检查时间冲突
    const { hasConflict, error: conflictError } = await checkConflict(
      session.date,
      session.start_time!,
      session.end_time!
    );

    if (hasConflict) {
      const errorMsg = "预约时间与现有预约冲突";
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };  // 返回错误信息
    }

    if (conflictError) {
      setError(conflictError);
      setLoading(false);
      return { success: false, error: conflictError };
    }

    const { error } = await supabase
      .from("practice_sessions")
      .insert(session);

    if (error) {
      const errorMsg = error.message;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
    
    setLoading(false);
    return { success: true, error: null };
  };


  // 更新预约
  const updatePracticeSession = async (id: string, session: Partial<PracticeSessionRow>) => {
    setLoading(true);
    setError(null);

    try {
      // 如果更新了时间，需要检查冲突
      if (session.date && session.start_time && session.end_time) {
        const { hasConflict, error: conflictError } = await checkConflict(
          session.date,
          session.start_time,
          session.end_time,
          id
        );

        if (hasConflict) {
          setError("预约时间与现有预约冲突");
          setLoading(false);
          return false;
        }

        if (conflictError) {
          setError(conflictError);
          setLoading(false);
          return false;
        }
      }

      // 将时间字符串转换为完整的timestamp格式
      const formattedSession = {
        ...session
      };

      const { error } = await supabase
        .from("practice_sessions")
        .update(formattedSession)
        .eq("id", id);

      if (error) {
        setError(error.message);
        return false;
      }

      return true;
    } catch (err) {
      setError("更新预约失败");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 删除预约
  const deletePracticeSession = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("practice_sessions")
        .delete()
        .eq("id", id);

      if (error) {
        setError(error.message);
        return false;
      }

      return true;
    } catch (err) {
      setError("删除预约失败");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchPracticeSessions,
    createPracticeSession,
    updatePracticeSession,
    deletePracticeSession,
    checkConflict,
  };
}
