"use client";

import React, { useState, useEffect } from "react";
import { getStoreStaffConfigAction, saveStoreStaffConfigAction } from "../../app/actions/staffActions";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  shift?: string;
  pin?: string;
  active: boolean;
}

interface StaffTabProps {
  currentStore: string;
}

const DEFAULT_STAFF: StaffMember[] = [
  { id: "stf-1", name: "Rohan Sharma", role: "Head Barista", shift: "Morning Counter #1", pin: "1234", active: true },
  { id: "stf-2", name: "Priya Verma", role: "Cashier", shift: "Afternoon Counter #2", pin: "1234", active: true },
  { id: "stf-3", name: "Aman Gupta", role: "Floor Lead", shift: "Evening Counter #1", pin: "1234", active: true },
];

export default function StaffTab({ currentStore }: StaffTabProps) {
  const [staffPin, setStaffPin] = useState("1234");
  const [editingPin, setEditingPin] = useState(false);
  const [tempPin, setTempPin] = useState("1234");
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(DEFAULT_STAFF);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Add Staff Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Cashier");
  const [newShift, setNewShift] = useState("Counter #1");
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      setLoading(true);
      try {
        const res = await getStoreStaffConfigAction(currentStore);
        if (res.success) {
          setStaffPin(res.staffPin);
          setTempPin(res.staffPin);
          setStaffMembers(res.staffMembers);
        }
      } catch (err) {
        console.error("Failed to fetch staff config", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [currentStore]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSavePin = async () => {
    if (!tempPin.trim() || tempPin.trim().length < 4) {
      alert("PIN must be at least 4 digits");
      return;
    }
    setSaving(true);
    try {
      const res = await saveStoreStaffConfigAction({
        storeName: currentStore,
        staffPin: tempPin.trim(),
        staffMembers,
      });
      if (res.success) {
        setStaffPin(tempPin.trim());
        setEditingPin(false);
        showToast("✓ Counter Staff PIN updated successfully!");
      }
    } catch (e) {
      alert("Failed to update PIN");
    } finally {
      setSaving(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newMember: StaffMember = {
      id: `stf-${Date.now().toString(36)}`,
      name: newName.trim(),
      role: newRole,
      shift: newShift,
      pin: staffPin,
      active: true,
    };

    const updated = [...staffMembers, newMember];
    setStaffMembers(updated);
    setShowAddModal(false);
    setNewName("");

    setSaving(true);
    try {
      await saveStoreStaffConfigAction({
        storeName: currentStore,
        staffPin,
        staffMembers: updated,
      });
      showToast(`✓ Added staff member "${newMember.name}"!`);
    } catch {
      alert("Failed to save staff member");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    const updated = staffMembers.map((m) =>
      m.id === id ? { ...m, active: !m.active } : m
    );
    setStaffMembers(updated);
    try {
      await saveStoreStaffConfigAction({
        storeName: currentStore,
        staffPin,
        staffMembers: updated,
      });
      showToast("Staff status updated");
    } catch {}
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Remove staff member "${name}"?`)) return;
    const updated = staffMembers.filter((m) => m.id !== id);
    setStaffMembers(updated);
    try {
      await saveStoreStaffConfigAction({
        storeName: currentStore,
        staffPin,
        staffMembers: updated,
      });
      showToast(`Removed "${name}" from roster`);
    } catch {}
  };

  const getClaimUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/claim`;
    }
    return "https://demo.curaflowstudio.com/claim";
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getClaimUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-black text-white px-5 py-3 rounded-2xl border-2 border-emerald-400 font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <span>✅</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-black text-black">Staff & Counter Claim Management</h2>
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] uppercase rounded-full">
              Counter Terminals
            </span>
          </div>
          <p className="text-xs text-black/60 font-semibold mt-1">
            Configure staff members and counter PINs so cashiers and baristas can verify customer reward vouchers at{" "}
            <code className="bg-black/5 px-1.5 py-0.5 rounded font-mono text-black font-bold">/claim</code>.
          </p>
        </div>

        <a
          href="/claim"
          target="_blank"
          rel="noopener noreferrer"
          className="py-2.5 px-5 bg-[#FF4C29] hover:bg-[#E03E1D] text-white border-2 border-black rounded-xl font-black text-xs shadow-[3px_3px_0px_0px_#000] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center gap-2"
        >
          <span>Launch Counter Terminal (/claim)</span>
          <span>🚀</span>
        </a>
      </div>

      {/* Top 2 Quick Cards: Counter PIN & Quick Portal Link */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Counter PIN Widget */}
        <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#000000]">
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase rounded-full tracking-wider">
              ✦ SECURITY & TERMINAL ACCESS
            </span>
            <span className="text-xl">🔐</span>
          </div>

          <h3 className="font-serif text-lg font-black text-black">Master Counter Staff PIN</h3>
          <p className="text-xs text-black/60 font-semibold mt-1">
            Cashiers and counter staff enter this 4-digit PIN to access <code className="font-mono font-bold text-black">/claim</code> without needing your manager login credentials.
          </p>

          <div className="mt-5 p-4 bg-[#F6F3EB] border-2 border-black rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-black/40 block">
                Active Staff Counter PIN
              </span>
              {editingPin ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    maxLength={6}
                    value={tempPin}
                    onChange={(e) => setTempPin(e.target.value.replace(/\D/g, ""))}
                    className="w-24 p-2 text-center text-xl font-mono font-black border-2 border-black rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4C29]"
                    placeholder="1234"
                  />
                  <button
                    onClick={handleSavePin}
                    disabled={saving}
                    className="py-2 px-3 bg-black text-white text-xs font-bold rounded-xl border border-black hover:bg-emerald-600 transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setTempPin(staffPin);
                      setEditingPin(false);
                    }}
                    className="py-2 px-2.5 bg-black/10 text-black text-xs font-bold rounded-xl hover:bg-black/20 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-mono text-3xl font-black text-black tracking-widest bg-white px-3 py-0.5 rounded-lg border border-black/20">
                    {staffPin}
                  </span>
                  <button
                    onClick={() => setEditingPin(true)}
                    className="text-xs font-bold text-black/60 hover:text-black underline cursor-pointer"
                  >
                    Change PIN
                  </button>
                </div>
              )}
            </div>

            <div className="text-right sm:text-right">
              <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold">
                ✓ Active for {currentStore || "Store"}
              </span>
            </div>
          </div>
        </div>

        {/* Counter Portal Terminal Sharing */}
        <div className="bg-[#111111] text-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#FF4C29]">
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 bg-[#FF4C29] text-white text-[10px] font-black uppercase rounded-full tracking-wider">
              ✦ REGISTER TERMINAL LINK
            </span>
            <span className="text-xl">📱</span>
          </div>

          <h3 className="font-serif text-lg font-black text-white">Share Counter Link with Staff</h3>
          <p className="text-xs text-white/60 font-semibold mt-1">
            Bookmark this URL on your cashier tablets or counter smartphones. Staff can instantly scan customer vouchers to approve discounts.
          </p>

          <div className="mt-5 p-3.5 bg-white/5 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <code className="font-mono text-xs text-emerald-300 truncate w-full sm:w-auto flex-1">
              {getClaimUrl()}
            </code>
            <button
              onClick={handleCopyLink}
              className="py-2 px-4 bg-white text-black font-black text-xs rounded-xl shadow cursor-pointer hover:bg-emerald-400 transition-colors whitespace-nowrap"
            >
              {copiedLink ? "✓ Copied Link!" : "Copy URL 📋"}
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-white/50">
            <span>💡</span>
            <span>Staff can tap &quot;Quick Access&quot; and enter PIN <strong>{staffPin}</strong> to verify vouchers.</span>
          </div>
        </div>
      </div>

      {/* Staff Roster Table */}
      <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#000000]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="font-serif text-lg font-black text-black">Active Staff Roster & Shifts</h3>
            <p className="text-xs text-black/60 font-semibold">
              Add baristas and cashiers. Every claimed voucher records which staff member authorized it.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="py-2.5 px-4 bg-black hover:bg-[#FF4C29] text-white font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>Add Staff Member</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-black/10 text-black/50 font-black uppercase text-[10px]">
                <th className="py-3 px-3">Staff Name</th>
                <th className="py-3 px-3">Role / Designation</th>
                <th className="py-3 px-3">Counter / Shift</th>
                <th className="py-3 px-3">Counter PIN</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 font-semibold">
              {staffMembers.length > 0 ? (
                staffMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-black/[0.02] transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-black text-sm flex items-center gap-2">
                        <span>👤</span>
                        <span>{member.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 bg-black/5 text-black border border-black/10 rounded-lg text-xs font-bold">
                        {member.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-black/70 font-mono text-xs">
                      {member.shift || "Main Counter"}
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-black/70">
                      •••• ({member.pin || staffPin})
                    </td>

                    <td className="py-3.5 px-3">
                      <button
                        onClick={() => handleToggleActive(member.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase cursor-pointer border ${
                          member.active
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-red-100 text-red-700 border-red-300"
                        }`}
                      >
                        {member.active ? "Active" : "Off Duty"}
                      </button>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteStaff(member.id, member.name)}
                        className="text-black/40 hover:text-red-600 transition-colors p-1 cursor-pointer font-bold"
                        title="Remove staff"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-black/40 font-mono text-xs">
                    No staff members configured. Click &quot;Add Staff Member&quot; to set up your counter team.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#F6F3EB] border-4 border-black rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[8px_8px_0px_0px_#000] relative text-left">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center font-bold text-xs hover:bg-black hover:text-white transition-colors cursor-pointer"
            >
              ✕
            </button>

            <span className="px-2.5 py-0.5 bg-[#FF4C29] text-white font-mono text-[9px] font-black uppercase rounded">
              TEAM MANAGEMENT
            </span>
            <h3 className="font-serif text-2xl font-black text-black mt-2">Add Counter Staff</h3>
            <p className="text-xs text-black/60 font-semibold mt-1">
              Add a team member on duty to verify customer reward vouchers.
            </p>

            <form onSubmit={handleAddStaff} className="mt-5 space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-black/70 block mb-1">
                  Staff Member Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rohan Sharma"
                  className="w-full p-3 bg-white border-2 border-black rounded-xl font-bold text-xs text-black focus:outline-none focus:ring-2 focus:ring-[#FF4C29]"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-black/70 block mb-1">
                  Role / Position
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full p-3 bg-white border-2 border-black rounded-xl font-bold text-xs text-black focus:outline-none focus:ring-2 focus:ring-[#FF4C29]"
                >
                  <option value="Cashier">Cashier</option>
                  <option value="Head Barista">Head Barista</option>
                  <option value="Floor Manager">Floor Manager</option>
                  <option value="Counter Lead">Counter Lead</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-black/70 block mb-1">
                  Counter / Shift Location
                </label>
                <input
                  type="text"
                  value={newShift}
                  onChange={(e) => setNewShift(e.target.value)}
                  placeholder="e.g. Counter #1 (Morning Shift)"
                  className="w-full p-3 bg-white border-2 border-black rounded-xl font-bold text-xs text-black focus:outline-none focus:ring-2 focus:ring-[#FF4C29]"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-black hover:bg-[#FF4C29] text-white font-black text-xs rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-y-[-1px] transition-all cursor-pointer"
                >
                  {saving ? "Saving..." : "Add to Counter Roster →"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-3 px-4 bg-white text-black font-bold text-xs rounded-xl border-2 border-black cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
