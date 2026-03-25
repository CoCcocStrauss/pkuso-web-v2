"use client";

import React from "react";

type ModalProps = {
  title?: React.ReactNode;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  disabled?: boolean;
};

export default function Modal({
  title,
  onClose,
  children,
  className = "",
  footer,
  disabled = false,
}: ModalProps) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 px-4 pb-safe">
      <button
        aria-label="关闭弹窗"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
        disabled={disabled}
      />
      <div className={`relative w-full max-w-md rounded-3xl bg-white p-4 shadow-xl ${className} dark:bg-zinc-900`}>
        {title && (
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={disabled}
                className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              >
                关闭
              </button>
            )}
          </div>
        )}
        <div>{children}</div>
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </div>
  );
}
