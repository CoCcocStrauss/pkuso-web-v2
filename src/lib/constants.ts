/**
 * Shared constants for the orchestra management application
 * 包含应用中使用的所有共享常量定义
 */

/**
 * 乐器列表
 * 按照乐团标准排序
 */
export const INSTRUMENTS = [
  "第一小提琴",
  "第二小提琴",
  "中提琴",
  "大提琴",
  "低音提琴",
  "长笛",
  "双簧管",
  "单簧管",
  "大管",
  "圆号",
  "小号",
  "长号",
  "大号",
  "打击乐",
  "键盘",
  "竖琴",
] as const;

/**
 * 乐器排序数组
 * 用于按乐器分组和排序
 */
export const INSTRUMENT_ORDER = INSTRUMENTS as readonly string[];

/**
 * 其他分组常量
 * 用于未分类的乐器或成员
 */
export const OTHER_GROUP = "其他";

/**
 * 星期数组
 * 索引0为周日，索引6为周六
 */
export const WEEKDAY = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/**
 * 排练类型常量
 */
/** 全团合排 */
export const REHEARSAL_TYPE_FULL = "全团合排";
/** 声部分排 */
export const REHEARSAL_TYPE_SECTION = "声部分排";

/**
 * 帖子类型标签映射
 * 用于UI显示
 */
export const TYPE_LABEL: Record<import("./enums").PostType, string> = {
  ensemble: "重奏",
  gathering: "团建",
};