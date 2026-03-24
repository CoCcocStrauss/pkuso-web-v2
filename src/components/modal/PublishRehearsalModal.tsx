"use client";

import React from "react";
import { supabase } from "@/lib/supabase";
import { RehearsalRow } from "@/lib/types";
import { formatRehearsalRange } from "@/lib/utils";
import DatePicker from "react-datepicker";
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      const dateStr = formatRehearsalRange(
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
        className="relative w-full max-w-md rounded-3xl bg-white p-4 shadow-xl"
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">
            {editingRehearsal ? "编辑排练日程" : "发布排练日程"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] text-zinc-600 hover:bg-zinc-200"
          >
            取消
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-zinc-600">
              排练类型
            </label>
            <div className="inline-flex rounded-full bg-zinc-100 p-1 text-[11px]">
              <button
                type="button"
                onClick={() => handleChange("type", "full")}
                className={`min-w-[72px] rounded-full px-3 py-1 ${
                  form.type === "full"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600"
                }`}
              >
                合排
              </button>
              <button
                type="button"
                onClick={() => handleChange("type", "section")}
                className={`min-w-[72px] rounded-full px-3 py-1 ${
                  form.type === "section"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600"
                }`}
              >
                分排
              </button>
            </div>
          </div>

          {isSection && (
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-zinc-600">
                针对声部
              </label>
              <input
                type="text"
                value={form.target_section}
                onChange={(e) => handleChange("target_section", e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 outline-none focus:border-zinc-400"
                placeholder="如：第一小提琴 / 木管分排"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-zinc-600">
              开始时间
            </label>
            <DatePicker
              selected={form.start_time}
              onChange={(date: Date | null) => handleChange("start_time", date)}
              showTimeSelect
              timeIntervals={15}
              dateFormat="yyyy-MM-dd HH:mm"
              placeholderText="选择开始时间"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 outline-none focus:border-zinc-400"
              popperClassName="react-datepicker-popper-orchestra"
              calendarClassName="react-datepicker-orchestra"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-zinc-600">
              结束时间
            </label>
            <DatePicker
              selected={form.end_time}
              onChange={(date: Date | null) => handleChange("end_time", date)}
              showTimeSelect
              timeIntervals={15}
              dateFormat="yyyy-MM-dd HH:mm"
              placeholderText="选择结束时间（可选）"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 outline-none focus:border-zinc-400"
              popperClassName="react-datepicker-popper-orchestra"
              calendarClassName="react-datepicker-orchestra"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-zinc-600">
              排练地点
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 outline-none focus:border-zinc-400"
              placeholder="如：新太阳b108"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-zinc-600">
              排练曲目
            </label>
            <textarea
              value={form.repertoire}
              onChange={(e) => handleChange("repertoire", e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 outline-none focus:border-zinc-400"
              rows={2}
              placeholder="如：柴四第四乐章"
            />
          </div>

          {form.type === "full" && (
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-zinc-600">
                签到密码（4 位数字）
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={form.sign_in_code}
                onChange={(e) => handleChange("sign_in_code", e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 outline-none focus:border-zinc-400"
                placeholder="如：8848"
              />
            </div>
          )}

          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-zinc-700">
            <input
              type="checkbox"
              checked={notifyByEmail}
              onChange={(e) => setNotifyByEmail(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
            />
            同时发送邮件通知全团
          </label>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full px-4 py-1.5 text-[11px] text-zinc-500 hover:bg-zinc-100"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-zinc-900 px-4 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
          >
            {submitting ? (editingRehearsal ? "保存中…" : "发布中…") : editingRehearsal ? "保存" : "发布"}
          </button>
        </div>
      </form>
    </div>
  );
}

export type { CreateFormState, PublishRehearsalModalProps, DbRehearsalType };