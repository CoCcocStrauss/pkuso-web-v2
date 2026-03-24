 "use client";

import React from "react";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";
import "react-datepicker/dist/react-datepicker.css";
import Modal from "@/components/ui/Modal";
import { PublishRehearsalModal } from "../../../components/modal/PublishRehearsalModal";
import { AttendanceManageModal } from "../../../components/modal/AttendanceManageModal";
import { isRehearsalEnded, formatRehearsalRange } from "@/lib/utils";
import { useRehearsals } from "@/hooks/useRehearsals";
import { useAttendance } from "@/hooks/useAttendance";
import type { RehearsalRow } from "@/lib/types";
import { RehearsalType } from "@/lib/enums";

const TYPE_LABEL: Record<RehearsalType, string> = {
  [RehearsalType.FULL]: "合排",
  [RehearsalType.SECTION]: "分排",
};

export function RehearsalSection() {
  const [currentType, setCurrentType] = React.useState<RehearsalType>(RehearsalType.FULL);
  const { rehearsals, rehearsalsLoading, fetchRehearsals } = useRehearsals();
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [editingRehearsal, setEditingRehearsal] = React.useState<RehearsalRow | null>(null);

  const { user } = useUser();
  const isAdmin = user?.role === "admin";

  const {
    attendanceModalRehearsal: manageAttendanceModalRehearsal,
    attendanceLoading: manageAttendanceLoading,
    attendanceMembers: manageAttendanceMembers,
    statusByUserId: manageStatusByUserId,
    setStatusByUserId: setManageStatusByUserId,
    setAttendanceModalRehearsal: setManageAttendanceModalRehearsal,
    attendanceSaving: manageAttendanceSaving,
    handleSaveAttendance: handleManageSaveAttendance,
  } = useAttendance(user?.id, isAdmin);

  React.useEffect(() => {
    void fetchRehearsals();
  }, [fetchRehearsals]);

  const displayRehearsals = React.useMemo(() => {
    const targetType = currentType;
    return rehearsals.filter((item) => item.type === targetType);
  }, [currentType, rehearsals]);

  const handleOpenCreate = () => {
    if (!isAdmin) return;
    setEditingRehearsal(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (item: RehearsalRow) => {
    if (!isAdmin) return;
    setEditingRehearsal(item);
    setIsCreateModalOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateModalOpen(false);
    setEditingRehearsal(null);
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("确定要删除此排练日程吗？");
    if (!ok) return;

    const { error: attendError } = await supabase
      .from("attendances")
      .delete()
      .eq("rehearsal_id", id);

    if (attendError) {
      console.warn("[Schedule] 删除出勤记录失败：", attendError.message);
      alert("删除失败，请稍后重试。");
      return;
    }

    const { error: rehearsalError } = await supabase
      .from("rehearsals")
      .delete()
      .eq("id", id);

    if (rehearsalError) {
      console.warn("[Schedule] 删除日程失败：", rehearsalError.message);
      alert("删除失败，请稍后重试。");
      return;
    }

    alert("已删除该排练日程。");
    void fetchRehearsals();
  };

  const [attendanceMap, setAttendanceMap] = React.useState<
    Record<string, { status: string }>
  >({});
  const [codeModalRehearsal, setCodeModalRehearsal] =
    React.useState<RehearsalRow | null>(null);
  const [codeInput, setCodeInput] = React.useState("");
  const [codeSubmitting, setCodeSubmitting] = React.useState(false);
  const [codeError, setCodeError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user || user.role !== "member") return;
    if (!displayRehearsals.length) return;
    const ids = displayRehearsals.map((r) => r.id);
    const fetchAttendances = async () => {
      const { data, error } = await supabase
        .from("attendances")
        .select("*")
        .eq("user_id", user.id)
        .in("rehearsal_id", ids);

      if (error || !data) {
        console.warn("[Schedule] 加载签到记录失败：", error?.message);
        setAttendanceMap({});
        return;
      }

      const map: Record<number, { status: string }> = {};
      for (const row of data as { rehearsal_id: number; status: string }[]) {
        map[row.rehearsal_id] = { status: row.status };
      }
      setAttendanceMap(map);
    };

    void fetchAttendances();
  }, [user, displayRehearsals]);

  const handleMemberSign = async (rehearsal: RehearsalRow) => {
    if (!user || user.role !== "member") return;
    if (attendanceMap[rehearsal.id]) return;
    if (isRehearsalEnded(rehearsal.end_time)) return;

    if (rehearsal.type === "section") {
      const { data, error } = await supabase
        .from("attendances")
        .insert({
          user_id: user.id,
          rehearsal_id: rehearsal.id,
          status: "present",
        })
        .select()
        .single();

      if (error || !data) {
        console.warn("[Schedule] 分排签到失败：", error?.message);
        alert("签到失败，请稍后重试。");
        return;
      }

      setAttendanceMap((prev) => ({
        ...prev,
        [rehearsal.id]: { status: "present" },
      }));
      alert("签到成功！");
      return;
    }

    if (!rehearsal.sign_in_code) {
      alert("本次合排未配置签到码，请联系管理员。");
      return;
    }

    setCodeModalRehearsal(rehearsal);
    setCodeInput("");
    setCodeError(null);
  };

  const handleCodeConfirm = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || user.role !== "member") return;
    if (!codeModalRehearsal) return;
    if (codeSubmitting) return;

    if (!/^\d{4}$/.test(codeInput)) {
      setCodeError("请输入 4 位数字签到码");
      return;
    }

    if (codeInput !== codeModalRehearsal.sign_in_code) {
      setCodeError("签到码错误，请重新输入");
      return;
    }

    setCodeSubmitting(true);
    const { data, error } = await supabase
      .from("attendances")
      .insert({
        user_id: user.id,
        rehearsal_id: codeModalRehearsal.id,
        status: "present",
      })
      .select()
      .single();
    setCodeSubmitting(false);

    if (error || !data) {
      console.warn("[Schedule] 合排签到失败：", error?.message);
      setCodeError("签到失败，请稍后重试");
      return;
    }

    setAttendanceMap((prev) => ({
      ...prev,
      [codeModalRehearsal.id]: { status: "present" },
    }));
    alert("签到成功！");
    setCodeModalRehearsal(null);
    setCodeInput("");
    setCodeError(null);
  };

  const handleCloseCodeModal = () => {
    if (codeSubmitting) return;
    setCodeModalRehearsal(null);
    setCodeInput("");
    setCodeError(null);
  };

  const handleOpenManageAttendance = (rehearsal: RehearsalRow) => {
    setManageAttendanceModalRehearsal(rehearsal);
  };

  const handleCloseManageAttendanceModal = () => {
    if (manageAttendanceLoading) return;
    setManageAttendanceModalRehearsal(null);
  };

  return (

    <div className="space-y-6">

      {/* 顶部区域：与社区【公告板】一一对齐 */}
      <header className="mb-1">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">
              本周排练日程
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              查看乐团合排与分排安排
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm hover:bg-zinc-800"
            >
              ➕ 添加排练
            </button>
          )}
        </div>
        <div className="mt-2 flex justify-start">
          <div
            role="tablist"
            aria-label="排练类型"
            className="inline-flex rounded-full bg-zinc-100 p-1 text-xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={currentType === RehearsalType.FULL}
              onClick={() => setCurrentType(RehearsalType.FULL)}
              className={`min-w-[64px] rounded-full px-3 py-1 text-center transition-colors ${
                currentType === RehearsalType.FULL
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              合排
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={currentType === RehearsalType.SECTION}
              onClick={() => setCurrentType(RehearsalType.SECTION)}
              className={`min-w-[64px] rounded-full px-3 py-1 text-center transition-colors ${
                currentType === RehearsalType.SECTION
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              分排
            </button>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        {rehearsalsLoading && rehearsals.length === 0 && (
          <p className="py-6 text-center text-xs text-zinc-400">
            正在加载日程…
          </p>
        )}

        {!rehearsalsLoading &&
          displayRehearsals.map((item) => {
            const isExpired = isRehearsalEnded(
              item.end_time,
            );
            const hasSigned = !!attendanceMap[item.id];
            return (
              <article
                key={item.id}
                className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3 shadow-[0_1px_4px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 leading-tight">
                    <p className="text-sm text-zinc-500">
                      {item.repertoire}
                      {item.type === "section" && item.target_section
                        ? ` · ${item.target_section}`
                        : null}
                    </p>
                    <h2 className="text-base font-semibold text-zinc-900">
                      {formatRehearsalRange(item.start_time, item.end_time)}
                    </h2>
                    <p className="text-xs text-zinc-500">
                      地点：{item.location}
                      {item.type === "section" && item.target_section
                        ? ` · 针对：${item.target_section}`
                        : null}
                    </p>
                  </div>
                  {isAdmin ? (
                    <div className="flex flex-col items-end gap-1 text-[11px]">
                      {isExpired && (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500">
                          已结束
                        </span>
                      )}
                      {item.type === "full" && item.sign_in_code ? (
                        <span className="text-[10px] text-zinc-500">
                          密码: {item.sign_in_code}
                        </span>
                      ) : null}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="text-zinc-500 hover:text-blue-500"
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-zinc-400 hover:text-red-500"
                        >
                          删除
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenManageAttendance(item)}
                        className="text-zinc-600 hover:text-zinc-900"
                      >
                        ⚙️ 管理出勤
                      </button>
                    </div>
                   ) : (
                    <div className="flex items-center">
                      {hasSigned ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] text-emerald-600">
                          ✅ 已签到
                        </span>
                      ) : isExpired ? (
                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] text-zinc-400">
                          已结束
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMemberSign(item)}
                          className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm"
                        >
                          签到
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}

        {!rehearsalsLoading && displayRehearsals.length === 0 && (
          <p className="py-8 text-center text-xs text-zinc-500">
            暂无「{TYPE_LABEL[currentType]}」安排。
          </p>
        )}
      </section>

      {isAdmin && (
        <PublishRehearsalModal
          open={isCreateModalOpen}
          onClose={handleCloseCreate}
          onSuccess={() => {
            handleCloseCreate();
            fetchRehearsals();
          }}
          editingRehearsal={editingRehearsal}
        />
      )}

      <AttendanceManageModal
        rehearsal={manageAttendanceModalRehearsal}
        loading={manageAttendanceLoading}
        members={manageAttendanceMembers}
        statusByUserId={manageStatusByUserId}
        onStatusChange={(userId, status) =>
          setManageStatusByUserId((prev) => ({ ...prev, [userId]: status }))
        }
        saving={manageAttendanceSaving}
        onSave={handleManageSaveAttendance}
        onClose={handleCloseManageAttendanceModal}
      />

      {codeModalRehearsal && (
        <Modal
          title="输入签到码"
          onClose={handleCloseCodeModal}
          disabled={codeSubmitting}
        >
          <p className="mb-3 text-[11px] text-zinc-500">
            本次排练：{codeModalRehearsal.repertoire}
          </p>
          <form onSubmit={handleCodeConfirm}>
            <div className="space-y-1 text-xs">
              <label className="block text-[11px] font-medium text-zinc-600">
                四位数字签到码
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={codeInput}
                onChange={(e) => {
                  setCodeError(null);
                  setCodeInput(e.target.value);
                }}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 outline-none focus:border-zinc-400"
                placeholder="如：8848"
              />
              {codeError && (
                <p className="text-[11px] text-red-500">{codeError}</p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={handleCloseCodeModal}
                disabled={codeSubmitting}
                className="rounded-full px-4 py-1.5 text-[11px] text-zinc-500 hover:bg-zinc-100"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={codeSubmitting}
                className="rounded-full bg-zinc-900 px-4 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
              >
                {codeSubmitting ? "确认中…" : "确认签到"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

