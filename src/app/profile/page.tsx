 "use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { ChevronDown, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useUser();

  const initials =
    user?.name?.slice(0, 2) || user?.name?.slice(0, 1) || "--";

  const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);
  const [reportData, setReportData] = React.useState<any[]>([]);
  const [reportLoading, setReportLoading] = React.useState(false);
  const [memberRate, setMemberRate] = React.useState<number | null>(null);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isAdmin = user?.role === "admin";

  type AdminTab = "members" | "pending";
  const [adminTab, setAdminTab] = React.useState<AdminTab>("members");
  const [pendingUsers, setPendingUsers] = React.useState<any[]>([]);
  const [approvedUsers, setApprovedUsers] = React.useState<any[]>([]);
  const [peopleLoading, setPeopleLoading] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState<
    Record<string, boolean>
  >({});

  const handleOpenReport = () => {
    setIsReportModalOpen(true);
    setReportLoading(true);
  };

  const handleCloseReport = () => {
    if (reportLoading) return;
    setIsReportModalOpen(false);
    setReportData([]);
  };

  React.useEffect(() => {
    if (!isReportModalOpen) return;

    const fetchReport = async () => {
      setReportLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*, attendances(rehearsal_id, rehearsals!inner(type))");

      console.log("==== 数据库返回的全量用户 ====", data);

      if (error) {
        console.warn("[Profile] 加载全团出勤报表失败：", error.message);
        setReportData([]);
        setReportLoading(false);
        return;
      }

      const validAttendanceUsers = (Array.isArray(data) ? data : []).filter(
        (u: any) => {
          if (u.role === "admin") return false; // 绝对不要管理员
          if (u.status === "pending") return false; // 绝对不要待审核的萌新
          return true; // 剩下的全要（包含 approved 和早期的测试空状态数据）
        },
      );

      const withCounts =
        (validAttendanceUsers ?? []).map((row: any) => {
          const records: any[] = Array.isArray(row.attendances)
            ? row.attendances
            : [];
          const fullCount = records.filter((rec: any) => {
            const rehearsal = rec.rehearsals as { type?: string } | undefined;
            return rehearsal?.type === "full";
          }).length;
          return { ...row, _attendanceCount: fullCount };
        }) ?? [];

      withCounts.sort(
        (a: any, b: any) => b._attendanceCount - a._attendanceCount,
      );

      setReportData(withCounts);
      setReportLoading(false);
    };

    void fetchReport();
  }, [isReportModalOpen]);

  const fetchPeople = React.useCallback(async () => {
    if (!isAdmin) return;
    setPeopleLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*");

    console.log("==== 数据库返回的全量用户 ====", data);

    if (error) {
      console.warn("[Profile] 加载人事数据失败：", error.message);
      setPendingUsers([]);
      setApprovedUsers([]);
      setPeopleLoading(false);
      return;
    }

    const rows = Array.isArray(data) ? data : [];
    // 待审核列表：只要 pending
    const pendingUsers = rows.filter((u: any) => u.status === "pending");
    // 正式成员列表：排除管理员，排除 pending
    const approvedUsers = rows.filter(
      (u: any) => u.role !== "admin" && u.status !== "pending",
    );

    setPendingUsers(pendingUsers);
    setApprovedUsers(approvedUsers);
    setPeopleLoading(false);
  }, [isAdmin]);

  React.useEffect(() => {
    if (!isAdmin) return;
    void fetchPeople();
  }, [isAdmin, fetchPeople]);

  const handleApprove = async (targetId: string) => {
    if (!isAdmin) return;
    const { error } = await supabase
      .from("users")
      .update({ status: "approved" })
      .eq("id", targetId);
    if (error) {
      console.warn("[Profile] 通过申请失败：", error.message);
      alert("操作失败，请稍后重试。");
      return;
    }
    void fetchPeople();
  };

  const handleReject = async (targetId: string) => {
    if (!isAdmin) return;
    const { error } = await supabase
      .from("users")
      .update({ status: "rejected" })
      .eq("id", targetId);
    if (error) {
      console.warn("[Profile] 拒绝申请失败：", error.message);
      alert("操作失败，请稍后重试。");
      return;
    }
    void fetchPeople();
  };

  React.useEffect(() => {
    if (!user || user.role !== "member") {
      return;
    }

    const computeRate = async () => {
      const now = new Date();

      const { data: rehearsals, error: rehError } = await supabase
        .from("rehearsals")
        .select("id, start_time")
        .eq("type", "full");

      if (rehError) {
        console.warn("[Profile] 加载合排数据失败：", rehError.message);
        setMemberRate(100);
        return;
      }

      const allFull = Array.isArray(rehearsals) ? rehearsals : [];
      const pastFullRehearsals = allFull.filter((r: any) => {
        if (!r.start_time) return false;
        const start = new Date(r.start_time);
        if (Number.isNaN(start.getTime())) return false;
        return start < now;
      });

      const totalFull = pastFullRehearsals.length;

      const { data: attendances, error: attError } = await supabase
        .from("attendances")
        .select("rehearsal_id")
        .eq("user_id", user.id);

      if (attError) {
        console.warn("[Profile] 加载个人出勤失败：", attError.message);
        setMemberRate(100);
        return;
      }

      const pastIds = new Set(
        pastFullRehearsals.map((r: any) => r.id as number),
      );

      const myAtt = Array.isArray(attendances) ? attendances : [];
      let attendedFull = 0;
      for (const row of myAtt) {
        if (pastIds.has(row.rehearsal_id)) {
          attendedFull += 1;
        }
      }

      if (totalFull === 0) {
        setMemberRate(100);
        return;
      }

      const pct = Math.round((attendedFull / totalFull) * 100);
      const clamped = Math.min(100, Math.max(0, pct));
      setMemberRate(clamped);
    };

    void computeRate();
  }, [user]);

  const currentMemberRate = memberRate ?? 85;
  const barWidth = `${Math.min(100, Math.max(0, currentMemberRate))}%`;

  const SECTION_ORDER = React.useMemo(
    () => [
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
    ],
    [],
  );

  const approvedGroups = React.useMemo(() => {
    const byInstrument = new Map<string, any[]>();
    const others: any[] = [];

    for (const row of approvedUsers) {
      const secRaw = (row as any)?.section;
      const secText = typeof secRaw === "string" ? secRaw : "";
      const matched = SECTION_ORDER.find((instrument) =>
        secText ? secText.includes(instrument) : false,
      );
      if (matched) {
        if (!byInstrument.has(matched)) byInstrument.set(matched, []);
        byInstrument.get(matched)!.push(row);
      } else {
        others.push(row);
      }
    }

    const sortByName = (arr: any[]) =>
      arr.sort((a: any, b: any) =>
        String(a.name ?? "").localeCompare(String(b.name ?? ""), "zh-CN"),
      );

    const ordered: Array<{ section: string; users: any[] }> = [];
    for (const instrument of SECTION_ORDER) {
      const users = byInstrument.get(instrument);
      if (users && users.length > 0) {
        ordered.push({ section: instrument, users: sortByName([...users]) });
      }
    }

    if (others.length > 0) {
      ordered.push({ section: "其他", users: sortByName([...others]) });
    }

    return ordered;
  }, [approvedUsers, SECTION_ORDER]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const formatDuration = (createdAt?: string | null) => {
    if (!createdAt) return "—";
    const start = new Date(createdAt);
    if (Number.isNaN(start.getTime())) return "—";
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    if (diffDays < 30) return `${diffDays} 天`;
    const months = Math.floor(diffDays / 30);
    return `${months} 个月`;
  };

  return (
    <div className="space-y-6">
      <header className="mt-1 flex items-center justify-between gap-3">
        <div className="space-y-1">
          {isAdmin ? (
            <>
              <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                peking university symphony orchestra
              </p>
              <h1 className="text-lg font-semibold text-zinc-900">
                2025-2026届乐团管理
              </h1>
              <p className="text-xs text-zinc-500">管理员后台</p>
            </>
          ) : (
            <>
              <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                当前登录成员
              </p>
              <h1 className="text-lg font-semibold text-zinc-900">
                {user?.name ?? "未登录用户"} · {user?.section ?? "声部待识别"}
              </h1>
              <p className="text-xs text-zinc-500">
                加入乐团第 3 年（示意数据）
              </p>
            </>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white">
          {initials}
        </div>
      </header>

      {isAdmin ? (
        <>
        <section className="space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
          <div className="inline-flex rounded-full bg-zinc-100 p-1 text-[11px]">
            {(
              [
                { id: "members", label: "乐团成员" },
                { id: "pending", label: "入团申请" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setAdminTab(t.id)}
                className={`min-w-[72px] rounded-full px-3 py-1 text-center transition-colors ${
                  adminTab === t.id
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {adminTab === "pending" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-zinc-600">
                  入团申请（待审核）
                </p>
                <button
                  type="button"
                  onClick={() => void fetchPeople()}
                  className="rounded-full px-3 py-1 text-[11px] text-zinc-500 hover:bg-zinc-100"
                >
                  刷新
                </button>
              </div>

              {peopleLoading ? (
                <p className="py-6 text-center text-[11px] text-zinc-400">
                  正在加载...
                </p>
              ) : pendingUsers.length === 0 ? (
                <p className="py-6 text-center text-[11px] text-zinc-400">
                  暂无待审核申请
                </p>
              ) : (
                <div className="space-y-2">
                  {pendingUsers.map((u: any) => (
                    <div
                      key={u.id}
                      className="rounded-2xl border border-zinc-100 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-900">
                            {u.name ?? "未命名"} · {u.section ?? "声部未填"}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {u.grade ?? "年级未填"} · {u.department ?? "院系未填"}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {u.email ?? "邮箱未填"}
                          </p>
                        </div>
                        <div className="shrink-0 space-y-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleApprove(String(u.id))}
                            className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-emerald-700"
                          >
                            通过
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(String(u.id))}
                            className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100"
                          >
                            拒绝
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : adminTab === "members" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-zinc-600">
                  乐团成员
                </p>
                <button
                  type="button"
                  onClick={() => void fetchPeople()}
                  className="rounded-full px-3 py-1 text-[11px] text-zinc-500 hover:bg-zinc-100"
                >
                  刷新
                </button>
              </div>

              {peopleLoading ? (
                <p className="py-6 text-center text-[11px] text-zinc-400">
                  正在加载...
                </p>
              ) : approvedUsers.length === 0 ? (
                <p className="py-6 text-center text-[11px] text-zinc-400">
                  暂无已通过成员
                </p>
              ) : (
                <div className="max-h-[50vh] space-y-4 overflow-y-auto overflow-x-hidden pr-1">
                  {approvedGroups.map((g) => {
                    if (!g.users || g.users.length === 0) return null;
                    const expanded = !!expandedSections[g.section];
                    return (
                      <div key={g.section} className="space-y-2">
                        <button
                          type="button"
                          onClick={() => toggleSection(g.section)}
                          className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-left cursor-pointer"
                        >
                          <span className="text-[11px] font-medium text-zinc-700">
                            {g.section}（{g.users.length}人）
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-zinc-400 transition-transform ${
                              expanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {expanded ? (
                          <div className="space-y-2">
                            {g.users.map((u: any) => {
                              const emailText = u.email
                                ? `✉️ ${u.email}`
                                : "未填邮箱";
                              return (
                                <div
                                  key={u.id}
                                  className="flex items-start justify-between rounded-2xl border border-zinc-100 bg-white px-3 py-2"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-zinc-900">
                                      {u.name ?? "未命名"}
                                    </p>
                                    <p className="mt-0.5 text-xs text-zinc-500">
                                      {u.grade ?? "—"} · {u.department ?? "—"}
                                    </p>
                                  </div>
                                  <p className="shrink-0 text-xs text-zinc-400 text-right">
                                    {emailText}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </section>

        <section className="space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="text-[11px] font-medium text-zinc-600">
                乐团考勤数据
              </p>
              <p className="mt-1 text-base font-semibold text-zinc-900">
                出勤统计
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-center text-[10px] font-medium text-emerald-700">
              ALL
            </div>
          </div>
          <p className="text-[11px] text-zinc-500">
            点击下方按钮查看所有团员的累计打卡次数（示意数据，用于作品集展示）。
          </p>
          <button
            type="button"
            onClick={handleOpenReport}
            className="flex w-full items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-zinc-800"
          >
            📊 查看全团出勤报表
          </button>
        </section>
        </>
      ) : (
        <section className="space-y-2 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-700">出勤率</span>
            <span className="font-semibold text-emerald-600">
              {currentMemberRate}%
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-zinc-200">
            <div
              className="h-2 rounded-full bg-emerald-500"
              style={{ width: barWidth }}
            />
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            近三个月排练与演出到勤情况统计。
          </p>
        </section>
      )}

      <section className="mt-6">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 shadow-sm hover:bg-red-100"
        >
          <LogOut className="h-4 w-4" />
          <span>退出体验（Logout）</span>
        </button>
      </section>

      {isAdmin && isReportModalOpen && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 px-4 pb-safe">
          <button
            aria-label="关闭全团出勤报表弹窗"
            className="absolute inset-0 h-full w-full"
            onClick={handleCloseReport}
            disabled={reportLoading}
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-4 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">
                全团出勤报表
              </h2>
              <button
                type="button"
                onClick={handleCloseReport}
                disabled={reportLoading}
                className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] text-zinc-600 hover:bg-zinc-200"
              >
                关闭
              </button>
            </div>
            <p className="mb-3 text-[11px] text-zinc-500">
              （注：为保证公平，本榜单仅自动统计合排。分排出勤由管理员在此基础上另行加分）
            </p>

            <div className="max-h-64 space-y-2 overflow-y-auto pt-1">
              {reportLoading ? (
                <p className="py-6 text-center text-[11px] text-zinc-400">
                  正在生成报表...
                </p>
              ) : reportData.length === 0 ? (
                <p className="py-6 text-center text-[11px] text-zinc-400">
                  暂无团员出勤数据
                </p>
              ) : (
                reportData.map((row: any) => {
                  const name: string = row.name ?? "未命名成员";
                  const section: string = row.section ?? "声部未登记";
                  const count: number = row._attendanceCount ?? 0;
                  const avatar = name.slice(0, 2);
                  return (
                    <div
                      key={row.id}
                      className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-medium text-white">
                          {avatar}
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-zinc-900">
                            {name}
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            {section}
                          </p>
                        </div>
                      </div>
                      <p className="text-[11px] font-semibold text-emerald-600">
                        已出勤 {count} 次
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={handleCloseReport}
                disabled={reportLoading}
                className="rounded-full bg-zinc-900 px-4 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


