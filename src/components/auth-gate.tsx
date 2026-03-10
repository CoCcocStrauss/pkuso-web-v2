"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { TabBar } from "@/components/tab-bar";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, logout } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/login";

  React.useEffect(() => {
    if (!user && !isLoginPage) {
      router.replace("/login");
    }
  }, [user, isLoginPage, router]);

  const shouldShowShell = true;

  const isPending = !!user && user.status === "pending";

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen flex justify-center">
      <div className="flex min-h-screen w-full max-w-md flex-col bg-white shadow-lg">
        <main
          className={`flex-1 overflow-y-auto px-4 pt-4 ${
            isLoginPage ? "pb-4" : "pb-20"
          }`}
        >
          {(!user && !isLoginPage) ? (
            <div className="flex h-full items-center justify-center text-xs text-zinc-400">
              正在前往登录页…
            </div>
          ) : isPending && !isLoginPage ? (
            <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
              <div className="text-5xl">🕰️</div>
              <h1 className="mt-4 text-lg font-semibold text-zinc-900">
                申请审核中
              </h1>
              <p className="mt-2 max-w-xs text-sm text-zinc-500">
                您的入团申请已提交，请等待管理员审核。排练日程与社区功能将在审核通过后开放。
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-6 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
              >
                退出登录
              </button>
            </div>
          ) : (
            children
          )}
        </main>
        {!isLoginPage && user && !isPending && <TabBar />}
      </div>
    </div>
  );
}

