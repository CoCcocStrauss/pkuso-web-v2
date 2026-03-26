"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg("");

    if (!email.trim() || !password) {
      setErrorMsg("请输入邮箱和密码。");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);

    if (error) {
      setErrorMsg(error.message || "登录失败，请稍后重试。");
      return;
    }

    router.replace("/");
  };

  // TODO: 忘记密码？
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-border bg-background p-5 shadow-sm dark:border-border dark:bg-background">
          <div className="mb-4 text-center">
            <h1 className="text-xl font-semibold text-text dark:text-text">登录</h1>
            <p className="mt-1 text-xs text-text-secondary dark:text-text-secondary">
              登录后进入乐团系统
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-text-secondary dark:text-text-secondary">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg("");
                }}
                className="w-full rounded-xl border border-border bg-form px-3 py-2 text-sm text-text outline-none focus:border-border dark:border-border dark:bg-form dark:text-text"
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-text-secondary dark:text-text-secondary">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg("");
                }}
                className="w-full rounded-xl border border-border bg-form px-3 py-2 text-sm text-text outline-none focus:border-border dark:border-border dark:bg-form dark:text-text"
                placeholder="请输入密码"
                autoComplete="current-password"
              />
            </div>

            {errorMsg ? (
              <div className="rounded-xl bg-error/20 px-3 py-2 text-center text-sm text-error dark:bg-error/20 dark:text-error">
                {errorMsg}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 flex w-full items-center justify-center rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-md hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {submitting ? "登录中…" : "登录"}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-text-secondary dark:text-text-secondary">
            还没有账号？{" "}
            <Link href="/signup" className="font-medium text-text dark:text-text">
              去注册
            </Link>
          </div>

          <div className="mt-4 text-center text-xs">
            <Link href="/forgot-password" className="font-medium text-text dark:text-text">
              忘记密码？
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

