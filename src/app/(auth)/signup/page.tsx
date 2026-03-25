"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { INSTRUMENTS } from "@/lib/constants";

export default function SignupPage() {
  const router = useRouter();
  const [invitationCode, setInvitationCode] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [instrument, setInstrument] = React.useState< (typeof INSTRUMENTS)[number] | "">("");
  const [college, setCollege] = React.useState("");
  const [joinDate, setJoinDate] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg("");

    // TODO：从数据库读取邀请码；对于管理员添加邀请码管理功能
    const normalizedCode = invitationCode.trim().toUpperCase();
    if (normalizedCode !== "PKUSO2026") {
      alert("邀请码错误，请联系乐团管理员获取");
      return;
    }

    if (
      !email.trim() ||
      !password.trim() ||
      !fullName.trim() ||
      !instrument ||
      !college.trim() ||
      !joinDate.trim()
    ) {
      setErrorMsg("请填写完整信息后再提交。");
      return;
    }

    // TODO：没有密码强度验证等功能，后续完善

    setSubmitting(true);
    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

    if (signUpError) {
      setSubmitting(false);
      setErrorMsg(signUpError.message || "注册失败，请稍后重试。");
      return;
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      setSubmitting(false);
      setErrorMsg("注册成功但未获取到用户信息，请稍后重试。");
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      email: email.trim(),
      full_name: fullName.trim(),
      instrument,
      college: college.trim(),
      join_date: joinDate.trim(),
      status: "pending",
      role: "member"
    });

    setSubmitting(false);

    if (profileError) {
      setErrorMsg(profileError.message || "写入资料失败，请稍后重试。");
      return;
    }

    alert("注册成功，请等待管理员审核");
    router.replace("/login");
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-border bg-background p-5 shadow-sm dark:border-border dark:bg-background">
          <div className="mb-4 text-center">
            <h1 className="text-xl font-semibold text-text dark:text-text">创建账号</h1>
            <p className="mt-1 text-xs text-text-secondary dark:text-text-secondary">
              注册后需等待管理员审核通过
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-text-secondary dark:text-text-secondary">
                乐团邀请码 (Invitation Code)
              </label>
              <input
                value={invitationCode}
                onChange={(e) => {
                  setInvitationCode(e.target.value);
                  setErrorMsg("");
                }}
                className="w-full rounded-xl border border-border bg-form px-3 py-2 text-sm text-text outline-none focus:border-border dark:border-border dark:bg-form dark:text-text"
                placeholder="请输入乐团邀请码"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-text-secondary dark:text-text-secondary">
                邮箱
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
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg("");
                }}
                className="w-full rounded-xl border border-border bg-form px-3 py-2 text-sm text-text outline-none focus:border-border dark:border-border dark:bg-form dark:text-text"
                placeholder="至少 6 位"
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-text-secondary dark:text-text-secondary">
                真实姓名
              </label>
              <input
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setErrorMsg("");
                }}
                className="w-full rounded-xl border border-border bg-form px-3 py-2 text-sm text-text outline-none focus:border-border dark:border-border dark:bg-form dark:text-text"
                placeholder="请填写真实姓名"
                autoComplete="name"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-text-secondary dark:text-text-secondary">
                所属声部
              </label>
              <select
                value={instrument}
                onChange={(e) => {
                  setInstrument(e.target.value as any);
                  setErrorMsg("");
                }}
                className="w-full rounded-xl border border-border bg-form px-3 py-2 text-sm text-text outline-none focus:border-border dark:border-border dark:bg-form dark:text-text"
              >
                <option value="" disabled>
                  请选择声部
                </option>
                {INSTRUMENTS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-text-secondary dark:text-text-secondary">
                学院
              </label>
              <input
                value={college}
                onChange={(e) => {
                  setCollege(e.target.value);
                  setErrorMsg("");
                }}
                className="w-full rounded-xl border border-border bg-form px-3 py-2 text-sm text-text outline-none focus:border-border dark:border-border dark:bg-form dark:text-text"
                placeholder="例如：经济学院"
                autoComplete="organization"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-text-secondary dark:text-text-secondary">
                入团时间
              </label>
              <input
                value={joinDate}
                onChange={(e) => {
                  setJoinDate(e.target.value);
                  setErrorMsg("");
                }}
                className="w-full rounded-xl border border-border bg-form px-3 py-2 text-sm text-text outline-none focus:border-border dark:border-border dark:bg-form dark:text-text"
                placeholder="例如：2024 秋"
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
              className="mt-1 flex w-full items-center justify-center rounded-2xl bg-button-primary px-4 py-3 text-sm font-medium text-button-primary-text shadow-md hover:bg-button-primary/90 disabled:opacity-60 dark:bg-button-primary dark:text-button-primary-text dark:hover:bg-button-primary/90"
            >
              {submitting ? "注册中…" : "注册"}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-text-secondary dark:text-text-secondary">
            已有账号？{" "}
            <Link href="/login" className="font-medium text-text dark:text-text">
              去登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

