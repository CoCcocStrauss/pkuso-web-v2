"use client";

import React from "react";
import { useUser } from "@/context/UserContext";
import { usePracticeSession } from "@/hooks/usePracticeSession";
import { formatDateTime } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import { DatePicker, registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { zhCN } from "date-fns/locale/zh-CN";
import { setHours, setMinutes } from "date-fns";

registerLocale("zh-cn", zhCN);

// 生成 24 小时时间刻度（0:00 到 23:00）
const hours = Array.from({ length: 24 }, (_, i) => i);

// 生成时间选项的函数（00:00 到 23:45，每 15 分钟一个选项）
const generateTimeOptions = () => {
  const times: Date[] = [];
  
  // 从 00:00 开始，到 23:45 结束
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      // 23:45 之后的时间跳过
      if (hour === 23 && minute > 45) continue;
      
      const time = new Date();
      time.setHours(hour, minute, 0, 0);
      times.push(time);
    }

  }
  const time = new Date();
  time.setHours(23, 59, 0, 0);
  times.push(time);
  
  return times;
};

// 格式化时间显示为 HH:mm
const formatTimeOption = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// 判断日期是否是今天或以后
const isDateTodayOrFuture = (date: Date): boolean => {
  const today = formatDateTime(new Date(), "yyyy-MM-dd");
  const selectedDateStr = formatDateTime(date, "yyyy-MM-dd");
  return selectedDateStr >= today;
};

// 判断 session 的日期是否是今天或以后（用于检查是否可编辑）
const isSessionTodayOrFuture = (sessionDate: string | null): boolean => {
  if (!sessionDate) return false;
  const today = formatDateTime(new Date(), "yyyy-MM-dd");
  return sessionDate >= today;
};

// 将hh:mm:ss格式的时间转换为hh:mm格式
const formatTimehhmm = (time: string) : string => { 
    const [hour, minute, second] = time.split(":");
    return `${hour}:${minute}`;
}


// 计算预约块的位置和高度
const getSessionStyle = (startTime: string, endTime: string) => {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  
  const startPosition = startHour * 60 + startMinute;
  const endPosition = endHour * 60 + endMinute;
  const duration = endPosition - startPosition;
  
  // 使用像素计算：总高度 576px / 1440 分钟 = 0.4px/分钟
  const pixelsPerMinute = 576 / 1440;
  
  return {
    top: `${startPosition * pixelsPerMinute}px`,
    height: `${duration * pixelsPerMinute}px`,
  };
};

// 根据时间段高度计算应该显示的样式
const getSessionContentStyle = (startTime: string, endTime: string) => {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  
  const startPosition = startHour * 60 + startMinute;
  const endPosition = endHour * 60 + endMinute;
  const duration = endPosition - startPosition;
  
  // 使用像素计算：总高度 576px / 1440 分钟 = 0.4px/分钟
  const pixelsPerMinute = 576 / 1440;
  const height = duration * pixelsPerMinute;
  
  // 根据高度决定显示内容和字体大小
  if (height < 20) {
    // 时间段非常短，只显示标题，超小字体
    return { fontSize: '10px', showTime: false, showName: false };
  } else if (height < 35) {
    // 时间段较短，显示标题和时间，小字体
    return { fontSize: '11px', showTime: true, showName: false };
  } else if (height < 50) {
    // 时间段中等，显示标题和时间，正常字体
    return { fontSize: '12px', showTime: true, showName: false };
  } else {
    // 时间段足够长，显示所有内容
    return { fontSize: '12px', showTime: true, showName: true };
  }
};

// 为每个 session 生成随机颜色索引（1-8）
const getSessionColorIndex = (sessionId: string): number => {
  // 使用 sessionId 生成一个稳定的随机数，确保同一个 session 总是显示相同的颜色
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = sessionId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash) % 8) + 1;
};

// 获取预约块的颜色类
const getSessionColorClass = (sessionId: string): string => {
  const colorIndex = getSessionColorIndex(sessionId);
  return `bg-session-${colorIndex}`;
};

