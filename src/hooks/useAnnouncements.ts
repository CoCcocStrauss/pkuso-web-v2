import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { AnnouncementRow } from "@/lib/types";

/**
 * 公告管理 Hook
 * 负责获取和显示最新的公告信息
 *
 * @returns 公告相关的状态和方法
 */
export function useAnnouncements() {
  const [announcement, setAnnouncement] = useState<AnnouncementRow | null>(null);
  const [announcementLoading, setAnnouncementLoading] = useState(false);

  /**
   * 获取最新的公告
   * 从数据库中获取最新创建的公告记录
   */
  const fetchLatestAnnouncement = useCallback(async () => {
    setAnnouncementLoading(true);
    const { data, error } = await supabase
      .from("announcements")
      .select("id, content, created_at")
      .order("created_at", { ascending: false })
      .limit(1);
    setAnnouncementLoading(false);
    if (error) {
      console.warn("[Home] 加载公告失败：", error.message);
      setAnnouncement(null);
      return;
    }
    const row = Array.isArray(data) && data.length > 0 ? (data[0] as AnnouncementRow) : null;
    setAnnouncement(row);
  }, []);

  return {
    /** 当前公告数据 */
    announcement,
    /** 公告加载状态 */
    announcementLoading,
    /** 获取最新公告的方法 */
    fetchLatestAnnouncement,
  };
}