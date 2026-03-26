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
    <div className="relative w-full max-w-md rounded-2xl bg-background p-6 shadow-xl dark:bg-background">
      <h2 className="text-base font-semibold text-text dark:text-text">写评论</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary dark:text-text-secondary">
            标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-border bg-form px-3 py-2 text-sm text-text outline-none focus:border-button-primary dark:border-border dark:bg-form dark:text-text"
            placeholder="请输入标题"
            disabled={submitting}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary dark:text-text-secondary">
            内容
          </label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-xl border border-border bg-form px-3 py-2 text-sm text-text outline-none focus:border-button-primary dark:border-border dark:bg-form dark:text-text"
            placeholder="写下你的评论..."
            disabled={submitting}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-text-secondary hover:bg-background/80 disabled:opacity-60 dark:border-border dark:bg-background dark:text-text-secondary"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-button-primary px-4 py-2 text-xs font-medium text-button-primary-text hover:bg-button-primary/90 disabled:opacity-60 dark:bg-button-primary dark:text-button-primary-text"
          >
            {submitting ? "发送中…" : "发送"}
          </button>
        </div>
      </form>
    </div>
  );
}
