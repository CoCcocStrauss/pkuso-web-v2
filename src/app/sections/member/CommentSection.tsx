"use client";

import React from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/context/UserContext";

type CommentSectionProps = {
  onClose: () => void;
};

export default function CommentSection({ onClose }: CommentSectionProps) {
  const { user } = useUser();
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent) {
      alert("请填写标题和内容");
      return;
    }

    if (!user?.id) {
      alert("用户信息异常，请重新登录");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({
      title: trimmedTitle,
      content: trimmedContent,
    });
    setSubmitting(false);

    if (error) {
      console.error("发布评论失败:", error);
      alert(`发布失败：${error.message}`);
      return;
    }

    alert("评论已发布，感谢您的反馈！");
    onClose();
  };

  return (
    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">写评论</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder="请输入标题"
            disabled={submitting}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            内容
          </label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder="写下你的评论..."
            disabled={submitting}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-blue-500 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500/90 disabled:opacity-60 dark:bg-blue-400 dark:text-slate-900"
          >
            {submitting ? "发送中…" : "发送"}
          </button>
        </div>
      </form>
    </div>
  );
}
