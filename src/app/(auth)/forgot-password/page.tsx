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
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 text-center">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">重置密码</h1>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              输入注册邮箱，系统会发送重置密码链接。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>

            {errorMsg ? (
              <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                {errorMsg}
              </div>
            ) : null}

            {successMsg ? (
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                {successMsg}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 flex w-full items-center justify-center rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-md hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {submitting ? "发送中…" : "发送重置邮件"}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
            已记得密码？
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="ml-1 font-medium text-zinc-900 dark:text-zinc-100"
            >
              返回登录
            </button>
          </div>

          <div className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
            <Link href="/signup" className="font-medium text-zinc-900 dark:text-zinc-100">
              去注册新账号
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}