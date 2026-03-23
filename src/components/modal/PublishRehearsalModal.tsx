import React from "react";
import { supabase } from "@/lib/supabase";

/**
 * 发布排练模态框组件属性接口
 */
interface PublishRehearsalModalProps {
  /** 是否显示模态框 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 发布成功回调 */
  onSuccess: () => void;
}

/**
 * 表单状态类型
 */
type FormState = {
  /** 排练类型 */
  rehearsalType: "全团合排" | "声部分排";
  /** 排练日期 */
  date: string;
  /** 开始时间 */
  time: string;
  /** 结束时间 */
  endTime: string;
  /** 排练地点 */
  location: string;
  /** 排练曲目 */
  repertoire: string;
};

/**
 * 发布排练模态框组件
 * 管理员用于发布新的排练日程的表单模态框
 *
 * @param props 组件属性
 * @returns 发布排练模态框组件
 */
export function PublishRehearsalModal({ open, onClose, onSuccess }: PublishRehearsalModalProps) {
  const [publishing, setPublishing] = React.useState(false);
  const [form, setForm] = React.useState<FormState>({
    rehearsalType: "全团合排",
    date: "",
    time: "",
    endTime: "",
    location: "",
    repertoire: "",
  });

  /**
   * 处理表单提交
   * 验证表单数据并向数据库插入新的排练记录
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (publishing) return;

    const startTime = (form.time ?? "").trim();
    const endTime = (form.endTime ?? "").trim();

    if (
      !form.date ||
      !startTime ||
      !endTime ||
      !form.location.trim() ||
      !form.repertoire.trim()
    ) {
      alert("请填写完整的排练信息。");
      return;
    }

    const dateOnly = String(form.date).trim().slice(0, 10);
    const payload = {
      title: form.rehearsalType,
      date: dateOnly,
      start_time: startTime,
      end_time: endTime,
      location: form.location.trim(),
      repertoire: form.repertoire.trim(),
    };

    setPublishing(true);
    const { error } = await supabase.from("rehearsals").insert([payload]);
    setPublishing(false);

    if (error) {
      console.error("[Home] 发布排练失败：", error);
      alert(`发布失败：${error.message}`);
      return;
    }

    setForm({
      rehearsalType: "全团合排",
      date: "",
      time: "",
      endTime: "",
      location: "",
      repertoire: "",
    });
    onClose();
    onSuccess();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-modal-title"
    >
      <button
        type="button"
        aria-label="关闭"
        className="absolute inset-0"
        onClick={() => {
          if (publishing) return;
          onClose();
        }}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl max-h-[85vh] overflow-y-auto p-4 pb-5">
        <div className="mb-2 flex items-center justify-between">
          <h2
            id="publish-modal-title"
            className="text-sm font-semibold text-zinc-900"
          >
            发布新日程
          </h2>
          <button
            type="button"
            disabled={publishing}
            onClick={onClose}
            className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] text-zinc-600 hover:bg-zinc-200 disabled:opacity-50"
          >
            关闭
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-2 space-y-3">
          <div className="flex gap-3">
            <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-zinc-800">
              <input
                type="radio"
                name="rehearsalType"
                checked={form.rehearsalType === "全团合排"}
                onChange={() =>
                  setForm((p) => ({ ...p, rehearsalType: "全团合排" }))
                }
                className="text-zinc-900"
              />
              全团合排
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-zinc-800">
              <input
                type="radio"
                name="rehearsalType"
                checked={form.rehearsalType === "声部分排"}
                onChange={() =>
                  setForm((p) => ({ ...p, rehearsalType: "声部分排" }))
                }
                className="text-zinc-900"
              />
              声部分排
            </label>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-zinc-600">
              日期
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-zinc-600">
                开始时间
              </label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-zinc-600">
                结束时间
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-zinc-600">
              地点
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              placeholder="例如：音乐厅"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-zinc-600">
              曲目
            </label>
            <input
              type="text"
              value={form.repertoire}
              onChange={(e) => setForm((p) => ({ ...p, repertoire: e.target.value }))}
              placeholder="例如：贝多芬第五交响曲"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            />
          </div>

          <button
            type="submit"
            disabled={publishing}
            className="mt-4 w-full rounded-full bg-zinc-900 py-3 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
          >
            {publishing ? "发布中…" : "发布日程"}
          </button>
        </form>
      </div>
    </div>
  );
}
  const [publishing, setPublishing] = React.useState(false);
  const [form, setForm] = React.useState<FormState>({
    rehearsalType: "全团合排",
    date: "",
    time: "",
    endTime: "",
    location: "",
    repertoire: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (publishing) return;

    const startTime = (form.time ?? "").trim();
    const endTime = (form.endTime ?? "").trim();

    if (
      !form.date ||
      !startTime ||
      !endTime ||
      !form.location.trim() ||
      !form.repertoire.trim()
    ) {
      alert("请填写完整的排练信息。");
      return;
    }

    const dateOnly = String(form.date).trim().slice(0, 10);
    const payload = {
      title: form.rehearsalType,
      date: dateOnly,
      start_time: startTime,
      end_time: endTime,
      location: form.location.trim(),
      repertoire: form.repertoire.trim(),
    };

    setPublishing(true);
    const { error } = await supabase.from("rehearsals").insert([payload]);
    setPublishing(false);

    if (error) {
      console.error("[Home] 发布排练失败：", error);
      alert(`发布失败：${error.message}`);
      return;
    }

    setForm({
      rehearsalType: "全团合排",
      date: "",
      time: "",
      endTime: "",
      location: "",
      repertoire: "",
    });
    onClose();
    onSuccess();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-modal-title"
    >
      <button
        type="button"
        aria-label="关闭"
        className="absolute inset-0"
        onClick={() => {
          if (publishing) return;
          onClose();
        }}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl max-h-[85vh] overflow-y-auto p-4 pb-5">
        <div className="mb-2 flex items-center justify-between">
          <h2
            id="publish-modal-title"
            className="text-sm font-semibold text-zinc-900"
          >
            发布新日程
          </h2>
          <button
            type="button"
            disabled={publishing}
            onClick={onClose}
            className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] text-zinc-600 hover:bg-zinc-200 disabled:opacity-50"
          >
            关闭
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-2 space-y-3">
          <div className="flex gap-3">
            <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-zinc-800">
              <input
                type="radio"
                name="rehearsalType"
                checked={form.rehearsalType === "全团合排"}
                onChange={() =>
                  setForm((p) => ({ ...p, rehearsalType: "全团合排" }))
                }
                className="text-zinc-900"
              />
              全团合排
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-zinc-800">
              <input
                type="radio"
                name="rehearsalType"
                checked={form.rehearsalType === "声部分排"}
                onChange={() =>
                  setForm((p) => ({ ...p, rehearsalType: "声部分排" }))
                }
                className="text-zinc-900"
              />
              声部分排
            </label>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-zinc-600">
              日期
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-zinc-600">
                开始时间
              </label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-zinc-600">
                结束时间
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-zinc-600">
              地点
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              placeholder="例如：音乐厅"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-zinc-600">
              曲目
            </label>
            <input
              type="text"
              value={form.repertoire}
              onChange={(e) => setForm((p) => ({ ...p, repertoire: e.target.value }))}
              placeholder="例如：贝多芬第五交响曲"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            />
          </div>

          <button
            type="submit"
            disabled={publishing}
            className="mt-4 w-full rounded-full bg-zinc-900 py-3 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
          >
            {publishing ? "发布中…" : "发布日程"}
          </button>
        </form>
      </div>
    </div>
  );
}