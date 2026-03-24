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
    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <h2 className="text-base font-semibold text-zinc-900">写评论</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            placeholder="请输入标题"
            disabled={submitting}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            内容
          </label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            placeholder="写下你的评论..."
            disabled={submitting}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-60"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {submitting ? "发送中…" : "发送"}
          </button>
        </div>
      </form>
    </div>
  );
}