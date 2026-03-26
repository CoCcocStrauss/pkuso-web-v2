"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    const trimmedEmail = email.trim();
    setErrorMsg("");
    setSuccessMsg("");

    if (!trimmedEmail) {
      setErrorMsg("请输入邮箱地址。");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg("请输入有效的邮箱地址。");
      return;
    }

    setSubmitting(true);

    // 先检查是否在 profiles 里存在用户
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", trimmedEmail)
      .single();

    if (fetchError) {
      setSubmitting(false);
      setErrorMsg("检查用户失败，请稍后重试。");
      console.error("[FORGOT-PASSWORD]check profile error", fetchError);
      return;
    }

    if (!profile) {
      setSubmitting(false);
      setErrorMsg("该邮箱未注册，请确认邮箱是否输入正确。");
      return;
    }

    // TODO：此处需要测试
    const redirectTo = `${window.location.origin}/login`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo,
    });

    setSubmitting(false);

    if (resetError) {
      setErrorMsg(resetError.message || "发送重置邮件失败，请稍后重试。");
      return;
    }

    setSuccessMsg("重置密码邮件已发送，请前往邮箱查收。完成后将自动返回登录页。\n如果没有收到请检查垃圾邮件。");

    // 这里不立即跳转，邮件点击后会重定向到 /login。
    // 若你希望直接跳转，也可以：router.replace("/login");
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-border bg-background p-5 shadow-sm dark:border-border dark:bg-background">
          <div className="mb-4 text-center">
            <h1 className="text-xl font-semibold text-text dark:text-text">重置密码</h1>
            <p className="mt-1 text-xs text-text-secondary dark:text-text-secondary">
              输入注册邮箱，系统会发送重置密码链接。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-text-secondary dark:text-text-secondary">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="w-full rounded-xl border border-border bg-form px-3 py-2 text-sm text-text outline-none focus:border-border dark:border-border dark:bg-form dark:text-text"
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>

            {errorMsg ? (
              <div className="rounded-xl bg-error/20 px-3 py-2 text-sm text-error dark:bg-error/20 dark:text-error">
                {errorMsg}
              </div>
            ) : null}

            {successMsg ? (
              <div className="rounded-xl bg-success/20 px-3 py-2 text-sm text-success dark:bg-success/20 dark:text-success">
                {successMsg}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 flex w-full items-center justify-center rounded-2xl bg-button-primary px-4 py-3 text-sm font-medium text-button-primary-text shadow-md hover:bg-button-primary/90 disabled:opacity-60 dark:bg-button-primary dark:text-button-primary-text dark:hover:bg-button-primary/90"
            >
              {submitting ? "发送中…" : "发送重置邮件"}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-text-secondary dark:text-text-secondary">
            已记得密码？
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="ml-1 font-medium text-text dark:text-text"
            >
              返回登录
            </button>
          </div>

          <div className="mt-2 text-center text-xs text-text-secondary dark:text-text-secondary">
            <Link href="/signup" className="font-medium text-text dark:text-text">
              去注册新账号
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}