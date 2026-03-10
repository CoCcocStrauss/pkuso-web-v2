"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";

const SECTION_OPTIONS = [
  "小提琴",
  "中提琴",
  "大提琴",
  "低音提琴",
  "长笛",
  "双簧管",
  "单簧管",
  "巴松",
  "圆号",
  "小号",
  "长号",
  "大号",
  "打击乐",
  "竖琴",
  "其他",
] as const;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useUser();
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  const [name, setName] = React.useState("");
  const [section, setSection] = React.useState("");
  const [grade, setGrade] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [inviteCode, setInviteCode] = React.useState("");

  const handleAdminLogin = () => {
    login({
      id: "11111111-1111-1111-1111-111111111111",
      name: "管理员测试",
      role: "admin",
      section: "指挥 / 管理员",
    });
    router.push("/");
  };

  const handleMemberLogin = () => {
    login({
      id: "22222222-2222-2222-2222-222222222222",
      name: "团员测试",
      role: "member",
      section: "第一小提琴",
    });
    router.push("/");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (
      !name.trim() ||
      !section.trim() ||
      !grade.trim() ||
      !department.trim() ||
      !email.trim() ||
      !inviteCode.trim()
    ) {
      alert("请填写完整的注册信息。");
      return;
    }

    const normalizedInvite = inviteCode.trim().toUpperCase();
    if (normalizedInvite !== "PKUSO2026") {
      setErrorMsg("❌ 邀请码不正确，请联系团长获取！");
      return;
    }
    setErrorMsg("");

    setSubmitting(true);
    // 如果这里 insert users 失败（尤其是 RLS 拦截），需要在 Supabase 执行：
    // ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    // CREATE POLICY "Enable insert for everyone" ON users FOR INSERT WITH CHECK (true);
    const { data, error } = await supabase
      .from("users")
      .insert({
        name: name.trim(),
        section: section.trim(),
        grade: grade.trim(),
        department: department.trim(),
        email: email.trim(),
        role: "member",
        status: "pending",
      })
      .select("id, name, role, section, grade, department, status, email")
      .single();

    setSubmitting(false);

    if (error || !data) {
      console.warn("[Register] 注册失败：", error?.message);
      alert("注册失败，请稍后重试。");
      return;
    }

    login({
      id: String((data as any).id),
      name: (data as any).name,
      role: (data as any).role,
      section: (data as any).section,
      grade: (data as any).grade ?? undefined,
      department: (data as any).department ?? undefined,
      status: (data as any).status ?? undefined,
      email: (data as any).email ?? undefined,
    });
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-xs text-center">
        <h1 className="text-xl font-semibold text-zinc-900">
          乐团管理助手
        </h1>
        <p className="mt-2 text-xs text-zinc-500">
          {isRegistering ? "提交入团申请" : "请选择您的体验身份"}
        </p>

        {isRegistering ? (
          <form onSubmit={handleRegister} className="mt-6 space-y-3 text-left">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-zinc-600">
                姓名
              </label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrorMsg("");
                }}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                placeholder="请输入姓名"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-zinc-600">
                声部
              </label>
              <input
                list="section-options"
                value={section}
                onChange={(e) => {
                  setSection(e.target.value);
                  setErrorMsg("");
                }}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                placeholder="如：小提琴 / 圆号 / 打击乐"
              />
              <datalist id="section-options">
                {SECTION_OPTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-zinc-600">
                年级
              </label>
              <input
                value={grade}
                onChange={(e) => {
                  setGrade(e.target.value);
                  setErrorMsg("");
                }}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                placeholder="如：23本"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-zinc-600">
                院系
              </label>
              <input
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setErrorMsg("");
                }}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                placeholder="如：新闻与传播学院"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-zinc-600">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg("");
                }}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-zinc-600">
                入团邀请码
              </label>
              <input
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value);
                  setErrorMsg("");
                }}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                placeholder="请输入内部邀请码"
              />
            </div>

            {errorMsg && (
              <div className="mb-4 text-center text-sm text-red-500">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-md disabled:opacity-60"
            >
              {submitting ? "提交中…" : "提交申请"}
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setIsRegistering(false);
                setInviteCode("");
                setErrorMsg("");
              }}
              className="w-full text-center text-xs text-zinc-500 hover:text-zinc-900"
            >
              返回登录
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleMemberLogin}
              className="flex w-full items-center justify-between rounded-2xl bg-zinc-900 px-4 py-3 text-left text-sm font-medium text-white shadow-md active:scale-[0.99]"
            >
              <span>🎻 以团员身份体验</span>
              <span className="text-[10px] text-zinc-300">
                以普通团员视角浏览
              </span>
            </button>

            <button
              type="button"
              onClick={handleAdminLogin}
              className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-medium text-zinc-900 shadow-sm active:scale-[0.99]"
            >
              <span>🔑 以管理员身份体验</span>
              <span className="text-[10px] text-zinc-500">
                拥有完整管理视角
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRegistering(true);
                setInviteCode("");
                setErrorMsg("");
              }}
              className="w-full text-center text-xs text-zinc-500 hover:text-zinc-900"
            >
              没有账号？申请入团
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

