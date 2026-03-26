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
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 px-4 pb-safe animate-fade-in">
      <button
        aria-label="关闭弹窗"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
        disabled={disabled}
      />
      <div className={`relative w-full max-w-md rounded-3xl bg-background p-4 shadow-xl ${className} animate-slide-in-up`}>
        {title && (
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-text">{title}</h2>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={disabled}
                className="rounded-full bg-background border border-border px-3 py-1 text-[11px] text-text-secondary hover:bg-background/80"
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
