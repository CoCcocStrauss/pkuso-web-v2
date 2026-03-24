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
 * 判断是否为全团合排
 * @param r 排练记录
 * @returns 是否为全团合排
 */
export function isFullRehearsal(r: RehearsalRow): boolean {
  const t = (r.title ?? "").trim();
  if (t === "全团合排" || t.includes("合排")) return true;
  if (isSectionRehearsal(r)) return false;
  return true;
}

/**
 * 判断是否为声部分排
 * @param r 排练记录
 * @returns 是否为声部分排
 */
export function isSectionRehearsal(r: RehearsalRow): boolean {
  const t = (r.title ?? "").trim();
  return t === "声部分排" || t.includes("分排");
}

/**
 * 格式化日期为 MM-DD 格式
 * @param date 日期字符串 (yyyy-mm-dd)
 * @returns 格式化后的日期字符串 (MM-DD)，如果无效则返回"—"
 */
export function formatDateMMDD(date: string | null): string {
  if (!date || date.length < 10) return "—";
  const parts = date.split("-");
  if (parts.length >= 3) return `${parts[1]}-${parts[2]}`;
  return date;
}

/**
 * 格式化日期为长格式："3月10日 周二 19:30"
 * @param date 日期字符串 (yyyy-mm-dd)
 * @param time 时间字符串
 * @returns 格式化后的日期时间字符串
 */
export function formatDateLong(date: string | null, time: string | null): string {
  if (!date || date.length < 10) return "—";
  const [y, m, d] = date.split("-").map(Number);
  if (Number.isNaN(m) || Number.isNaN(d)) return "—";
  const day = new Date(y, m - 1, d).getDay();
  const timeStr = (time ?? "").trim() || "—";
  return `${m}月${d}日 ${WEEKDAY[day]} ${timeStr}`;
}

/**
 * 日程卡片标题格式化：月-日 时间（与社区卡片对齐）
 * @param date 日期字符串 (yyyy-mm-dd)
 * @param timeRange 时间范围字符串
 * @returns 格式化后的标题字符串
 */
export function formatDateTitle(date: string | null, timeRange: string): string {
  if (!date || date.length < 10) return "—";
  const [y, m, d] = date.split("-").map(Number);
  if (Number.isNaN(m) || Number.isNaN(d)) return "—";
  const timeStr = (timeRange ?? "").trim() || "—";
  return `${m}-${d} ${timeStr}`;
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
 * 格式化帖子日期
 * @param createdAt 创建时间
 * @returns 格式化后的日期字符串 (yyyy-MM-DD)
 */
export function formatPostDate(createdAt: string | null | undefined): string {
  if (!createdAt) return "";
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
 * 格式化时间
 * @param s 时间字符串或日期对象
 * @returns 格式化后的时间字符串
 */
export function formatTime(s: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
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
export function formatRehearsalRange(
  startValue: string | null | undefined, 
  endValue: string | null | undefined
): string {
  const start = startValue ? new Date(startValue) : new Date(0);
  if (Number.isNaN(start?.getTime())) return String(startValue);
  const end = endValue ? new Date(endValue) : null;

  const weekdayFormatter = new Intl.DateTimeFormat("zh-CN", {
    weekday: "short",
  });
  const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const weekday = weekdayFormatter.format(start);
  const month = start.getMonth() + 1;
  const day = start.getDate();
  const startTime = timeFormatter.format(start);
  const datePart = `${month}月${day}日 ${weekday}`;

  if (!end || Number.isNaN(end.getTime())) {
    return `${datePart} ${startTime}`;
  }

  const endTime = timeFormatter.format(end);
  return `${datePart} ${startTime} - ${endTime}`;
}