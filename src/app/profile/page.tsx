"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { Settings } from "lucide-react";
import { useProfileAdmin } from "@/hooks/useProfileAdmin";
import { formatDateTime } from "@/lib/utils";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  instrument: string | null;
  status: string | null;
  created_at: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useUser();
  const {
    pendingLoading,
    pendingRows,
    fetchPendingUsers,
    approvingId,
    approveUser,
    announcementSubmitting,
    publishAnnouncement,
  } = useProfileAdmin();

  const fullName = user?.full_name ?? "—";
  const instrument = user?.instrument ?? "—";
  const email = user?.email ?? "—";
  const isAdmin = user?.role === "admin";
  const initials =
    fullName !== "—"
      ? fullName.slice(0, 2) || fullName.slice(0, 1) || "--"
      : "--";

  React.useEffect(() => {
    if (!isAdmin) return;
    void fetchPendingUsers();
  }, [isAdmin, fetchPendingUsers]);

  const handleApprove = async (id: string) => {
    const success = await approveUser(id);
    if (!success) {
      alert("审批失败，请稍后重试。");
      return;
    }
    alert("已批准该用户。");
  };

  const [announcementBody, setAnnouncementBody] = React.useState("");

  const handlePublishAnnouncement = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = announcementBody.trim();
    if (!text) {
      alert("请输入公告内容。");
      return;
    }
    const success = await publishAnnouncement(text);
    if (!success) {
      alert("发布失败，请重试。");
      return;
    }
    setAnnouncementBody("");
    alert("公告已发布");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-white p-4 shadow-[0_1px_4px_rgba(15,23,42,0.06)] dark:border-border dark:bg-background">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-button-primary text-base font-medium text-button-primary-text dark:bg-button-primary dark:text-button-primary-text">
            {initials}
          </div>
          <div
            className={`min-w-0 flex-1 ${isAdmin ? "flex items-center" : "space-y-1"}`}
          >
            <h1 className="text-lg font-semibold text-text dark:text-text">{fullName}</h1>
            {!isAdmin ? (
              <>
                <p className="text-sm text-text-secondary dark:text-text-secondary">
                  <span className="text-text-secondary dark:text-text-secondary">声部</span> {instrument}
                </p>
                <p className="text-xs text-text-secondary dark:text-text-secondary">
                  <span className="text-text-secondary dark:text-text-secondary">邮箱</span> {email}
                </p>
              </>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => router.push("/settings")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background-secondary hover:bg-background-secondary/80 dark:bg-background-secondary dark:hover:bg-background-secondary/80"
            aria-label="设置"
          >
            <Settings className="h-5 w-5 text-text-secondary dark:text-text-secondary" />
          </button>
        </div>
      </section>

      {isAdmin && (
        <section className="space-y-4 rounded-2xl border-2 border-button-primary bg-background-secondary p-4 shadow-sm dark:border-button-primary dark:bg-background-secondary">
          <h2 className="text-base font-semibold text-text dark:text-text">
            💻 管理员控制台
          </h2>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-medium text-text-secondary dark:text-text-secondary">
                入团审批 · 待处理（{pendingRows.length}）
              </p>
              <button
                type="button"
                onClick={() => void fetchPendingUsers()}
                disabled={pendingLoading}
                className="rounded-full px-2 py-1 text-[11px] text-text-secondary hover:bg-background-secondary/80 disabled:opacity-60 dark:text-text-secondary dark:hover:bg-background-secondary/80"
              >
                刷新
              </button>
            </div>
            {pendingLoading ? (
              <p className="py-4 text-center text-xs text-text-secondary dark:text-text-secondary">
                加载中…
              </p>
            ) : pendingRows.length === 0 ? (
              <p className="rounded-xl bg-background/80 py-4 text-center text-xs text-text-secondary dark:bg-background/80 dark:text-text-secondary">
                暂无待审批用户
              </p>
            ) : (
              <div className="max-h-[40vh] space-y-2 overflow-y-auto">
                {pendingRows.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border bg-white px-3 py-2 dark:border-border dark:bg-background"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text dark:text-text">
                        {r.full_name || "未填写姓名"}
                      </p>
                      <p className="mt-0.5 text-xs text-text-secondary dark:text-text-secondary">
                        {r.instrument || "未选择声部"}
                      </p>
                      <p className="mt-0.5 text-xs text-text-secondary dark:text-text-secondary">
                        {r.email || "未填写邮箱"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-text-secondary dark:text-text-secondary">
                        注册时间：{formatDateTime(r.created_at, "yyyy-MM-dd HH:mm")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApprove(r.id)}
                      disabled={approvingId === r.id}
                      className="shrink-0 rounded-full bg-success px-3 py-1.5 text-[11px] font-medium text-white hover:bg-success/90 disabled:opacity-60 dark:bg-success dark:text-white dark:hover:bg-success/90"
                    >
                      {approvingId === r.id ? "处理中…" : "✅ 批准"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4 dark:border-border">
            <p className="mb-2 text-[11px] font-medium text-text-secondary dark:text-text-secondary">
              发布全团公告
            </p>
            <form onSubmit={handlePublishAnnouncement} className="space-y-2">
              <textarea
                value={announcementBody}
                onChange={(e) => setAnnouncementBody(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-button-primary dark:border-border dark:bg-background dark:text-text"
                placeholder="输入公告内容…"
              />
              <button
                type="submit"
                disabled={announcementSubmitting}
                className="w-full rounded-xl bg-button-primary py-2.5 text-sm font-medium text-button-primary-text hover:bg-button-primary/90 disabled:opacity-60 dark:bg-button-primary dark:text-button-primary-text dark:hover:bg-button-primary/90"
              >
                {announcementSubmitting ? "发布中…" : "发布"}
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
