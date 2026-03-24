import React from "react";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";
import type { AnnouncementRow } from "@/lib/types";

/**
 * 公告显示组件
 * 显示最新的公告信息，包含加载状态和空状态处理
 */
interface AnnouncementSectionProps {
  /** 公告数据 */
  announcement: AnnouncementRow | null;
  /** 加载状态 */
  announcementLoading: boolean;
  /** 删除成功回调 */
  onDelete: () => void;
}

/**
 * 公告显示组件
 * 负责展示最新的公告内容，包含加载动画和空状态
 *
 * @param props 组件属性
 * @returns 公告显示组件
 */
export function AnnouncementSection({ announcement, announcementLoading, onDelete }: AnnouncementSectionProps) {
  const { user } = useUser();
  const isAdmin = user?.role === "admin";

  const handleDelete = async () => {
    if (!announcement) return;
    const ok = window.confirm("确定要删除此公告吗？");
    if (!ok) return;

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcement.id);

    if (error) {
      console.warn("[Announcement] 删除公告失败：", error.message);
      alert("删除失败，请稍后重试。");
      return;
    }

    console.log("[Announcement] 已删除公告，ID：", announcement.id);

    alert("已删除该公告。");
    onDelete();
  };

  if (announcementLoading) {
    return (
      <div className="mx-4 mb-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-zinc-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="mx-4 mb-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-zinc-500">暂无公告</p>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h2 className="mb-2 text-sm font-medium text-zinc-900">📢 最新公告</h2>
          <p className="text-sm text-zinc-700 whitespace-pre-wrap">{announcement.content}</p>
          {announcement.created_at && (
            <p className="mt-2 text-xs text-zinc-500">
              {new Date(announcement.created_at).toLocaleString("zh-CN")}
            </p>
          )}
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-zinc-400 hover:text-red-500"
          >
            删除
          </button>
        )}
      </div>
    </div>
  );
}