export default function BookPage() {
  const { user } = useUser();
  const { loading, error, fetchPracticeSessions, deletePracticeSession, updatePracticeSession } = usePracticeSession();
  
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [selectedLocation, setSelectedLocation] = React.useState("新太阳 B108");
  const [sessions, setSessions] = React.useState<any[]>([]);
  const [selectedSession, setSelectedSession] = React.useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [sessionVisibility, setSessionVisibility] = React.useState<Record<string, boolean>>({});
  const [isFetchingSessions, setIsFetchingSessions] = React.useState(false);

  // 加载预约数据
  React.useEffect(() => {
    const dateString = formatDateTime(selectedDate, "yyyy-MM-dd");
    const loadSessions = async () => {
      setIsFetchingSessions(true);
      try {
        const data = await fetchPracticeSessions(dateString);
        setSessions(data);
        // 初始化所有 session 的可见性为 false
        const initialVisibility: Record<string, boolean> = {};
        data.forEach(session => {
          initialVisibility[session.id] = false;
        });
        setSessionVisibility(initialVisibility);
      } finally {
        setIsFetchingSessions(false);
      }
    };
    loadSessions();
  }, [selectedDate, fetchPracticeSessions]);

  // 为每个session设置可见性动画
  React.useEffect(() => {
    sessions.forEach((session, index) => {
      const timer = setTimeout(() => {
        setSessionVisibility(prev => ({
          ...prev,
          [session.id]: true
        }));
      }, 100 * index);

      return () => clearTimeout(timer);
    });
  }, [sessions]);



  // 处理预约点击
  const handleSessionClick = (session: any) => {
    setSelectedSession(session);
    setIsDetailModalOpen(true);
  };

  // 处理添加预约
  const handleAddSession = () => {
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* 日期和地址选择 */}
      <header className="p-4">
        <h1 className="text-lg font-semibold text-text-light dark:text-text">排练厅预约</h1>
        
        {/* 日期选择 */}
        <div className="mt-3">
          <label className="block text-sm text-text-light-secondary dark:text-text-secondary">
            选择日期
          </label>
          <div className="mt-1">
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => setSelectedDate(date as Date)}
              className="w-96 rounded-xl border border-border-light bg-background-light px-3 py-2 text-sm text-text-light dark:border-border dark:bg-background-secondary dark:text-text"
              dateFormat="yyyy年MM月dd日 EEEE"
              locale="zh-cn"
              calendarClassName="react-datepicker-orchestra"
            />
          </div>
        </div>

        {/* 地址选择 */}
        <div className="mt-3">
          <label className="text-sm text-text-light-secondary dark:text-text-secondary">
            地址
          </label>
          <div className="mt-1">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full rounded-xl border border-border-light bg-background-light px-3 py-2 text-sm text-text-light dark:border-border dark:bg-background-secondary dark:text-text"
            >
              <option value="新太阳B108">新太阳B108</option>
              {/* 将来可以添加更多地址 */}
            </select>
          </div>
        </div>
      </header>

      {/* 24 小时时间轴 */}
      <section className="flex max-h-[360px] overflow-y-auto rounded-2xl border-2 border-accent/30 shadow-lg dark:border-accent/50">
        {/* 时间刻度容器 - 跟随内容一起滚动 */}
        <div className="w-16 flex-shrink-0">
          {/* 内容容器 - 24 小时 * 每小时的像素高度 (24px) = 576px */}
          <div className="relative h-[576px] bg-gradient-to-b from-accent/10 to-accent/5 dark:from-accent/20 dark:to-accent/10 border-r-2 border-accent/30 dark:border-accent/50">
            {hours.map((hour) => (
              <div
                key={hour}
                className={`absolute left-0 right-0 h-6 border-b-2 ${(hour+1) % 4 === 0 ? 'border-accent/40 dark:border-accent/60' : 'border-accent/15 dark:border-accent/30'}`}
                style={{ top: `${hour * 24}px` }}
              >
                <div className="absolute top-1/2 left-2 -translate-y-1/2 text-xs font-bold text-accent dark:text-accent-secondary">
                  {hour}:00
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 预约块区域 - 与时间刻度同步滚动 */}
        <div className="flex-1 relative bg-gradient-to-b from-background via-background-secondary/30 to-background dark:from-background dark:via-background-secondary/20 dark:to-background">
          {/* 内容容器 - 24 小时 * 每小时的像素高度 (24px) = 576px */}
          <div className="relative h-[576px]">
            {isFetchingSessions ? (
              /* 加载中状态 */
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 text-sm font-medium text-accent dark:text-accent-secondary">加载中...</div>
                  <div className="flex justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* 背景网格 - 每小时一条线 */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className={`absolute left-0 right-0 h-6 border-b-2 ${(hour+1) % 4 === 0 ? 'border-accent/40 dark:border-accent/60' : 'border-accent/15 dark:border-accent/30'}`}
                    style={{ top: `${hour * 24}px` }}
                  />
                ))}

                {/* 预约块 */}
                {sessions.map((session) => {
                  const style = getSessionStyle(session.start_time!, session.end_time!);
                  const contentStyle = getSessionContentStyle(session.start_time!, session.end_time!);
                  const isVisible = sessionVisibility[session.id] || false;
                  const colorClass = getSessionColorClass(session.id);
                  
                  return (
                    <div
                      key={session.id}
                      className={`absolute left-2 right-2 rounded-xl ${colorClass} p-1.5 sm:p-2 text-xs cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:shadow-accent/20 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                      style={style}
                      onClick={() => handleSessionClick(session)}
                    >
                      <div className="flex flex-col overflow-hidden h-full">
                        <p 
                          className="font-bold text-text-light dark:text-text truncate drop-shadow-sm"
                          style={{ fontSize: contentStyle.fontSize, lineHeight: '1.2' }}
                        >
                          {session.title || "未命名"}
                        </p>
                        {contentStyle.showTime && (
                          <p 
                            className="text-text-light-secondary dark:text-text-secondary truncate font-medium mt-0.5"
                            style={{ fontSize: contentStyle.fontSize }}
                          >
                            {formatTimehhmm(session.start_time!)} - {formatTimehhmm(session.end_time!)}
                          </p>
                        )}
                        {contentStyle.showName && (
                          <p 
                            className="mt-0.5 text-xs text-text-light-secondary dark:text-text-secondary truncate font-medium"
                            style={{ fontSize: contentStyle.fontSize }}
                          >
                            {session.profiles?.full_name || "未知"}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </section>

      {/* 添加预约按钮 */}
      <div className="p-4">
        <button
          onClick={handleAddSession}
          disabled={!isDateTodayOrFuture(selectedDate)}
          className={`w-full rounded-xl py-3 font-medium shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${
            isDateTodayOrFuture(selectedDate)
              ? 'bg-button-primary text-button-primary-text dark:bg-button-primary dark:text-button-primary-text'
              : 'bg-background-secondary text-text-secondary dark:bg-background dark:text-text-secondary'
          }`}
        >
          + 添加预约
        </button>
      </div>

      {/* 预约详情模态框 */}
      {isDetailModalOpen && selectedSession && (
        <Modal
          title="预约详情"
          onClose={() => setIsDetailModalOpen(false)}
        >
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-text-light-secondary dark:text-text-secondary">标题</p>
              <p className="text-text-light dark:text-text">{selectedSession.title || "未命名"}</p>
            </div>
            <div>
              <p className="text-text-light-secondary dark:text-text-secondary">时间</p>
              <p className="text-text-light dark:text-text">
                {formatTimehhmm(selectedSession.start_time!)} - {formatTimehhmm(selectedSession.end_time!)}
              </p>
            </div>
            <div>
              <p className="text-text-light-secondary dark:text-text-secondary">预约人</p>
              <p className="text-text-light dark:text-text">
                {selectedSession.profiles?.full_name || "未知"}
              </p>
            </div>
            <div>
              <p className="text-text-light-secondary dark:text-text-secondary">乐器</p>
              <p className="text-text-light dark:text-text">
                {selectedSession.profiles?.instrument || "未知"}
              </p>
            </div>
            <div>
              <p className="text-text-light-secondary dark:text-text-secondary">邮箱</p>
              <p className="text-text-light dark:text-text">
                {selectedSession.profiles?.email || "未知"}
              </p>
            </div>
          </div>
          
          {/* 编辑和删除按钮 - 只有 session 日期是今天或以后，且是 session 所有者或 admin 才能操作 */}
          {user && ((user.id === selectedSession.user_id && isSessionTodayOrFuture(selectedSession.date)) || user.role === 'admin')  && (
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setIsEditModalOpen(true);
                }}
                className="rounded-full border border-border-light bg-background-light px-4 py-2 text-sm text-text-light-secondary hover:bg-background-light/80 dark:border-border dark:bg-background-secondary dark:text-text-secondary"
              >
                编辑
              </button>
              <button
                onClick={async () => {
                  if (confirm('确定要删除这个预约吗?')) {
                    // 禁用按钮并显示加载状态
                    const button = event?.currentTarget as HTMLButtonElement;
                    const originalText = button.textContent;
                    button.disabled = true;
                    button.textContent = '删除中...';
                    
                    try {
                      const success = await deletePracticeSession(selectedSession.id);
                      if (success) {
                        setIsDetailModalOpen(false);
                        // 重新加载数据
                        const dateString = formatDateTime(selectedDate, 'yyyy-MM-dd');
                        const data = await fetchPracticeSessions(dateString);
                        setSessions(data);
                      }
                    } finally {
                      // 恢复按钮状态
                      button.disabled = false;
                      button.textContent = originalText;
                    }
                  }
                }}
                className="rounded-full border border-error bg-error/10 px-4 py-2 text-sm text-error hover:bg-error/20 dark:border-error dark:bg-error/20 dark:text-error"
              >
                删除
              </button>
            </div>
          )}
          
          {/* 如果是过去的 session，显示提示信息 */}
          {user && (user.id === selectedSession.user_id || user.role === 'admin') && !isSessionTodayOrFuture(selectedSession.date) && (
            <div className="mt-4 flex justify-end gap-2">
              <div className="text-xs text-text-light-secondary dark:text-text-secondary">
                过去的预约无法编辑或删除
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* 编辑预约模态框 */}
      {isEditModalOpen && selectedSession && (
        <EditSessionModal 
          session={selectedSession}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={async () => {
            setIsEditModalOpen(false);
            // 重新加载数据
            const dateString = formatDateTime(selectedDate, 'yyyy-MM-dd');
            const data = await fetchPracticeSessions(dateString);
            setSessions(data);
          }}
        />
      )}

      {/* 添加预约模态框 */}
      {isAddModalOpen && (
        <AddSessionModal 
          onClose={async () => {
            setIsAddModalOpen(false);
            // 重新加载数据
            const dateString = formatDateTime(selectedDate, 'yyyy-MM-dd');
            const data = await fetchPracticeSessions(dateString);
            setSessions(data);
          }}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}

// 添加预约模态框组件
function AddSessionModal({ onClose, selectedDate }: { onClose: () => void; selectedDate: Date }) {
  const { user } = useUser();
  const { createPracticeSession } = usePracticeSession();
  const [title, setTitle] = React.useState("");
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("11:00");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!user) {
      setError("请先登录");
      setLoading(false);
      return;
    }

    if (!title) {
      setError("请输入标题");
      setLoading(false);
      return;
    }

    if (!startTime || !endTime) {
      setError("请选择时间");
      setLoading(false);
      return;
    }

    if (startTime >= endTime) {
      setError("结束时间必须晚于开始时间");
      setLoading(false);
      return;
    }

    const date = formatDateTime(selectedDate, 'yyyy-MM-dd');
    const { success, error: errorMsg } = await createPracticeSession({
      user_id: user.id,
      date,
      start_time: startTime,
      end_time: endTime,
      title,
      location: "新太阳B108",
    });

    if (success) {
      onClose();
    } else {
      setError(errorMsg);
    }

    setLoading(false);
  };

  return (
    <Modal title="添加预约" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <p className="text-error dark:text-error">{error}</p>
        )}
        <div>
          <label className="block text-sm text-text-light-secondary dark:text-text-secondary">
            标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-98 rounded-xl border border-border-light bg-background-light px-3 py-2 text-sm text-text-light dark:border-border dark:bg-background-secondary dark:text-text"
            placeholder="请输入标题"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-text-light-secondary dark:text-text-secondary">
              开始时间
            </label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border-light bg-background-light px-3 py-2 text-sm text-text-light dark:border-border dark:bg-background-secondary dark:text-text"
            >
              {generateTimeOptions().map((time) => {
                const timeStr = formatTimeOption(time);
                return (
                  <option key={timeStr} value={timeStr}>
                    {timeStr}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm text-text-light-secondary dark:text-text-secondary">
              结束时间
            </label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border-light bg-background-light px-3 py-2 text-sm text-text-light dark:border-border dark:bg-background-secondary dark:text-text"
            >
              {generateTimeOptions().map((time) => {
                const timeStr = formatTimeOption(time);
                return (
                  <option key={timeStr} value={timeStr}>
                    {timeStr}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full border border-border-light bg-background-light px-4 py-2 text-sm text-text-light-secondary hover:bg-background-light/80 disabled:opacity-60 dark:border-border dark:bg-background-secondary dark:text-text-secondary"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-button-primary px-4 py-2 text-sm font-medium text-button-primary-text hover:bg-button-primary/90 disabled:opacity-60 dark:bg-button-primary dark:text-button-primary-text dark:hover:bg-button-primary/90"
          >
            {loading ? "提交中..." : "确认"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// 编辑预约模态框组件
function EditSessionModal({ 
  session, 
  onClose, 
  onSuccess 
}: { 
  session: any; 
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const { updatePracticeSession } = usePracticeSession();
  // 格式化时间为 HH:mm 格式（处理可能的 HH:mm:ss 格式）
  const formatInitialTime = (time: string | null | undefined): string => {
    if (!time) return "09:00";
    return formatTimehhmm(time);
  };
  
  const [title, setTitle] = React.useState(session.title || "");
  const [startTime, setStartTime] = React.useState(formatInitialTime(session.start_time));
  const [endTime, setEndTime] = React.useState(formatInitialTime(session.end_time));
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!title) {
      setError("请输入标题");
      setLoading(false);
      return;
    }

    if (!startTime || !endTime) {
      setError("请选择时间");
      setLoading(false);
      return;
    }

    if (startTime >= endTime) {
      setError("结束时间必须晚于开始时间");
      setLoading(false);
      return;
    }

    const success = await updatePracticeSession(session.id, {
      start_time: startTime,
      end_time: endTime,
      title,
    });

    if (success) {
      onSuccess();
    } else {
      setError("更新预约失败");
    }

    setLoading(false);
  };

  return (
    <Modal title="编辑预约" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <p className="text-error dark:text-error">{error}</p>
        )}
        <div>
          <label className="block text-sm text-text-secondary dark:text-text-secondary">
            标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-border/80 dark:border-border dark:bg-background dark:text-text"
            placeholder="请输入标题"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-text-light-secondary dark:text-text-secondary">
              开始时间
            </label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border-light bg-background-light px-3 py-2 text-sm text-text-light dark:border-border dark:bg-background-secondary dark:text-text"
            >
              {generateTimeOptions().map((time) => {
                const timeStr = formatTimeOption(time);
                return (
                  <option key={timeStr} value={timeStr}>
                    {timeStr}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm text-text-light-secondary dark:text-text-secondary">
              结束时间
            </label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border-light bg-background-light px-3 py-2 text-sm text-text-light dark:border-border dark:bg-background-secondary dark:text-text"
            >
              {generateTimeOptions().map((time) => {
                const timeStr = formatTimeOption(time);
                return (
                  <option key={timeStr} value={timeStr}>
                    {timeStr}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full border border-border-light bg-background-light px-4 py-2 text-sm text-text-light-secondary hover:bg-background-light/80 disabled:opacity-60 dark:border-border dark:bg-background-secondary dark:text-text-secondary"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-button-primary px-4 py-2 text-sm font-medium text-button-primary-text hover:bg-button-primary/90 disabled:opacity-60 dark:bg-button-primary dark:text-button-primary-text dark:hover:bg-button-primary/90"
          >
            {loading ? "提交中..." : "确认"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
