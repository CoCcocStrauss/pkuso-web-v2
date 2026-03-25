import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { PostRow } from "@/lib/types";
import { PostType } from "@/lib/enums";

/**
 * 帖子管理 Hook
 * 负责获取和管理社区帖子数据
 *
 * @returns 帖子相关的状态和方法
 */
export function usePosts() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * 获取所有帖子
   * 按创建时间降序排列
   */
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select(
        "id, created_at, author_id, title, type, content, is_active, current_sections, missing_sections, contact_info, image_url, profiles!inner(full_name, instrument)",
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[usePosts] 加载帖子失败：", error.message);
      setPosts([]);
      setLoading(false);
      return;
    }

    const normalized: PostRow[] = (data as any[])
      ?.map((row) => ({
        id: row.id,
        title: row.title,
        type: row.type,
        content: row.content,
        image_url: row.image_url,
        author_id: row.author_id,
        created_at: row.created_at,
        contact_info: row.contact_info,
        current_sections: row.current_sections,
        missing_sections: row.missing_sections,
        _section: null,
        profiles: row.profiles 
          ? {
              full_name: row.profiles.full_name,
              instrument: row.profiles.instrument
            }
          : null,
      })) ?? [];

    setPosts(normalized);
    setLoading(false);
  }, []);

  /**
   * 创建帖子
   * @param postData 帖子数据
   * @returns 是否创建成功
   */
  const createPost = useCallback(async (postData: {
    author_id: string;
    title: string;
    type: PostType;
    content: string | null;
    contact_info: string;
    current_sections?: string | null;
    missing_sections?: string | null;
    image_url?: string | null;
  }): Promise<boolean> => {
    const { error } = await supabase.from("posts").insert({
      author_id: postData.author_id,
      title: postData.title.trim(),
      type: postData.type,
      content: postData.content?.trim() || null,
      contact_info: postData.contact_info.trim(),
      current_sections: postData.type === "ensemble" ? (postData.current_sections?.trim() || null) : null,
      missing_sections: postData.type === "ensemble" ? (postData.missing_sections?.trim() || null) : null,
      image_url: postData.image_url ?? null,
    });

    if (error) {
      console.warn("[usePosts] 创建帖子失败：", error.message);
      return false;
    }
    return true;
  }, []);

  /**
   * 更新帖子
   * @param id 帖子 ID
   * @param postData 帖子数据
   * @returns 是否更新成功
   */
  const updatePost = useCallback(async (id: string, postData: {
    title?: string;
    type?: PostType;
    content?: string | null;
    contact_info?: string;
    current_sections?: string | null;
    missing_sections?: string | null;
    image_url?: string | null;
  }): Promise<boolean> => {
    const payload: Record<string, unknown> = {};
    
    if (postData.title !== undefined) payload.title = postData.title.trim();
    if (postData.type !== undefined) payload.type = postData.type;
    if (postData.content !== undefined) payload.content = postData.content?.trim() || null;
    if (postData.contact_info !== undefined) payload.contact_info = postData.contact_info.trim();
    if (postData.current_sections !== undefined) payload.current_sections = postData.current_sections?.trim() || null;
    if (postData.missing_sections !== undefined) payload.missing_sections = postData.missing_sections?.trim() || null;
    if (postData.image_url !== undefined) payload.image_url = postData.image_url ?? null;

    const { error } = await supabase
      .from("posts")
      .update(payload)
      .eq("id", id);

    if (error) {
      console.warn("[usePosts] 更新帖子失败：", error.message);
      return false;
    }
    return true;
  }, []);

  /**
   * 删除帖子
   * @param id 帖子 ID
   * @returns 是否删除成功
   */
  const deletePost = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      console.warn("[usePosts] 删除帖子失败：", error.message);
      return false;
    }
    return true;
  }, []);

  return {
    /** 帖子列表 */
    posts,
    /** 帖子加载状态 */
    loading,
    /** 获取帖子数据的方法 */
    fetchPosts,
    /** 创建帖子的方法 */
    createPost,
    /** 更新帖子的方法 */
    updatePost,
    /** 删除帖子的方法 */
    deletePost,
  };
}
