"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider swipeDirection="up">
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const isDestructive = props.variant === "destructive";
        const Icon = isDestructive ? AlertCircle : CheckCircle2;

        return (
          <Toast key={id} {...props}>
            <div
              className={
                isDestructive
                  ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700"
                  : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d6ead3] text-[#2c6e49] ring-1 ring-[#a9d1af]"
              }
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action && <div className="shrink-0 pt-0.5">{action}</div>}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
