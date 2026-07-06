"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, HeartHandshake, MessageCircle } from "lucide-react";

type PublicActivity = {
  id: string;
  type: "donation" | "comment" | "admin";
  title: string;
  message: string;
  campaignId?: string;
  createdAt: string;
};

function ActivityIcon({ type }: { type: PublicActivity["type"] }) {
  if (type === "donation") {
    return <HeartHandshake className="h-4 w-4" aria-hidden="true" />;
  }

  if (type === "comment") {
    return <MessageCircle className="h-4 w-4" aria-hidden="true" />;
  }

  return <Bell className="h-4 w-4" aria-hidden="true" />;
}

export function GlobalActivityToast() {
  const [activity, setActivity] = useState<PublicActivity | null>(null);
  const latestActivityIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchActivity = async () => {
      if (document.visibilityState === "hidden") return;

      try {
        const response = await fetch("/api/public/activity");

        if (!response.ok) return;

        const data = await response.json();
        const newestActivity = Array.isArray(data.activities)
          ? (data.activities[0] as PublicActivity | undefined)
          : undefined;

        if (!isMounted || !newestActivity) return;

        if (!initializedRef.current) {
          latestActivityIdRef.current = newestActivity.id;
          initializedRef.current = true;
          return;
        }

        if (newestActivity.id === latestActivityIdRef.current) return;

        latestActivityIdRef.current = newestActivity.id;
        setActivity(newestActivity);

        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }

        hideTimeoutRef.current = setTimeout(() => {
          setActivity(null);
        }, 5200);
      } catch (error) {
        console.error("Error fetching public activity:", error);
      }
    };

    void fetchActivity();
    const intervalId = window.setInterval(fetchActivity, 300000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`fixed left-1/2 top-24 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-[#2c6e49]/20 bg-white px-4 py-3 text-[#1f5137] shadow-lg transition-all duration-500 ${
        activity
          ? "translate-y-0 opacity-100"
          : "-translate-y-4 pointer-events-none opacity-0"
      }`}
      role="status"
      aria-live="polite"
    >
      {activity && (
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f0e9] text-[#2c6e49]">
            <ActivityIcon type={activity.type} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">
              {activity.title}
            </p>
            <p className="mt-1 text-[12.5px] leading-snug text-gray-600">
              {activity.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
