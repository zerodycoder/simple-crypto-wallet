import { useEffect, useRef, useCallback } from "react";
import { useWalletStore } from "@/store/useWalletStore";

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

export function useAutoLock() {
  const { isLocked, settings, lock } = useWalletStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      lock();
    }, settings.lockTimeout * 60 * 1000);
  }, [lock, settings.lockTimeout]);

  useEffect(() => {
    if (isLocked) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    resetTimer();

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true })
    );

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [isLocked, resetTimer]);
}
