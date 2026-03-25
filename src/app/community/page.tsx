"use client";

import React from "react";
import imageCompression from "browser-image-compression";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";
import { hasSectionText, formatPostAuthorLabel, formatDateTime} from "@/lib/utils";
import Toggle from "@/components/ui/Toggle";
import Modal from "@/components/ui/Modal";
import { PostRow } from "@/lib/types";
import { PostType, POST_TYPE_LABEL } from "@/lib/enums";
import { usePosts } from "@/hooks/usePosts";

type FormState = {
  title: string;
  content: string;
  type: PostType;
  contact_info: string;
  current_sections: string;
  missing_sections: string;
  image_file: File | null;
};

interface CommunityPageProps {
  onDelete:() => void;
}


export default function CommunityPage( { onDelete }: CommunityPageProps) {
  const { user } = useUser();
  const { posts, loading, fetchPosts, createPost, updatePost, deletePost } = usePosts();
  const [view, setView] = React.useState<PostType>(PostType.ENSEMBLE);
  const [detailPost, setDetailPost] = React.useState<PostRow | null>(null);
  const [publishOpen, setPublishOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>({
    title: "",
    content: "",
    type: PostType.ENSEMBLE,
    contact_info: "",
    current_sections: "",
    missing_sections: "",
    image_file: null,
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  const postList = React.useMemo(
    () => posts.filter((p) => p.type === view),
    [posts, view],
  );

  const openPublish = (initial?: PostRow) => {
    if (initial) {
      setEditId(initial.id);
      setForm({
        title: initial.title ?? "",
        content: initial.content ?? "",
        type: initial.type,
        contact_info: initial.contact_info ?? "",
        current_sections: initial.current_sections ?? "",
        missing_sections: initial.missing_sections ?? "",
        image_file: null,
      });
      setImagePreviewUrl(initial.image_url ?? null);
    } else {
      setEditId(null);
      setForm({
        title: "",
        content: "",
        type: PostType.ENSEMBLE,
        contact_info: "",
        current_sections: "",
        missing_sections: "",
        image_file: null,
      });
      setImagePreviewUrl(null);
    }
    setPublishOpen(true);
  };

  const closePublish = () => {
    if (submitting) return;
    setPublishOpen(false);
    setEditId(null);
    setForm({
      title: "",
      content: "",
      type: PostType.ENSEMBLE,
      contact_info: "",
      current_sections: "",
      missing_sections: "",
      image_file: null,
    });
    setImagePreviewUrl(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, image_file: file }));
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.title.trim()) {
      alert("请填写标题。");
      return;
    }
    if (!form.contact_info.trim()) {
      alert("请填写联系方式（微信号或手机号）。");
      return;
    }

    setSubmitting(true);
    let imageUrl: string | null = null;
    if (form.image_file) {
      let fileToUpload: File = form.image_file;
      try {
        const options = {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        };
        fileToUpload = await imageCompression(form.image_file, options);
      } catch (err) {
        console.warn("[Community] 图片压缩失败，使用原图上传：", err);
      }
      const path = `${user?.id ?? "anon"}/${Date.now()}-${fileToUpload.name}`;
      const { error: uploadError } = await supabase.storage
        .from("community-images")
        .upload(path, fileToUpload, { upsert: false });
      if (uploadError) {
        console.warn("[Community] 图片上传失败：", uploadError.message);
        alert("图片上传失败，请重试。");
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("community-images")
        .getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    } else if (editId && imagePreviewUrl && imagePreviewUrl.startsWith("http")) {
      imageUrl = imagePreviewUrl;
    }

    if (editId) {
      const success = await updatePost(editId, {
        title: form.title.trim(),
        content: form.content.trim() || null,
        type: form.type,
        contact_info: form.contact_info.trim(),
        current_sections: form.type === "ensemble" ? form.current_sections.trim() || null : undefined,
        missing_sections: form.type === "ensemble" ? form.missing_sections.trim() || null : undefined,
        image_url: imageUrl ?? null,
      });
      setSubmitting(false);
      if (!success) {
        alert("更新失败，请重试。");
        return;
      }
      alert("已更新。");
    } else {
      if (!user) {
        alert("请先登录。");
        setSubmitting(false);
        return;
      }
      const success = await createPost({
        author_id: user.id,
        title: form.title.trim(),
        type: form.type,
        content: form.content.trim() || null,
        contact_info: form.contact_info.trim(),
        current_sections: form.type === "ensemble" ? form.current_sections.trim() || null : undefined,
        missing_sections: form.type === "ensemble" ? form.missing_sections.trim() || null : undefined,
        image_url: imageUrl ?? null,
      });
      setSubmitting(false);
      if (!success) {
        alert("发布失败，请重试。");
        return;
      }
      alert("发布成功！");
    }
    closePublish();
    void fetchPosts();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("确定要删除这条公告吗？")) return;
    const success = await deletePost(id);
    if (!success) {
      alert("删除失败，请重试。");
      return;
    }
    setDetailPost(null);
    alert("已删除。");  
    onDelete?.();
    void fetchPosts();
  };

  const handleSaveQr = (imageUrl: string) => {
    window.open(imageUrl, "_blank");
    alert("请在新窗口中长按图片保存。");
  };

  return (
    <div className="space-y-4">
      <header className="mb-1">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">公告板</h1>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">重奏与团建信息</p>
          </div>
          <button
            type="button"
            onClick={() => openPublish()}
            className="rounded-full bg-blue-500 px-3 py-1 text-[11px] font-medium text-black shadow-sm hover:bg-blue-500/90 dark:bg-blue-400 dark:text-slate-900 dark:hover:bg-blue-400/90"
          >
            发布公告
          </button>
        </div>
        <div className="mt-2">
          <Toggle
            options={[
              { value: "ensemble", label: POST_TYPE_LABEL[PostType.ENSEMBLE] },
              { value: "gathering", label: POST_TYPE_LABEL[PostType.GATHERING] },
            ]}
            value={view}
            onChange={(v) => setView(v as PostType)}
          />
        </div>
      </header>

      <section className="space-y-3">
        {loading && posts.length === 0 && (
          <p className="py-6 text-center text-xs text-slate-600 dark:text-slate-400">
            正在加载…
          </p>
        )}
        {!loading &&
          postList.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 shadow-[0_1px_4px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900/70"
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setDetailPost(post)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {post.title}
                    </h2>
                    <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {POST_TYPE_LABEL[post.type]}
                      {formatDateTime(post.created_at, "yyyy-MM-dd HH:mm") && ` · ${formatDateTime(post.created_at, "yyyy-MM-dd HH:mm")}`}
                    </p>
                    {post.type === "ensemble" &&
                      hasSectionText(post.missing_sections) && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                          缺：{post.missing_sections!.trim()}
                        </span>
                      </div>
                    )}
                    {post.content != null && post.content.trim() !== "" && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                        {post.content}
                      </p>
                    )}
                  </div>
                </div>
              </button>
              { (user?.id === post.author_id || user?.role == "admin") && (
                <div className="mt-2 flex gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPublish(post);
                    }}
                    className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(post.id);
                    }}
                    className="text-slate-600 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400"
                  >
                    删除
                  </button>
                </div>
              )}
            </article>
          ))}
        {!loading && postList.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-600 dark:text-slate-400">
            暂无「{POST_TYPE_LABEL[view]}」公告。
          </p>
        )}
      </section>

      {detailPost && (
        <DetailModal
          post={detailPost}
          onClose={() => setDetailPost(null)}
          onSaveQr={handleSaveQr}
        />
      )}

      {publishOpen && (
        <PublishModal
          form={form}
          setForm={setForm}
          imagePreviewUrl={imagePreviewUrl}
          onImageChange={handleImageChange}
          submitting={submitting}
          editId={editId}
          onClose={closePublish}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

function DetailModal({
  post,
  onClose,
  onSaveQr,
}: {
  post: PostRow;
  onClose: () => void;
  onSaveQr: (url: string) => void;
}) {
  const author = formatPostAuthorLabel(post);
  const showCurrent = post.type === "ensemble" && hasSectionText(post.current_sections);
  const showMissing = post.type === "ensemble" && hasSectionText(post.missing_sections);

  const copyContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post.contact_info) return;
    navigator.clipboard.writeText(post.contact_info).then(
      () => alert("复制成功！"),
      () => alert("复制失败，请手动复制"),
    );
  };

  return (
    <Modal
      title={post.title}
      onClose={onClose}
      className="max-h-[85vh] overflow-hidden flex flex-col"
    >
      <p className="text-[11px] text-slate-600 dark:text-slate-400 flex-shrink-0">
        {POST_TYPE_LABEL[post.type]} · {author}
      </p>
      {(showCurrent || showMissing) && (
        <div className="mt-2 flex flex-wrap gap-1.5 flex-shrink-0">
          {showCurrent && (
            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              已有：{post.current_sections!.trim()}
            </span>
          )}
          {showMissing && (
            <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              缺：{post.missing_sections!.trim()}
            </span>
          )}
        </div>
      )}
      <div className="mt-2 overflow-y-auto flex-1 space-y-3 text-xs text-slate-600 dark:text-slate-400">
        {post.content != null && post.content.trim() !== "" && (
          <p className="whitespace-pre-line leading-relaxed">{post.content}</p>
        )}
        {post.contact_info && (
          <div className="rounded-2xl bg-slate-100 p-3 flex items-center justify-between gap-2 dark:bg-slate-800">
            <div>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">联系方式</p>
              <p className="text-xs text-slate-900 dark:text-slate-100">{post.contact_info}</p>
            </div>
            <button
              type="button"
              onClick={copyContact}
              className="relative z-10 cursor-pointer rounded-full bg-blue-500 px-3 py-1.5 text-[11px] font-medium text-white shrink-0 dark:bg-blue-400 dark:text-slate-900"
            >
              一键复制
            </button>
          </div>
        )}
        {post.image_url && (
          <div className="space-y-2">
            <img
              src={post.image_url}
              alt="二维码或配图"
              className="rounded-2xl border border-slate-200 max-w-full h-auto max-h-64 object-contain dark:border-slate-700"
            />
            <button
              type="button"
              onClick={() => onSaveQr(post.image_url!)}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/80"
            >
              保存二维码
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function PublishModal({
  form,
  setForm,
  imagePreviewUrl,
  onImageChange,
  submitting,
  editId,
  onClose,
  onSubmit,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  imagePreviewUrl: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  submitting: boolean;
  editId: string | null;
  onClose: () => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
}) {
  return (
    <Modal
      title={editId ? "编辑公告" : "发布公告"}
      onClose={onClose}
      disabled={submitting}
      className="max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={onSubmit}>
        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
              类型
            </label>
            <div className="inline-flex rounded-full bg-slate-100 p-1 text-[11px] dark:bg-slate-800">
              {(["ensemble", "gathering"] as PostType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`min-w-[64px] rounded-full px-3 py-1 ${
                    form.type === t ? "bg-blue-500 text-white dark:bg-blue-400 dark:text-slate-900" : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {POST_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
              联系方式 <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.contact_info}
              onChange={(e) => setForm((f) => ({ ...f, contact_info: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="微信号或手机号"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
              标题
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="请输入标题"
            />
          </div>
          {form.type === "ensemble" && (
            <>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  已有声部
                </label>
                <input
                  type="text"
                  value={form.current_sections}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, current_sections: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="如：长笛、单簧管"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  需要声部
                </label>
                <input
                  type="text"
                  value={form.missing_sections}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, missing_sections: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="如：双簧管、大管"
                />
              </div>
            </>
          )}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
              内容
            </label>
            <textarea
              value={form.content ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              rows={4}
              placeholder="请输入内容"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
              图片（如微信二维码）
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={onImageChange}
              className="w-full text-[11px] text-slate-600 file:mr-2 file:rounded-full file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-xs dark:text-slate-400 dark:file:bg-slate-800 dark:file:text-slate-400"
            />
            {imagePreviewUrl && (
              <img
                src={imagePreviewUrl}
                alt="预览"
                className="mt-2 rounded-2xl border border-slate-200 max-w-full h-auto max-h-32 object-contain dark:border-slate-700"
              />
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full px-4 py-1.5 text-[11px] text-slate-600 dark:text-slate-400"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-blue-500 px-4 py-1.5 text-[11px] font-medium text-white disabled:opacity-60 dark:bg-blue-400 dark:text-slate-900"
          >
            {submitting ? "提交中…" : editId ? "保存" : "发布"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
