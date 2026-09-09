"use client";

import React, { useState, useEffect } from "react";
import { recordProspectIntentAction, recordProspectLeadAction } from "../app/actions/prospectActions";

export interface BuyoutModalDetail {
  plan?: string;
  source?: string;
}

/**
 * Trigger function to open the Demo Buyout Modal from anywhere in client code
 */
export function triggerBuyoutModal(detail?: BuyoutModalDetail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("forstore:open-buyout", {
        detail: detail || {},
      })
    );
  }
}

export default function DemoBuyoutModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [plan, setPlan] = useState("Pro Store");
  const [source, setSource] = useState("direct_cta");

  // Lead capture form state
  const [cafeName, setCafeName] = useState("");
  const [contact, setContact] = useState("");
  const [city, setCity] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<BuyoutModalDetail>;
      const selectedPlan = customEvent.detail?.plan || "Pro Store";
      const triggerSrc = customEvent.detail?.source || "unspecified";

      setPlan(selectedPlan);
      setSource(triggerSrc);
      setIsOpen(true);
      setLeadSubmitted(false);

      // Log intent signal in telemetry
      const visId = localStorage.getItem("forstore_visitor_id") || "anonymous_prospect";
      recordProspectIntentAction({
        visitorId: visId,
        action: "buyout_modal_opened",
        metadata: `Plan: ${selectedPlan} | Source: ${triggerSrc}`,
      }).catch((err) => console.error("Error logging buyout intent:", err));
    };

    window.addEventListener("forstore:open-buyout", handleOpen);
    return () => window.removeEventListener("forstore:open-buyout", handleOpen);
  }, []);

  if (!isOpen) return null;

  const getVisitorId = () => {
    if (typeof window === "undefined") return "demo-visitor";
    return localStorage.getItem("forstore_visitor_id") || "demo-visitor";
  };

  const handleProdRedirect = () => {
    const visId = getVisitorId();
    recordProspectIntentAction({
      visitorId: visId,
      action: "buyout_prod_launch_click",
      metadata: `Plan: ${plan} | Source: ${source}`,
    }).catch(console.error);

    const targetUrl = `https://app.curaflowstudio.com/admin?mode=register&ref=demo&tier=${encodeURIComponent(plan)}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const handleWhatsAppClick = () => {
    const visId = getVisitorId();
    recordProspectIntentAction({
      visitorId: visId,
      action: "buyout_whatsapp_click",
      metadata: `Plan: ${plan} | Source: ${source}`,
    }).catch(console.error);

    const message = `Hi Shivam! I just explored the ForStore Demo (${plan} Plan) and want to deploy this in my venue. Can you help me get set up?`;
    window.open(`https://wa.me/919749694882?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const handleEmailClick = () => {
    const visId = getVisitorId();
    recordProspectIntentAction({
      visitorId: visId,
      action: "buyout_email_click",
      metadata: `Plan: ${plan} | Source: ${source}`,
    }).catch(console.error);

    const subject = `ForStore Venue Onboarding - ${plan} Tier`;
    const body = `Hi Shivam,\n\nI tested the ForStore demo and want to roll this out for my cafe/restaurant.\n\nCafe Name:\nCity:\nPhone / WhatsApp:\n`;
    window.location.href = `mailto:shivam@primexmeta.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeName.trim() || !contact.trim()) return;

    setIsSubmittingLead(true);
    try {
      const visId = getVisitorId();
      const combinedInfo = city.trim() ? `${cafeName.trim()} (${city.trim()})` : cafeName.trim();

      await recordProspectLeadAction({
        visitorId: visId,
        cafeName: combinedInfo,
        contact: `${contact.trim()} [Plan: ${plan}]`,
      });

      setLeadSubmitted(true);
    } catch (err) {
      console.error("Lead submission error:", err);
    } finally {
      setIsSubmittingLead(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#F6F3EB] border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_#000] max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 md:p-8 relative">
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-white border-2 border-black flex items-center justify-center font-black text-sm hover:bg-neutral-100 shadow-[2px_2px_0px_0px_#000] transition-transform active:translate-x-[1px] active:translate-y-[1px]"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 bg-[#FF4C29] text-white px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border-2 border-black mb-3 shadow-[2px_2px_0px_0px_#000]">
          <span>🚀</span> Ready to Go Live?
        </div>

        {/* Title */}
        <h2 className="font-serif text-2xl md:text-3xl font-black text-black leading-tight">
          Deploy ForStore in Your Venue
        </h2>
        <p className="text-xs md:text-sm text-black/70 font-medium mt-1 mb-6">
          Turn customer dwell time into repeat footfall, 5-star Google reviews, and higher average order value.
        </p>

        {/* Selected Tier Pill */}
        <div className="bg-white border-2 border-black rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[3px_3px_0px_0px_#000]">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-black/50 block">
              Selected Configuration
            </span>
            <div className="font-serif text-lg font-black text-black flex items-center gap-2">
              <span>☕</span>
              <span>{plan === "Enterprise" ? "Enterprise White-Label" : plan === "Starter" ? "Starter Plan" : "Pro Store Tier"}</span>
            </div>
            <span className="text-xs text-black/60 font-semibold">
              {plan === "Enterprise" ? "₹7,999/mo • Unlimited Locations & Dedicated Support" : plan === "Starter" ? "₹0 Free Forever • 1 Active Game" : "₹2,499/mo • Custom Branding & 1,000 Bonus Plays"}
            </span>
          </div>
          <span className="text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full whitespace-nowrap">
            Includes 14-Day Free Pilot
          </span>
        </div>

        {/* Primary Pathway 1: Production Platform Signup */}
        <div className="space-y-4 mb-6">
          <div className="bg-black text-white p-5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#FF4C29] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#FF4C29] text-white text-[10px] font-black px-2 py-0.5 rounded border border-white uppercase">
                  Production Cloud
                </span>
                <h3 className="font-bold text-base">Launch on Production Platform</h3>
              </div>
              <p className="text-xs text-white/70 mt-1">
                Instant setup. Your store gets real QR table standees, live analytics, and 14 days zero-risk trial.
              </p>
            </div>
            <button
              onClick={handleProdRedirect}
              className="w-full sm:w-auto bg-[#FF4C29] text-white hover:bg-[#ff360e] font-black text-xs px-5 py-3 rounded-xl border-2 border-white shadow-[2px_2px_0px_0px_#000] whitespace-nowrap transition-transform active:translate-y-[1px]"
            >
              Start Live Pilot ↗
            </button>
          </div>

          {/* Quick Pathways: WhatsApp Concierge + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleWhatsAppClick}
              className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 border-black bg-emerald-500 text-white font-black text-xs hover:bg-emerald-600 shadow-[3px_3px_0px_0px_#000] transition-transform active:translate-y-[1px]"
            >
              <span className="text-base">💬</span>
              <span>Chat on WhatsApp (+91 97496 94882)</span>
            </button>

            <button
              type="button"
              onClick={handleEmailClick}
              className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 border-black bg-white text-black font-bold text-xs hover:bg-neutral-50 shadow-[3px_3px_0px_0px_#000] transition-transform active:translate-y-[1px]"
            >
              <span className="text-base">✉️</span>
              <span>Email: shivam@primexmeta.com</span>
            </button>
          </div>
        </div>

        {/* Divider with Lead Callback Form */}
        <div className="border-t-2 border-black/10 pt-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">📞</span>
            <h4 className="font-serif font-black text-base text-black">
              Prefer a 5-Minute Walkthrough?
            </h4>
          </div>
          <p className="text-xs text-black/60 font-medium mb-4">
            Leave your cafe details and Shivam will send you free customized sample QR table standees within 2 hours.
          </p>

          {leadSubmitted ? (
            <div className="bg-emerald-100 border-2 border-emerald-500 text-emerald-900 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div className="text-xs">
                <p className="font-bold">Request received! We will connect with you shortly.</p>
                <p className="opacity-80 mt-0.5">Need immediate assistance? Message us on WhatsApp (+91 97496 94882).</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Cafe / Venue Name *"
                    value={cafeName}
                    onChange={(e) => setCafeName(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border-2 border-black bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4C29]"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Phone / WhatsApp (+91) *"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border-2 border-black bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4C29]"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="City / Location (Optional)"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border-2 border-black bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4C29]"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="w-full sm:w-auto bg-[#111111] text-white hover:bg-black font-black text-xs px-6 py-2.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29] transition-transform active:translate-y-[1px] disabled:opacity-50"
                >
                  {isSubmittingLead ? "Submitting..." : "Request 1-on-1 Setup Call →"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
