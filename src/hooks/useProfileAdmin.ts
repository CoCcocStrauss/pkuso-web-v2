import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAnnouncements } from "./useAnnouncements";
import type { ProfileRow } from "@/lib/types";

/**
 * 管理员功能 Hook
 * 处理管理员相关的功能：入团审批、发布公告等
 *
 * @returns 管理员功能相关的状态和方法
 */
export function useProfileAdmin() {
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingRows, setPendingRows] = useState<ProfileRow[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);

  /**
   * 获取待审批用户列表
   */
  const fetchPendingUsers = useCallback(async () => {
    setPendingLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, instrument, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setPendingLoading(false);

    if (error) {
      console.warn("[useProfileAdmin] 加载待审批列表失败：", error.message);
      setPendingRows([]);
      return;
    }

    setPendingRows((data as ProfileRow[]) ?? []);
  }, []);

  /**
   * 批准用户
   * @param id 用户 ID
   * @returns 是否批准成功
   */
  const approveUser = useCallback(async (id: string): Promise<boolean> => {
    if (approvingId) return false;
    setApprovingId(id);
    
    const { error } = await supabase
      .from("profiles")
      .update({ status: "approved" })
      .eq("id", id);
    
    setApprovingId(null);

    if (error) {
      console.warn("[useProfileAdmin] 审批失败：", error.message);
      return false;
    }

    setPendingRows((prev) => prev.filter((r) => r.id !== id));
    return true;
  }, [approvingId]);

  /**
   * 发布全团公告
   * @param content 公告内容
   * @returns 是否发布成功
   */
  const publishAnnouncement = useCallback(async (content: string): Promise<boolean> => {
    const text = content.trim();
    if (!text) {
      return false;
    }

    setAnnouncementSubmitting(true);
    const { error } = await supabase.from("announcements").insert({
      content: text,
    });
    setAnnouncementSubmitting(false);

    if (error) {
      console.warn("[useProfileAdmin] 发布公告失败：", error.message);
      return false;
    }
    return true;
  }, []);

  const changePasswordAdmin = useCallback(async (password: string): Promise<boolean> => {
    const { error } = await supabase.auth.updateUser({ password: password });
    if (error) {
      console.warn("[useProfileAdmin] 更新密码失败：", error.message);
      return false;
    }
    return true;
  }, []);

  return {
    /** 更新密码的方法 */
    changePasswordAdmin,
    /** 待审批用户加载状态 */
    pendingLoading,
    /** 待审批用户列表 */
    pendingRows,
    /** 获取待审批用户的方法 */
    fetchPendingUsers,
    /** 审批中的用户 ID */
    approvingId,
    /** 批准用户的方法 */
    approveUser,
    /** 发布公告提交状态 */
    announcementSubmitting,
    /** 发布公告的方法 */
    publishAnnouncement,
  };
}
