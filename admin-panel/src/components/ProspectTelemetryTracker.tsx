"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { recordProspectHeartbeatAction, recordProspectIntentAction } from "../app/actions/prospectActions";

export default function ProspectTelemetryTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPingTimeRef = useRef<number>(Date.now());
  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Resolve or Generate Persistent Device ID (persists across visits)
    let deviceId = localStorage.getItem("forstore_device_id");
    if (!deviceId) {
      const match = document.cookie.match(/forstore_device_id=([^;]+)/);
      if (match && match[1]) deviceId = match[1];
    }
    if (!deviceId) {
      deviceId = `dev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    }
    localStorage.setItem("forstore_device_id", deviceId);
    document.cookie = `forstore_device_id=${deviceId};path=/;max-age=31536000`;

    // 2. Resolve or Generate Visitor ID
    let visitorId = localStorage.getItem("forstore_visitor_id");
    if (!visitorId) {
      visitorId = `vis_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem("forstore_visitor_id", visitorId);
    }

    // 3. Detect New Session Visit on this device
    let isNewVisit = false;
    if (!sessionStorage.getItem("forstore_session_active")) {
      isNewVisit = true;
      sessionStorage.setItem("forstore_session_active", "true");
    }

    // 4. Resolve Prospect Name from URL parameter (?prospect=... or ?client=...)
    const prospectParam =
      searchParams.get("prospect") ||
      searchParams.get("client") ||
      searchParams.get("ref");

    if (prospectParam && prospectParam.trim()) {
      localStorage.setItem("forstore_prospect_tag", prospectParam.trim());
    }

    // 5. Resolve Device Info
    const ua = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
    const platform = navigator.platform || "Device";
    const deviceInfo = `${isMobile ? "📱 Mobile" : "💻 Desktop"} (${platform.includes("Win") ? "Windows" : platform.includes("Mac") ? "Mac" : isMobile ? "iOS/Android" : "Web"})`;

    // 4. Resolve Active Feature Name
    const getActiveFeatureName = () => {
      const tabParam = searchParams.get("tab");
      if (pathname.includes("/admin")) {
        if (tabParam === "qr-studio") return "QR Studio (Printable Standees)";
        if (tabParam === "game-manager") return "Game Manager (Rewards & Tiers)";
        if (tabParam === "wallet") return "Wallet & Billing";
        if (tabParam === "branding") return "Branding Customizer";
        if (tabParam === "subscription") return "Subscription Plans";
        if (tabParam === "analytics") return "Store Analytics";
        if (tabParam === "audit-logs") return "Audit Logs";
        return "Store Overview";
      }
      if (pathname.includes("/play/")) {
        const game = pathname.split("/play/")[1] || "Game";
        return `Gameplay: ${game.replace(/-/g, " ").toUpperCase()}`;
      }
      if (pathname.includes("/arcade")) return "Customer Arcade Hub";
      if (pathname.includes("/claim")) return "Reward Voucher Claiming";
      if (pathname.includes("/login")) return "Login Screen";
      return "Demo Landing";
    };

    // 5. Visibility State Handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        isVisibleRef.current = false;
      } else {
        isVisibleRef.current = true;
        lastPingTimeRef.current = Date.now();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 6. Global Click Listener for Intent Signals
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest("a");
      const currentTag = localStorage.getItem("forstore_prospect_tag") || undefined;

      if (anchor) {
        const href = anchor.getAttribute("href") || "";
        if (href.includes("wa.me") || href.includes("whatsapp")) {
          recordProspectIntentAction({
            visitorId: visitorId!,
            action: "whatsapp_click",
            metadata: href,
            prospectTag: currentTag,
          });
        } else if (href.startsWith("mailto:")) {
          recordProspectIntentAction({
            visitorId: visitorId!,
            action: "email_click",
            metadata: href,
            prospectTag: currentTag,
          });
        }
      }

      // Check button clicks
      const button = target.closest("button");
      if (button) {
        const text = button.textContent?.toLowerCase() || "";
        if (text.includes("launch for your cafe") || text.includes("get started")) {
          recordProspectIntentAction({
            visitorId: visitorId!,
            action: "modal_or_launch_click",
            metadata: text.trim(),
            prospectTag: currentTag,
          });
        }
      }
    };
    document.addEventListener("click", handleGlobalClick);

    // 7. Periodic Telemetry Heartbeat (every 15 seconds)
    const interval = setInterval(() => {
      if (!isVisibleRef.current) return;

      const now = Date.now();
      const deltaSec = Math.round((now - lastPingTimeRef.current) / 1000);
      lastPingTimeRef.current = now;

      if (deltaSec > 0 && deltaSec <= 60) {
        const currentTag = localStorage.getItem("forstore_prospect_tag") || undefined;
        const currentFeature = getActiveFeatureName();

        recordProspectHeartbeatAction({
          visitorId: visitorId!,
          deviceId,
          prospectTag: currentTag,
          activeFeature: currentFeature,
          secondsDelta: deltaSec,
          deviceInfo,
        });
      }
    }, 15000);

    // Initial immediate ping
    const initialTag = localStorage.getItem("forstore_prospect_tag") || undefined;
    recordProspectHeartbeatAction({
      visitorId,
      deviceId,
      prospectTag: initialTag,
      activeFeature: getActiveFeatureName(),
      secondsDelta: 2,
      deviceInfo,
      isNewVisit,
    });

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("click", handleGlobalClick);
    };
  }, [pathname, searchParams]);

  return null;
}
