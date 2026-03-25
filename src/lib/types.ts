/**
 * Shared types for the orchestra management application
 * 包含应用中使用的所有共享类型定义
 */

import { AttendanceStatus, ProfileStatus, PostType, RehearsalType, ProfileRole } from "./enums";

/**
 * Supabase 数据表对应的类型定义
 * 这些类型与数据库表结构一一对应
 */

/**
 * 公告表行类型
 */
export type AnnouncementRow = {
  /** 公告ID */
  id: string;
  /** 创建时间 */
  created_at: string;
  /** 公告内容 */
  content: string | null;
};

/**
 * 出勤表行类型
 */
export type AttendanceRow = {
  /** 出勤ID */
  id: string;
  /** 排练ID */
  rehearsal_id: string;
  /** 用户ID */
  user_id: string;
  /** 创建时间 */
  created_at: string;
  /** 出勤状态 */
  status: AttendanceStatus;
};


/**
 * 排练表行类型
 */
export type RehearsalRow = {
  /** 排练ID */
  id: string;
  /** 排练标题 */
  title: string | null;
  /** 排练日期 */
  date: string | null;
  /** @deprecated 已废弃，请使用 start_time / end_time */
  time?: string | null;
  /** 开始时间 */
  start_time?: string | null;
  /** 结束时间 */
  end_time?: string | null;
  /** 排练地点 */
  location: string | null;
  /** 排练曲目 */
  repertoire: string | null;
  /** 创建时间 */
  created_at: string;
  /** 排练类型 */
  type?: "full" | "section";
  /** 目标声部（仅声部分排时使用） */
  target_section?: string | null;
  /** 签到码 */
  sign_in_code?: string | null;
};

/**
 * 帖子表行类型
 */
export type PostRow = {
  /** 帖子ID */
  id: string;
  /** 创建时间 */
  created_at: string;
  /** 作者ID */
  author_id: string;
  /** 帖子标题 */
  title: string | null;
  /** 帖子类型 */
  type: PostType;
  /** 帖子内容 */
  content: string | null;
  /** @deprecated 已废弃 */
  _section?: string | null;
  /** 是否活跃 */
  is_active?: boolean;
  /** 当前声部 */
  current_sections: string | null;
  /** 缺少声部 */
  missing_sections: string | null;
  /** 联系方式 */
  contact_info: string | null;
  /** 图片URL */
  image_url: string | null;
  /** 扩展：作者信息（从 profiles 映射而来） */
  profiles?: { full_name: string | null; instrument: string | null } | null;
};

/**
 * 用户资料表行类型
 */
export type ProfileRow = {
  /** 用户ID */
  id: string;
  /** 创建时间 */
  created_at: string;
  /** 姓名 */
  full_name: string | null;
  /** 邮箱 */
  email: string | null;
  /** 乐器 */
  instrument: string | null;
  /** 院系 */
  college: string | null;
  /** 加入日期 */
  join_date: string | null;
  /** 角色 */
  role: string | null;
  /** 状态 */
  status: string | null;
};

export type PracticeSessionRow = {
  id : string;
  /** 创建时间 */
  created_at: string;
  /** 用户ID */
  user_id: string;
  /** 日期 */
  date: string;
  /** 开始时间 */
  start_time: string | null;
  /** 结束时间 */
  end_time: string | null;
  /** 标题 */
  title: string | null;
  /** 地址 */
  location: string | null;
  /** 扩展：作者信息（从 profiles 映射而来） */
  profiles?: { full_name: string | null; 
              instrument: string | null;  
              email: string | null } | null;
}

/**
 * 用户类型（应用内部使用）
 */
export type User = ProfileRow;