"use client";

import React from "react";
import { supabase } from "@/lib/supabase";
import { RehearsalRow } from "@/lib/types";
import { formatRehearsalTimeRange } from "@/lib/utils";
import { DatePicker, registerLocale } from "react-datepicker";
import { zhCN } from "date-fns/locale/zh-CN";  // 注意是从 date-fns 导入
registerLocale("zh-cn", zhCN);
import "react-datepicker/dist/react-datepicker.css";

type DbRehearsalType = "full" | "section";

type CreateFormState = {
  type: DbRehearsalType;
  target_section: string;
  start_time: Date | null;
  end_time: Date | null;
  location: string;
  repertoire: string;
  sign_in_code: string;
};

type PublishRehearsalModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingRehearsal?: RehearsalRow | null;
};

export function PublishRehearsalModal({
  open,
  onClose,
  onSuccess,
  editingRehearsal,
}: PublishRehearsalModalProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [notifyByEmail, setNotifyByEmail] = React.useState(false);
  const [form, setForm] = React.useState<CreateFormState>({
    type: "full",
    target_section: "",
    start_time: null,
    end_time: null,
    location: "",
    repertoire: "",
    sign_in_code: "",
  });

  React.useEffect(() => {
    if (editingRehearsal) {
      const startDate = new Date(editingRehearsal.start_time?? "");
      const endDate = editingRehearsal.end_time ? new Date(editingRehearsal.end_time) : null;
      setForm({
        type: editingRehearsal.type?? "full",
        target_section: editingRehearsal.target_section ?? "",
        start_time: Number.isNaN(startDate.getTime()) ? null : startDate,
        end_time: endDate && !Number.isNaN(endDate.getTime()) ? endDate : null,
        location: editingRehearsal.location ?? "",
        repertoire: editingRehearsal.repertoire ?? "",
        sign_in_code: editingRehearsal.sign_in_code ?? "",
      });
    } else {
      setForm({
        type: "full",
        target_section: "",
        start_time: null,
        end_time: null,
        location: "",
        repertoire: "",
        sign_in_code: "",
      });
    }
    setNotifyByEmail(false);
  }, [editingRehearsal, open]);

  const handleChange = (
    field: keyof CreateFormState,
    value: string | DbRehearsalType | Date | null,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    if (!form.start_time || !form.location || !form.repertoire) {
      alert("请填写完整的时间、地点和曲目信息。");
      return;
    }

    if (form.type === "full") {
      if (!form.sign_in_code) {
        alert("合排需要设置签到密码。");
        return;
      }
      if (!/^\d{4}$/.test(form.sign_in_code)) {
        alert("签到密码需要是 4 位数字，例如 8848。");
        return;
      }
    }

    setSubmitting(true);
    const payload = {
      type: form.type,
      target_section: form.type === "section" ? form.target_section || null : null,
      start_time: form.start_time.toISOString(),
      end_time: form.end_time ? form.end_time.toISOString() : null,
      location: form.location,
      repertoire: form.repertoire,
      sign_in_code: form.type === "full" ? form.sign_in_code : null,
    };

    if (editingRehearsal) {
      const { error } = await supabase
        .from("rehearsals")
        .update(payload)
        .eq("id", editingRehearsal.id);
      if (error) {
        setSubmitting(false);
        console.warn("[Schedule] 更新日程失败：", error.message);
        alert("更新失败，请稍后重试。");
        return;
      }
    } else {
      const { error } = await supabase.from("rehearsals").insert([payload]);
      if (error) {
        setSubmitting(false);
        console.warn("[Schedule] 发布新日程失败：", error.message);
        alert("发布失败，请稍后重试。");
        return;
      }
    }

    if (notifyByEmail) {
      const dateStr = formatRehearsalTimeRange(
        form.start_time.toISOString(),
        form.end_time ? form.end_time.toISOString() : null,
      );
      let ok = false;
      try {
        const res = await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.repertoire,
            dateStr,
            location: form.location,
          }),
        });
        ok = res.ok;
      } catch (err) {
        ok = false;
      }
      alert(
        ok
          ? "✅ 排练已发布！邮件通知已成功发送至全团！"
          : "❌ 邮件发送失败，请检查控制台。",
      );
    } else {
      alert(editingRehearsal ? "已保存。" : "发布成功！");
    }

    setSubmitting(false);
    onClose();
    onSuccess();
  };

  if (!open) return null;

  const isSection = form.type === "section";

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 px-4 pb-safe">
      <button
        aria-label="关闭发布日程弹窗"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
        disabled={submitting}
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-3xl bg-white p-4 shadow-xl dark:bg-background"
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text dark:text-text">
            {editingRehearsal ? "编辑排练日程" : "发布排练日程"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full bg-background-secondary px-3 py-1 text-[11px] text-text-secondary hover:bg-background-secondary/80 dark:bg-background-secondary dark:text-text-secondary dark:hover:bg-background-secondary/80"
          >
            取消
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-text-secondary dark:text-text-secondary">
              排练类型
            </label>
            <div className="inline-flex rounded-full bg-background-secondary p-1 text-[11px] dark:bg-background-secondary">
              <button
                type="button"
                onClick={() => handleChange("type", "full")}
                className={`min-w-[72px] rounded-full px-3 py-1 ${
                  form.type === "full"
                    ? "bg-button-primary text-button-primary-text dark:bg-button-primary dark:text-button-primary-text"
                    : "text-text-secondary dark:text-text-secondary"
                }`}
              >
                合排
              </button>
              <button
                type="button"
                onClick={() => handleChange("type", "section")}
                className={`min-w-[72px] rounded-full px-3 py-1 ${
                  form.type === "section"
                    ? "bg-button-primary text-button-primary-text dark:bg-button-primary dark:text-button-primary-text"
                    : "text-text-secondary dark:text-text-secondary"
                }`}
              >
                分排
              </button>
            </div>
          </div>

          {isSection && (
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-text-secondary dark:text-text-secondary">
                针对声部
              </label>
              <input
                type="text"
                value={form.target_section}
                onChange={(e) => handleChange("target_section", e.target.value)}
                className="w-full rounded-xl border border-border bg-form px-3 py-2 text-xs text-text outline-none focus:border-border/80 dark:border-border dark:bg-form dark:text-text"
                placeholder="如：第一小提琴 / 木管分排"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-text-secondary dark:text-text-secondary">
              开始时间
            </label>
            <DatePicker
              selected={form.start_time}
              onChange={(date: Date | null) => handleChange("start_time", date)}
              showTimeSelect
              timeIntervals={15}
              dateFormat="yyyy 年 MM 月 dd 日 HH:mm"
              placeholderText="选择开始时间"
              className="w-104 rounded-xl border border-border bg-form px-3 py-2 text-xs text-text outline-none focus:border-border/80 dark:border-border dark:bg-form dark:text-text"
              popperClassName="react-datepicker-popper-orchestra"
              locale="zh-cn"
              calendarClassName="react-datepicker-orchestra"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-text-secondary dark:text-text-secondary">
              结束时间
            </label>
            <DatePicker
              selected={form.end_time}
              onChange={(date: Date | null) => handleChange("end_time", date)}
              showTimeSelect
              timeIntervals={15}
              dateFormat="yyyy 年 MM 月 dd 日 HH:mm"
              placeholderText="选择结束时间（可选）"
              className="w-104 rounded-xl border border-border bg-form px-3 py-2 text-xs text-text outline-none focus:border-border/80 dark:border-border dark:bg-form dark:text-text"
              popperClassName="react-datepicker-popper-orchestra"
              locale="zh-cn"
              calendarClassName="react-datepicker-orchestra"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-text-secondary dark:text-text-secondary">
              排练地点
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className="w-full rounded-xl border border-border bg-form px-3 py-2 text-xs text-text outline-none focus:border-border/80 dark:border-border dark:bg-form dark:text-text"
              placeholder="如：新太阳 b108"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-text-secondary dark:text-text-secondary">
              排练曲目
            </label>
            <textarea
              value={form.repertoire}
              onChange={(e) => handleChange("repertoire", e.target.value)}
              className="w-full rounded-xl border border-border bg-form px-3 py-2 text-xs text-text outline-none focus:border-border/80 dark:border-border dark:bg-form dark:text-text"
              rows={2}
              placeholder="如：柴四第四乐章"
            />
          </div>

          {form.type === "full" && (
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-text-secondary dark:text-text-secondary">
                签到密码（4 位数字）
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={form.sign_in_code}
                onChange={(e) => handleChange("sign_in_code", e.target.value)}
                className="w-full rounded-xl border border-border bg-form px-3 py-2 text-xs text-text outline-none focus:border-border/80 dark:border-border dark:bg-form dark:text-text"
                placeholder="如：8848"
              />
            </div>
          )}

          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-text-secondary dark:text-text-secondary">
            <input
              type="checkbox"
              checked={notifyByEmail}
              onChange={(e) => setNotifyByEmail(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 rounded border-border text-button-primary focus:ring-border/80 dark:border-border dark:bg-form dark:text-button-primary"
            />
            同时发送邮件通知全团
          </label>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full px-4 py-1.5 text-[11px] text-text-secondary hover:bg-background-secondary dark:text-text-secondary dark:hover:bg-background-secondary"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-button-primary px-4 py-1.5 text-[11px] font-medium text-button-primary-text shadow-sm hover:bg-button-primary/90 disabled:opacity-60 dark:bg-button-primary dark:text-button-primary-text dark:hover:bg-button-primary/90"
          >
            {submitting ? (editingRehearsal ? "保存中…" : "发布中…") : editingRehearsal ? "保存" : "发布"}
          </button>
        </div>
      </form>
    </div>
  );
}

export type { CreateFormState, PublishRehearsalModalProps, DbRehearsalType };
