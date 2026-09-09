"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getClientAppEnvironment } from "../lib/appEnv";
import { recordProspectOnboardingAction } from "../app/actions/prospectActions";

export default function DemoWelcomeModal() {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only active in demo or dev environment
    const env = getClientAppEnvironment();
    if (env !== "demo" && env !== "dev") return;

    // Check if device has already responded to the onboarding prompt
    const answered = localStorage.getItem("forstore_onboarding_answered");
    if (answered) return;

    // Prepopulate name if a prospect tag is in URL
    const prospectParam =
      searchParams.get("prospect") ||
      searchParams.get("client") ||
      searchParams.get("ref");
    if (prospectParam && prospectParam.trim()) {
      setName(prospectParam.trim());
    }

    // Small 800ms delay so page paints smoothly before subtle prompt shows
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [searchParams]);

  if (!isOpen) return null;

  const getDeviceId = () => {
    if (typeof window === "undefined") return "";
    let devId = localStorage.getItem("forstore_device_id");
    if (!devId) {
      const match = document.cookie.match(/forstore_device_id=([^;]+)/);
      if (match && match[1]) devId = match[1];
    }
    return devId || "";
  };

  const getVisitorId = () => {
    if (typeof window === "undefined") return "";
    let visId = localStorage.getItem("forstore_visitor_id");
    if (!visId) {
      visId = `vis_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem("forstore_visitor_id", visId);
    }
    return visId;
  };

  const handleComplete = async (
    overrideStatus?: "skipped" | "dismissed"
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const visitorId = getVisitorId();
    const deviceId = getDeviceId();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    let finalStatus: "both" | "name_only" | "email_only" | "skipped" | "dismissed";

    if (overrideStatus) {
      finalStatus = overrideStatus;
    } else {
      if (cleanName && cleanEmail) {
        finalStatus = "both";
      } else if (cleanName) {
        finalStatus = "name_only";
      } else if (cleanEmail) {
        finalStatus = "email_only";
      } else {
        finalStatus = "skipped";
      }
    }

    // Save device-specific flags so client is never annoyed on subsequent pages or visits
    try {
      localStorage.setItem("forstore_onboarding_answered", finalStatus);
      document.cookie = `forstore_onboarding_answered=${finalStatus};path=/;max-age=31536000`;

      if (cleanName) {
        localStorage.setItem("forstore_prospect_tag", cleanName);
        localStorage.setItem("forstore_client_name", cleanName);
      }
      if (cleanEmail) {
        localStorage.setItem("forstore_client_email", cleanEmail);
      }
    } catch {}

    // Resolve device platform string
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
    const platform = typeof navigator !== "undefined" ? navigator.platform || "Device" : "Device";
    const deviceInfo = `${isMobile ? "📱 Mobile" : "💻 Desktop"} (${platform.includes("Win") ? "Windows" : platform.includes("Mac") ? "Mac" : isMobile ? "iOS/Android" : "Web"})`;

    try {
      await recordProspectOnboardingAction({
        visitorId,
        deviceId,
        name: cleanName || undefined,
        email: cleanEmail || undefined,
        status: finalStatus,
        prospectTag: cleanName || undefined,
        deviceInfo,
      });
    } catch (e) {
      console.error("Failed to record onboarding choice", e);
    } finally {
      setIsSubmitting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-[#F6F3EB] border-4 border-black rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[8px_8px_0px_0px_#000000] relative text-left text-[#1A1A1A]">
        {/* Subtle Dismiss X */}
        <button
          onClick={() => handleComplete("dismissed")}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center font-bold text-xs hover:bg-black hover:text-white transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#000]"
          title="Dismiss (Explore directly)"
        >
          ✕
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 bg-[#FF4C29] text-white font-mono text-[9px] font-black uppercase rounded tracking-wider">
            INTERACTIVE DEMO
          </span>
          <span className="text-[11px] font-semibold text-black/50">ForStore Arcade & Admin</span>
        </div>

        <h3 className="font-serif text-2xl font-black text-black leading-snug">
          Welcome to the Demo Experience 👋
        </h3>
        <p className="text-xs text-black/70 font-semibold mt-1.5 leading-relaxed">
          Explore cafe games, loyalty rewards, and merchant analytics. Share your name to personalize your sandbox session, or explore anonymously:
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleComplete();
          }}
          className="mt-5 space-y-3"
        >
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-black/70">
                Your Name / Cafe Brand
              </label>
              <span className="text-[10px] font-bold text-black/40 italic">Optional</span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul / Blue Tokai Cafe"
              className="w-full p-3 bg-white border-2 border-black rounded-xl font-semibold text-xs text-black focus:outline-none focus:ring-2 focus:ring-[#FF4C29] shadow-[2px_2px_0px_0px_#000]"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-black/70">
                Email or WhatsApp
              </label>
              <span className="text-[10px] font-bold text-black/40 italic">Optional</span>
            </div>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rahul@cafe.com or +91 98..."
              className="w-full p-3 bg-white border-2 border-black rounded-xl font-semibold text-xs text-black focus:outline-none focus:ring-2 focus:ring-[#FF4C29] shadow-[2px_2px_0px_0px_#000]"
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#111111] hover:bg-[#FF4C29] text-white font-black text-xs rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>{isSubmitting ? "Loading Sandbox..." : "Start Demo Experience →"}</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleComplete("skipped")}
              className="w-full py-2 text-center text-xs font-bold text-black/50 hover:text-black hover:underline cursor-pointer transition-colors"
            >
              Skip & explore anonymously
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
