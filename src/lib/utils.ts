/**
 * Shared utility functions for the orchestra management application
 * 包含应用中使用的所有共享工具函数
 */

import { INSTRUMENT_ORDER, OTHER_GROUP, WEEKDAY } from "./constants";
import type { RehearsalRow } from "./types";

/**
 * 声部分组逻辑
 * 根据乐器名称返回对应的分组
 * @param instrument 乐器名称
 * @returns 分组名称，如果不在标准乐器列表中则返回"其他"
 */

export function instrumentGroupKey(instrument: string | null): string {
  if (!instrument) return OTHER_GROUP;
  const trimmed = instrument.trim();
  if (INSTRUMENT_ORDER.includes(trimmed as (typeof INSTRUMENT_ORDER)[number])) {
    return trimmed;
  }
  return OTHER_GROUP;
}

/**
 * 判断排练是否已结束
 * 优先使用结束时间，否则使用开始时间+30分钟作为结束时间
 * @param endTime 结束时间
 * @returns 是否已结束
 */
export function isRehearsalEnded(
  endTime: string | null | undefined,
): boolean {
  const today = new Date();
  const end = endTime ? new Date(endTime) : new Date(today.getTime() + 30 * 60 * 1000);
  return Date.now() > end.getTime();
}

/**
 * 格式化公告作者与声部文本
 * @param post PostRow
 * @returns 例如："张三 · 小提琴" 或 "未知"
 */
export function formatPostAuthorLabel(post: import("./types").PostRow): string {
  const u = post.profiles;
  if (u?.full_name) {
    return `${u.full_name}${u.instrument ? ` · ${u.instrument}` : ""}`;
  }
  return "未知";
}

/**
 * 检查是否有声部文本
 * @param s 声部字符串
 * @returns 是否有有效的声部文本
 */
export function hasSectionText(s: string | null | undefined): boolean {
  return s != null && typeof s === "string" && s.trim() !== "";
}

/**
 * 自定义日期时间格式化函数
 * 支持的格式占位符：
 * - yyyy: 四位年份
 * - MM: 两位月份
 * - dd: 两位日期
 * - HH: 24小时制小时
 * - hh: 12小时制小时
 * - mm: 两位分钟
 * - ss: 两位秒数
 * - wd: 周几（中文）
 * - Wd: 周几（英文缩写）
 * 
 * @param dateTime 日期时间字符串或Date对象
 * @param format 格式字符串
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(dateTime: string | Date | null, format: string): string {
  if (!dateTime) return "—";
  
  const d = typeof dateTime === "string" ? new Date(dateTime) : dateTime;
  if (Number.isNaN(d.getTime())) return typeof dateTime === "string" ? dateTime : "—";
  
  const formatters: Record<string, () => string> = {
    yyyy: () => String(d.getFullYear()),
    MM: () => String(d.getMonth() + 1).padStart(2, "0"),
    dd: () => String(d.getDate()).padStart(2, "0"),
    HH: () => String(d.getHours()).padStart(2, "0"),
    hh: () => String((d.getHours() % 12) || 12).padStart(2, "0"),
    mm: () => String(d.getMinutes()).padStart(2, "0"),
    ss: () => String(d.getSeconds()).padStart(2, "0"),
    wd: () => ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.getDay()],
    Wd: () => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()]
  };
  
  let result = format;
  for (const [key, formatter] of Object.entries(formatters)) {
    result = result.replace(new RegExp(key, "g"), formatter);
  }
  
  return result;
}

/**
 * 添加自定义日期时间格式化器
 * @param key 格式占位符（如 "wd"）
 * @param formatter 格式化函数
 * @returns 新的格式化函数，包含自定义格式化器
 */
export function addDateTimeFormatter(key: string, formatter: (date: Date) => string) {
  return (dateTime: string | Date | null, format: string): string => {
    if (!dateTime) return "—";
    
    const d = typeof dateTime === "string" ? new Date(dateTime) : dateTime;
    if (Number.isNaN(d.getTime())) return typeof dateTime === "string" ? dateTime : "—";
    
    const formatters: Record<string, () => string> = {
      yyyy: () => String(d.getFullYear()),
      MM: () => String(d.getMonth() + 1).padStart(2, "0"),
      dd: () => String(d.getDate()).padStart(2, "0"),
      HH: () => String(d.getHours()).padStart(2, "0"),
      hh: () => String((d.getHours() % 12) || 12).padStart(2, "0"),
      mm: () => String(d.getMinutes()).padStart(2, "0"),
      ss: () => String(d.getSeconds()).padStart(2, "0"),
      wd: () => ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.getDay()],
      Wd: () => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
      [key]: () => formatter(d)
    };
    
    let result = format;
    for (const [k, f] of Object.entries(formatters)) {
      result = result.replace(new RegExp(k, "g"), f);
    }
    
    return result;
  };
}

/**
 * 将排练起止时间格式化为「月日 周几 起始 - 结束」的友好展示字符串。
 *
 * 示例：
 *   startValue = "2025-03-24T19:30:00.000Z"
 *   endValue = "2025-03-24T21:00:00.000Z"
 *   返回 "3月24日 周一 19:30 - 21:00"
 *
 * 如果 `startValue` 无效，则返回原始字符串（或 `null`/`undefined`）;
 * 如果 `endValue` 缺失或无效，则仅返回起始时间。
 *
 * @param {string | null | undefined} startValue 起始时间字符串（ISO 8601推荐）
 * @param {string | null | undefined} endValue 结束时间字符串（ISO 8601推荐，可选）
 * @returns 友好的排练时间范围文本
 */
export function formatRehearsalTimeRange(
  startValue: string | null | undefined, 
  endValue: string | null | undefined
): string {
  if (!startValue) return "—";
  
  const start = new Date(startValue);
  if (Number.isNaN(start.getTime())) return String(startValue);
  
  const startFormatted = formatDateTime(start, "MM月dd日 wd HH:mm");
  
  if (!endValue) return startFormatted;
  
  const end = new Date(endValue);
  if (Number.isNaN(end.getTime())) return startFormatted;
  
  const endFormatted = formatDateTime(end, "HH:mm");
  
  return `${startFormatted} - ${endFormatted}`;
}