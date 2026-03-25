"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import { LogOut, MessageSquare, ChevronLeft, Moon, Sun } from "lucide-react";
import CommentSection from "@/app/sections/member/CommentSection";
import { useProfileAdmin } from "@/hooks/useProfileAdmin";
import { useProfileMember } from "@/hooks/useProfileMember";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { changePasswordAdmin } = useProfileAdmin();
  const { changePasswordMember } = useProfileMember();

  const isAdmin = user?.role === "admin";

  const [isPwdModalOpen, setIsPwdModalOpen] = React.useState(false);
  const [newPwd, setNewPwd] = React.useState("");
  const [confirmPwd, setConfirmPwd] = React.useState("");
  const [isUpdatingPwd, setIsUpdatingPwd] = React.useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const pwd = newPwd.trim();
    const confirm = confirmPwd.trim();

    if (pwd !== confirm) {
      alert("两次输入的密码不一致");
      return;
    }
    if (pwd.length < 6) {
      alert("新密码长度至少 6 位");
      return;
    }

    setIsUpdatingPwd(true);

    if (isAdmin) {
      const success = await changePasswordAdmin(pwd);
      if (!success) {
        alert("密码修改失败，请稍后重试");
        setIsUpdatingPwd(false);
        return;
      }
    } else {
      const success = await changePasswordMember(pwd);
      if (!success) {
        alert("密码修改失败，请稍后重试");
        setIsUpdatingPwd(false);
        return;
      }
    }

    setIsUpdatingPwd(false);
    alert("密码修改成功！");
    setNewPwd("");
    setConfirmPwd("");
    setIsPwdModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-background-light dark:hover:bg-background"
        >
          <ChevronLeft className="h-5 w-5 text-text-light-secondary dark:text-text-secondary" />
        </button>
        <h1 className="text-lg font-semibold text-text-light-primary dark:text-text-primary">
          设置
        </h1>
      </div>

      <section className="space-y-2">
        <div className="rounded-2xl border border-border bg-white dark:border-border dark:bg-background">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-text-secondary dark:text-text-secondary" />
              ) : (
                <Sun className="h-5 w-5 text-text-secondary dark:text-text-secondary" />
              )}
              <span className="text-sm font-medium text-text dark:text-text">
                深色模式
              </span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                theme === "dark" ? "bg-button-primary" : "bg-background-secondary"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${
                  theme === "dark" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <p className="px-1 text-xs font-medium text-text-secondary dark:text-text-secondary">
          账户
        </p>
        <div className="space-y-1 rounded-2xl border border-border bg-white dark:border-border dark:bg-background">
          <button
            type="button"
            onClick={() => setIsPwdModalOpen(true)}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-background-secondary dark:hover:bg-background-secondary"
          >
            <span className="text-sm font-medium text-text dark:text-text">
              修改密码
            </span>
            <span className="text-text-secondary dark:text-text-secondary">🔒</span>
          </button>

          <div className="border-t border-border dark:border-border" />

          <button
            type="button"
            onClick={() => setIsCommentModalOpen(true)}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-background-secondary dark:hover:bg-background-secondary"
          >
            <span className="text-sm font-medium text-text dark:text-text">
              意见反馈
            </span>
            <MessageSquare className="h-4 w-4 text-text-secondary dark:text-text-secondary" />
          </button>
        </div>
      </section>

      <section className="mt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-error px-4 py-3 text-sm font-medium text-white dark:bg-error dark:text-white"
        >
          <LogOut className="h-4 w-4" />
          <span>退出登录</span>
        </button>
      </section>

      {isPwdModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="update-password-title"
        >
          <button
            type="button"
            aria-label="关闭"
            className="absolute inset-0"
            onClick={() => {
              if (isUpdatingPwd) return;
              setIsPwdModalOpen(false);
            }}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-background">
            <h2
              id="update-password-title"
              className="text-base font-semibold text-text dark:text-text"
            >
              修改登录密码
            </h2>
            <form onSubmit={handleUpdatePassword} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary dark:text-text-secondary">
                  新密码
                </label>
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  className="w-full rounded-xl border border-border bg-form px-3 py-2 text-sm text-text outline-none focus:border-button-primary dark:border-border dark:bg-form dark:text-text"
                  placeholder="至少 6 位"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary dark:text-text-secondary">
                  确认新密码
                </label>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  className="w-full rounded-xl border border-border bg-form px-3 py-2 text-sm text-text outline-none focus:border-button-primary dark:border-border dark:bg-form dark:text-text"
                  placeholder="再次输入新密码"
                />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isUpdatingPwd}
                  onClick={() => {
                    if (isUpdatingPwd) return;
                    setIsPwdModalOpen(false);
                  }}
                  className="rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-text-secondary hover:bg-background-secondary disabled:opacity-60 dark:border-border dark:bg-background dark:text-text-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPwd}
                  className="rounded-full bg-button-primary px-4 py-2 text-xs font-medium text-button-primary-text hover:bg-button-primary/90 disabled:opacity-60 dark:bg-button-primary dark:text-button-primary-text"
                >
                  {isUpdatingPwd ? "提交中..." : "确认修改"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCommentModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="comment-modal-title"
        >
          <button
            type="button"
            aria-label="关闭"
            className="absolute inset-0"
            onClick={() => setIsCommentModalOpen(false)}
          />
          <CommentSection onClose={() => setIsCommentModalOpen(false)} />
        </div>
      )}
    </div>
  );
}
