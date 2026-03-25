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
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_4px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500 text-base font-medium text-white dark:bg-blue-400 dark:text-slate-900">
            {initials}
          </div>
          <div
            className={`min-w-0 flex-1 ${isAdmin ? "flex items-center" : "space-y-1"}`}
          >
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{fullName}</h1>
            {!isAdmin ? (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-slate-600 dark:text-slate-400">声部</span> {instrument}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="text-slate-600 dark:text-slate-400">邮箱</span> {email}
                </p>
              </>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => router.push("/settings")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-100/80 dark:bg-slate-800 dark:hover:bg-slate-800/80"
            aria-label="设置"
          >
            <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </section>

      {isAdmin && (
        <section className="space-y-4 rounded-2xl border-2 border-blue-500 bg-slate-50 p-4 shadow-sm dark:border-blue-400 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            💻 管理员控制台
          </h2>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                入团审批 · 待处理（{pendingRows.length}）
              </p>
              <button
                type="button"
                onClick={() => void fetchPendingUsers()}
                disabled={pendingLoading}
                className="rounded-full px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100/80 disabled:opacity-60 dark:text-slate-400 dark:hover:bg-slate-800/80"
              >
                刷新
              </button>
            </div>
            {pendingLoading ? (
              <p className="py-4 text-center text-xs text-slate-600 dark:text-slate-400">
                加载中…
              </p>
            ) : pendingRows.length === 0 ? (
              <p className="rounded-xl bg-white/80 py-4 text-center text-xs text-slate-600 dark:bg-slate-800/80 dark:text-slate-400">
                暂无待审批用户
              </p>
            ) : (
              <div className="max-h-[40vh] space-y-2 overflow-y-auto">
                {pendingRows.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {r.full_name || "未填写姓名"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                        {r.instrument || "未选择声部"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                        {r.email || "未填写邮箱"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                        注册时间：{formatDateTime(r.created_at, "yyyy-MM-dd HH:mm")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApprove(r.id)}
                      disabled={approvingId === r.id}
                      className="shrink-0 rounded-full bg-green-500 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-green-500/90 disabled:opacity-60 dark:bg-green-600 dark:text-white dark:hover:bg-green-600/90"
                    >
                      {approvingId === r.id ? "处理中…" : "✅ 批准"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
            <p className="mb-2 text-[11px] font-medium text-slate-600 dark:text-slate-400">
              发布全团公告
            </p>
            <form onSubmit={handlePublishAnnouncement} className="space-y-2">
              <textarea
                value={announcementBody}
                onChange={(e) => setAnnouncementBody(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                placeholder="输入公告内容…"
              />
              <button
                type="submit"
                disabled={announcementSubmitting}
                className="w-full rounded-xl bg-blue-500 py-2.5 text-sm font-medium text-white hover:bg-blue-500/90 disabled:opacity-60 dark:bg-blue-400 dark:text-slate-900 dark:hover:bg-blue-400/90"
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
