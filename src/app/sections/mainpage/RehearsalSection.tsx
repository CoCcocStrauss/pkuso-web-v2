"use client";

import React from "react";
import { useUser } from "@/context/UserContext";
import Modal from "@/components/ui/Modal";
import { PublishRehearsalModal } from "../../../components/modal/PublishRehearsalModal";
import { AttendanceManageModal } from "../../../components/modal/AttendanceManageModal";
import { isRehearsalEnded, formatRehearsalTimeRange, isDateInCurrentWeek } from "@/lib/utils";
import { useRehearsals } from "@/hooks/useRehearsals";
import { useAttendance } from "@/hooks/useAttendance";
import type { RehearsalRow } from "@/lib/types";
import { RehearsalType, REHEARSAL_TYPE_LABEL } from "@/lib/enums";

export function RehearsalSection() {
  const [currentType, setCurrentType] = React.useState<RehearsalType>(RehearsalType.FULL);
  const [showOnlyThisWeek, setShowOnlyThisWeek] = React.useState(true); // 默认显示本周
  const { rehearsals, rehearsalsLoading, fetchRehearsals, deleteRehearsal } = useRehearsals();
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
    handleMemberSignIn,
    fetchAttendancesByRehearsals,
  } = useAttendance(user?.id, isAdmin);

  React.useEffect(() => {
    void fetchRehearsals();
  }, [fetchRehearsals]);

  const displayRehearsals = React.useMemo(() => {
    const targetType = currentType;
    let filtered = rehearsals.filter((item) => item.type === targetType);
    
    // 如果启用了本周过滤，只显示本周的排练
    if (showOnlyThisWeek) {
      filtered = filtered.filter((item) => isDateInCurrentWeek(item.start_time ?? null));
    }
    
    return filtered;
  }, [currentType, rehearsals, showOnlyThisWeek]);

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


    const success = await deleteRehearsal(id);
    if (!success) {
      alert("删除失败，请稍后重试");
      return;
    }

    alert("已删除该排练日程");
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
      const map = await fetchAttendancesByRehearsals(ids);
      setAttendanceMap(map);
    };

    void fetchAttendances();
  }, [user, displayRehearsals, fetchAttendancesByRehearsals]);

  const handleMemberSign = async (rehearsal: RehearsalRow) => {
    if (!user || user.role !== "member") return;
    if (attendanceMap[rehearsal.id]) return;
    if (isRehearsalEnded(rehearsal.end_time)) return;

    if (rehearsal.type === RehearsalType.SECTION) {
      const success = await handleMemberSignIn(rehearsal);
      if (success) {
        setAttendanceMap((prev) => ({
          ...prev,
          [rehearsal.id]: { status: "present" },
        }));
        alert("签到成功");
      }
      return;
    }

    if (!rehearsal.sign_in_code) {
      alert("本次合排未配置签到码，请联系管理员");
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
      setCodeError("请输入4位数字签到码");
      return;
    }

    if (codeInput !== codeModalRehearsal.sign_in_code) {
      setCodeError("签到码错误，请重新输入");
      return;
    }

    setCodeSubmitting(true);
    const success = await handleMemberSignIn(codeModalRehearsal);
    setCodeSubmitting(false);

    if (success) {
      setAttendanceMap((prev) => ({
        ...prev,
        [codeModalRehearsal.id]: { status: "present" },
      }));
      alert("签到成功");
      setCodeModalRehearsal(null);
      setCodeInput("");
      setCodeError(null);
    } else {
      setCodeError("签到失败，请稍后重试");
    }
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
            <h1 className="text-lg font-semibold text-text-light dark:text-text">
              本周排练日程
            </h1>
            <p className="mt-1 text-xs text-text-light-secondary dark:text-text-secondary">
              查看乐团合排与分排安排
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-full bg-button-primary-light px-2.5 py-1 text-[11px] font-medium text-button-primary-text-light shadow-sm hover:bg-button-primary-light/90 dark:bg-button-primary dark:text-button-primary-text dark:hover:bg-button-primary/90"
            >
              添加排练
            </button>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div
            role="tablist"
            aria-label="排练类型"
            className="inline-flex rounded-full bg-background-light p-1 text-xs dark:bg-background-secondary"
          >
            <button
              type="button"
              role="tab"
              aria-selected={currentType === RehearsalType.FULL}
              onClick={() => setCurrentType(RehearsalType.FULL)}
              className={`min-w-[64px] rounded-full px-3 py-1 text-center transition-colors ${
                currentType === RehearsalType.FULL
                  ? "bg-button-primary-light text-button-primary-text-light shadow-sm dark:bg-button-primary dark:text-button-primary-text"
                  : "text-text-light-secondary hover:text-text-light dark:text-text-secondary dark:hover:text-text"
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
                  ? "bg-button-primary-light text-button-primary-text-light shadow-sm dark:bg-button-primary dark:text-button-primary-text"
                  : "text-text-light-secondary hover:text-text-light dark:text-text-secondary dark:hover:text-text"
              }`}
            >
              分排
            </button>
          </div>
          
          {/* 本周过滤切换按钮 */}
          <button
            type="button"
            onClick={() => setShowOnlyThisWeek(!showOnlyThisWeek)}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs transition-colors ${
              showOnlyThisWeek
                ? "bg-accent-light text-white dark:bg-accent dark:text-white"
                : "bg-background-light text-text-light-secondary dark:bg-background-secondary dark:text-text-secondary"
            }`}
          >
            {showOnlyThisWeek ? "本周" : "全部"}
          </button>
        </div>
      </header>

      <section className="space-y-3">
        {rehearsalsLoading && rehearsals.length === 0 && (
          <p className="py-6 text-center text-xs text-text-light-secondary dark:text-text-secondary">
            正在加载日程         </p>
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
                className="rounded-2xl border border-border-light bg-card-light p-3 shadow-[0_1px_4px_rgba(15,23,42,0.06)] dark:border-border dark:bg-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 leading-tight">
                    <p className="text-sm text-text-light-secondary dark:text-text-secondary">
                      {item.repertoire}
                      {item.type === "section" && item.target_section
                        ? ` · ${item.target_section}`
                        : null}
                    </p>
                    <h2 className="text-base font-semibold text-text-light dark:text-text">
                      {formatRehearsalTimeRange(item.start_time, item.end_time)}
                    </h2>
                    <p className="text-xs text-text-light-secondary dark:text-text-secondary">
                      地点：{item.location}
                      {item.type === "section" && item.target_section
                        ? ` · 针对{item.target_section}`
                        : null}
                    </p>
                  </div>
                  {isAdmin ? (
                    <div className="flex flex-col items-end gap-1 text-[11px]">
                      {isExpired && (
                        <span className="rounded-full bg-background-light px-2 py-0.5 text-[10px] text-text-light-secondary dark:bg-background dark:text-text-secondary">
                          已结束                      </span>
                      )}
                      {item.type === "full" && item.sign_in_code ? (
                        <span className="text-[10px] text-text-light-secondary dark:text-text-secondary">
                          密码: {item.sign_in_code}
                        </span>
                      ) : null}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="text-text-light-secondary hover:text-accent-light dark:text-text-secondary dark:hover:text-accent"
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-text-light-secondary hover:text-error-light dark:text-text-secondary dark:hover:text-error"
                        >
                          删除
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenManageAttendance(item)}
                        className="text-text-light-secondary hover:text-text-light dark:text-text-secondary dark:hover:text-text"
                      >
                        ⚙️ 管理出勤
                      </button>
                    </div>
                   ) : (
                    <div className="flex items-center">
                      {hasSigned ? (
                        <span className="rounded-full bg-success-light/10 px-3 py-1 text-[11px] text-success-light dark:bg-success/20 dark:text-success">
                          已签到                        </span>
                      ) : isExpired ? (
                        <span className="rounded-full bg-background-light px-3 py-1 text-[11px] text-text-light-secondary dark:bg-background-secondary dark:text-text-secondary">
                          已结束                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMemberSign(item)}
                          className="inline-flex items-center justify-center rounded-full border border-border-light bg-background-light px-3 py-1 text-xs font-medium text-text-light shadow-sm dark:border-border dark:bg-background-secondary dark:text-text"
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
          <p className="py-8 text-center text-xs text-text-light-secondary dark:text-text-secondary">
            暂无「{REHEARSAL_TYPE_LABEL[currentType]}」安排          </p>
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
          title="输入签到密码"
          onClose={handleCloseCodeModal}
          disabled={codeSubmitting}
        >
          <p className="mb-3 text-[11px] text-text-light-secondary dark:text-text-secondary">
            本次排练：{codeModalRehearsal.repertoire}
          </p>
          <form onSubmit={handleCodeConfirm}>
            <div className="space-y-1 text-xs">
              <label className="block text-[11px] font-medium text-text-light-secondary dark:text-text-secondary">
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
                className="w-full rounded-xl border border-border-light bg-form-light px-3 py-2 text-xs text-text-light outline-none focus:border-accent-light dark:border-border dark:bg-form dark:text-text dark:focus:border-accent"
                placeholder="如：8848"
              />
              {codeError && (
                <p className="text-[11px] text-error-light dark:text-error">{codeError}</p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={handleCloseCodeModal}
                disabled={codeSubmitting}
                className="rounded-full px-4 py-1.5 text-[11px] text-text-light-secondary hover:bg-background-light dark:text-text-secondary dark:hover:bg-background-secondary"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={codeSubmitting}
                className="rounded-full bg-button-primary-light px-4 py-1.5 text-[11px] font-medium text-button-primary-text-light shadow-sm hover:bg-button-primary-light/90 disabled:opacity-60 dark:bg-button-primary dark:text-button-primary-text dark:hover:bg-button-primary/90"
              >
                {codeSubmitting ? "确认中..." : "确认签到"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

