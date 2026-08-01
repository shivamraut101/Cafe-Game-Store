"use client";

import React, { useState } from "react";
import CustomDropdown from "../CustomDropdown";

export default function AuditLogsTab() {
  const [filter, setFilter] = useState("All Actions");

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-black mb-2">Audit Logs</h2>
          <p className="text-sm font-semibold text-black/60">Monitor security and track all actions in the dashboard.</p>
        </div>
        <div className="w-48">
          <CustomDropdown 
            options={["All Actions", "Campaign Changes", "Billing & Credits", "Authentication"]}
            value={filter}
            onChange={setFilter}
          />
        </div>
      </div>

      <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_#000000]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-[#FBF9F4] text-xs font-bold uppercase tracking-wider text-black">
                <th className="p-4 pl-6">Timestamp</th>
                <th className="p-4">Action Type</th>
                <th className="p-4">User</th>
                <th className="p-4 pr-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10 text-sm">
              {[
                { id: 1, time: "Today, 10:42 AM", action: "STORE_GAME_TOGGLE", user: "manager@brewbites.com", details: "Toggled Spin the Wheel to Active" },
                { id: 2, time: "Today, 10:35 AM", action: "SETTINGS_UPDATE", user: "manager@brewbites.com", details: "Changed 'Spin the Wheel' win rate to 15%" },
                { id: 3, time: "Yesterday, 04:20 PM", action: "QR_GENERATED", user: "manager@brewbites.com", details: "Generated AI QR Code (Cost: 50 Credits)" },
                { id: 4, time: "Yesterday, 09:00 AM", action: "LOGIN_SUCCESS", user: "manager@brewbites.com", details: "Logged in from IP 192.168.1.104" },
                { id: 5, time: "Oct 24, 2026", action: "BILLING_TOPUP", user: "owner@brewbites.com", details: "Purchased 2,000 AI Credits ($32.00)" },
                { id: 6, time: "Oct 20, 2026", action: "STORE_CREATED", user: "koushik@forstore.app", details: "Provisioned new store: Brew & Bites Cafe" },
              ].map((log) => (
                <tr key={log.id} className="hover:bg-black/[0.02] font-semibold">
                  <td className="p-4 pl-6 text-black/50 text-xs whitespace-nowrap">{log.time}</td>
                  <td className="p-4">
                    <span className="bg-black/5 text-black px-2 py-1 rounded border border-black/10 text-[10px] font-bold font-mono">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-black/70">{log.user}</td>
                  <td className="p-4 pr-6 text-black">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
