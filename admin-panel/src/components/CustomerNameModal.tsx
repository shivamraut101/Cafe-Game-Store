"use client";

import React, { useState, useEffect } from "react";
import { updateCustomerNameAction, syncPlayerProfileByIdAction } from "../app/actions/gameActions";
import { setClientPlayerName, getClientDeviceFingerprint } from "../lib/playerSession";

interface CustomerNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName?: string;
  guestId?: string;
  onNameSaved?: (newName: string) => void;
  onProfileSynced?: (user: { id: string; guestId: string; name: string; totalCafePoints: number }) => void;
}

export default function CustomerNameModal({
  isOpen,
  onClose,
  currentName = "",
  guestId = "",
  onNameSaved,
  onProfileSynced,
}: CustomerNameModalProps) {
  const [nameInput, setNameInput] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Cross-profile & cross-browser profile sync state
  const [showSyncSection, setShowSyncSection] = useState(false);
  const [syncCodeInput, setSyncCodeInput] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [syncSuccess, setSyncSuccess] = useState(false);

  const suffix = guestId ? guestId.slice(-4).toUpperCase() : "GUEST";
  const isDefault =
    !currentName ||
    currentName.startsWith("Player #") ||
    currentName === "Player" ||
    currentName === "Arcade Player";

  useEffect(() => {
    if (isOpen) {
      setNameInput(isDefault ? "" : currentName);
      setSavedSuccess(false);
      setErrorMsg("");
      setShowSyncSection(false);
      setSyncCodeInput("");
      setSyncError("");
      setSyncSuccess(false);
    }
  }, [isOpen, currentName, isDefault]);

  if (!isOpen) return null;

  const handleSave = async (customName?: string) => {
    try {
      setSaving(true);
      setErrorMsg("");
      const valueToSave = customName !== undefined ? customName : nameInput;

      // 1. Call server action to update User record in MongoDB Atlas
      const res = await updateCustomerNameAction(valueToSave, guestId);

      if (res.success && res.name) {
        // 2. Update client cache (localStorage & cookie)
        setClientPlayerName(res.isCustom ? res.name : "");
        setSavedSuccess(true);
        if (onNameSaved) onNameSaved(res.name);

        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setErrorMsg(res.error || "Failed to update name");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncProfile = async () => {
    const clean = syncCodeInput.trim().toUpperCase().replace(/^#/, "");
    if (!clean || clean.length < 3) {
      setSyncError("Please enter your 4-letter Player Code (e.g. 9L9X)");
      return;
    }

    try {
      setSyncing(true);
      setSyncError("");
      const fp = getClientDeviceFingerprint();
      const res = await syncPlayerProfileByIdAction(clean, undefined, fp);

      if (res.success && res.user) {
        setSyncSuccess(true);
        if (onProfileSynced) {
          onProfileSynced(res.user);
        }
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setSyncError(res.error || "Profile not found");
      }
    } catch (e: any) {
      setSyncError(e.message || "Failed to sync profile");
    } finally {
      setSyncing(false);
    }
  };

  const handleResetToAnonymous = () => {
    handleSave(""); // clears custom name, reverting to Player #XXXX
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="w-full max-w-sm bg-[#FFFDF9] border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#000] relative flex flex-col gap-4 text-left my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white border-2 border-black flex items-center justify-center font-black text-black hover:bg-black hover:text-white transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#000]"
          title="Close"
        >
          ✕
        </button>

        {/* Header Badge */}
        <div>
          <span className="inline-block px-3 py-1 bg-[#FF4C29] text-white text-[10px] font-black uppercase rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000] tracking-wider mb-2">
            🏷️ CUSTOMER PROFILE (OPTIONAL)
          </span>
          <h3 className="font-serif text-2xl font-black text-[#1A1A1A]">
            What should we call you?
          </h3>
          <p className="text-xs text-black/60 font-semibold mt-1">
            Personalize your cafe experience, leaderboards, and counter vouchers.
          </p>
        </div>

        {/* Security & ID Anchor Assurance Box */}
        <div className="bg-[#F3F4F6] border-2 border-black/20 rounded-2xl p-3 text-[11px] font-medium text-black/70 flex flex-col gap-1">
          <div className="flex items-center justify-between font-mono font-black text-black text-xs">
            <span className="flex items-center gap-1">
              <span>🔒</span> Active Player ID:
            </span>
            <span className="bg-white px-2 py-0.5 rounded border border-black/20 text-[#FF4C29]">
              #{suffix}
            </span>
          </div>
          <p className="text-[10px] text-black/55 leading-tight mt-0.5">
            Your points, daily plays, and vouchers are protected by your unique ID behind the scenes—whether you set a name or stay anonymous.
          </p>
        </div>

        {/* Name Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black uppercase text-black/80 flex justify-between items-center">
            <span>Your Name or Nickname</span>
            <span className="text-[10px] text-black/40 font-mono">
              {nameInput.length}/30
            </span>
          </label>
          <input
            type="text"
            maxLength={30}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            placeholder="e.g. Maya, Alex, Table 4 Boss..."
            className="w-full px-4 py-3 bg-white text-black font-bold text-sm border-3 border-black rounded-2xl shadow-[3px_3px_0px_0px_#000] focus:outline-none focus:ring-2 focus:ring-[#FF4C29]"
            autoFocus
          />
        </div>

        {/* Live Preview Pill */}
        <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-xl p-2.5 text-xs text-emerald-950 flex items-center justify-between">
          <span className="text-[10px] font-bold text-emerald-800 uppercase">Voucher Preview:</span>
          <span className="font-mono font-black text-xs">
            Customer: <span className="underline decoration-emerald-500">{nameInput.trim() || `Player #${suffix}`}</span>
          </span>
        </div>

        {errorMsg && (
          <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 p-2 rounded-xl">
            ⚠️ {errorMsg}
          </p>
        )}

        {savedSuccess && (
          <p className="text-xs font-black text-emerald-700 bg-emerald-100 border border-emerald-300 p-2 rounded-xl text-center animate-bounce">
            ✅ Name saved successfully!
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="w-full py-3 bg-[#10B981] hover:bg-emerald-400 text-black font-black text-sm uppercase rounded-2xl border-3 border-black shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <span className="animate-spin text-base">☕</span>
            ) : (
              <span>Save Name ✨</span>
            )}
          </button>

          {!isDefault ? (
            <button
              onClick={handleResetToAnonymous}
              disabled={saving}
              className="w-full py-2 bg-transparent text-black/60 hover:text-black font-bold text-xs underline cursor-pointer"
            >
              Reset to Anonymous (Player #{suffix})
            </button>
          ) : (
            <button
              onClick={onClose}
              disabled={saving}
              className="w-full py-2.5 bg-white hover:bg-gray-100 text-black font-bold text-xs uppercase rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] cursor-pointer"
            >
              Skip / Keep Anonymous
            </button>
          )}
        </div>

        {/* Cross-Browser / Incognito Profile Sync Accordion */}
        <div className="border-t-2 border-black/10 pt-3 mt-1">
          <button
            type="button"
            onClick={() => setShowSyncSection(!showSyncSection)}
            className="w-full flex items-center justify-between text-xs font-black text-black/70 hover:text-black cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <span>🔄</span> Switch / Restore Profile by ID
            </span>
            <span className="text-xs">{showSyncSection ? "▲" : "▼"}</span>
          </button>

          {showSyncSection && (
            <div className="mt-2.5 p-3 bg-amber-50 border-2 border-amber-400/60 rounded-2xl flex flex-col gap-2 animate-fade-in">
              <p className="text-[11px] text-amber-950 font-medium leading-tight">
                Already have points on Incognito or another browser profile? Enter your 4-letter Player Code (e.g. <strong>9L9X</strong>) to sync your wallet!
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={10}
                  value={syncCodeInput}
                  onChange={(e) => setSyncCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. 9L9X"
                  className="w-full px-3 py-2 bg-white text-black font-mono font-bold text-xs uppercase border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSyncProfile}
                  disabled={syncing}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {syncing ? "..." : "Sync"}
                </button>
              </div>
              {syncError && (
                <p className="text-[10px] font-bold text-red-600">
                  ⚠️ {syncError}
                </p>
              )}
              {syncSuccess && (
                <p className="text-[10px] font-black text-emerald-700">
                  ✅ Profile synced successfully!
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
