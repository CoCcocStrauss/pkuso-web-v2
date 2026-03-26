import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { ProfileRow } from "@/lib/types";

/**
 * 成员功能 Hook
 * 处理成员相关的功能：更新密码等
 *
 * @returns 成员功能相关的状态和方法
 */

export function useProfileMember() {
  const changePasswordMember = useCallback(async (password: string): Promise<boolean> => {
    const { error } = await supabase.auth.updateUser({ password: password });
    if (error) {
      console.warn("[useProfileMember] 更新密码失败：", error.message);
      return false;
    }
    return true;
  }, []);

  return {
    /** 更新密码的方法 */
    changePasswordMember,
  };
}
