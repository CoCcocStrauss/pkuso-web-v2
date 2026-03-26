import React from "react";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";
import type { AnnouncementRow } from "@/lib/types";
import Modal from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/utils";

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
  const [isHistoryModalOpen, setIsHistoryModalOpen] = React.useState(false);
  const [historyAnnouncements, setHistoryAnnouncements] = React.useState<AnnouncementRow[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);

  const handleOpenHistory = async () => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from("announcements")
      .select("id, content, created_at")
      .order("created_at", { ascending: false });
    setHistoryLoading(false);
    if (error) {
      console.warn("[Announcement] 加载历史公告失败：", error.message);
      setHistoryAnnouncements([]);
      return;
    }
    setHistoryAnnouncements(Array.isArray(data) ? data : []);
  };

  const handleCloseHistory = () => {
    setIsHistoryModalOpen(false);
    setHistoryAnnouncements([]);
  };

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
      <div className="mx-4 mb-6 rounded-2xl border border-border bg-background p-4 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-border rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-border rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="mx-4 mb-6 rounded-2xl border border-border bg-background p-4 shadow-sm">
        <p className="text-sm text-text-secondary">暂无公告</p>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-6 rounded-2xl border border-border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h2 className="mb-2 text-sm font-medium text-text">📢 最新公告</h2>
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{announcement.content}</p>
          {announcement.created_at && (
            <p className="mt-2 text-xs text-text-secondary">
              {new Date(announcement.created_at).toLocaleString("zh-CN")}
            </p>
          )}
          {/* 查看往期按钮 - 在内容下方 */}
          <div className="mt-3">
            <button
              type="button"
              onClick={handleOpenHistory}
              className="text-xs font-medium text-accent hover:text-accent/80 dark:text-accent-secondary dark:hover:text-accent-secondary/80"
            >
              查看往期 →
            </button>
          </div>
        </div>
        {/* 删除按钮 - 在右上角 */}
        {isAdmin && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-text-secondary hover:text-red-500"
          >
            删除
          </button>
        )}
      </div>

      {/* 往期公告 Modal */}
      {isHistoryModalOpen && (
        <Modal
          title="往期公告"
          onClose={handleCloseHistory}
        >
          <div className="max-h-[60vh] space-y-4 overflow-y-auto">
            {historyLoading ? (
              <div className="py-8 text-center">
                <div className="text-sm text-text-secondary">加载中...</div>
              </div>
            ) : historyAnnouncements.length === 0 ? (
              <div className="py-8 text-center">
                <div className="text-sm text-text-secondary">暂无历史公告</div>
              </div>
            ) : (
              historyAnnouncements.map((item, index) => (
                <article
                  key={item.id}
                  className={`rounded-xl border border-border-light bg-background-light p-3 dark:border-border dark:bg-background-secondary ${
                    index === 0 ? 'ring-2 ring-accent/20 dark:ring-accent/30' : ''
                  }`}
                >
                  {index === 0 && (
                    <div className="mb-1">
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent dark:bg-accent/20 dark:text-accent-secondary">
                        最新
                      </span>
                    </div>
                  )}
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">{item.content}</p>
                  {item.created_at && (
                    <p className="mt-2 text-xs text-text-secondary">
                      {formatDateTime(new Date(item.created_at), "yyyy-MM-dd HH:mm")}
                    </p>
                  )}
                </article>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
