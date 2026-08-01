"use client";

import React, { useState } from "react";
import { AuditLogEntry, filterAuditLogs } from "../lib/auditLogger";

interface AuditLogViewerProps {
  logs: AuditLogEntry[];
  title?: string;
  subtitle?: string;
}

export default function AuditLogViewer({
  logs,
  title = "System Security & Action Audit Trail",
  subtitle = "Real-time record of who performed actions, client IP addresses, actions taken, and target items.",
}: AuditLogViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const filteredLogs = filterAuditLogs(logs, searchQuery, categoryFilter, roleFilter);

  const handleExportCSV = () => {
    const headers = ["ID", "Timestamp", "Actor Name", "Actor Email", "Role", "IP Address", "Category", "Action", "Target Type", "Target Name", "Details"];
    const rows = filteredLogs.map(l => [
      l.id,
      l.timestamp,
      `"${l.actorName}"`,
      l.actorEmail,
      l.actorRole,
      l.ipAddress,
      l.actionCategory,
      l.action,
      l.targetType,
      `"${l.targetName}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit-log-export-${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📜</span>
            <h2 className="font-serif text-2xl font-bold text-black">{title}</h2>
          </div>
          <p className="text-[#4A4A4A] text-sm mt-1">{subtitle}</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-[#111111] text-white px-5 py-2.5 rounded-xl font-bold border-2 border-black shadow-[3px_3px_0px_0px_#10B981] hover:translate-y-[1px] text-xs flex items-center gap-2 self-start sm:self-auto"
        >
          📥 Export Audit CSV
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border-2 border-black shadow-[2px_2px_0px_0px_#000000] flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Search by IP, actor email, action, or target store..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full p-2.5 rounded-xl border-2 border-black bg-[#FBF9F4] text-xs font-semibold focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="text-black/60">Category:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="p-2 rounded-lg border-2 border-black bg-[#FBF9F4]"
            >
              <option value="ALL">All Categories</option>
              <option value="SECURITY">Security</option>
              <option value="BILLING">Billing & Credits</option>
              <option value="BRANDING">Branding</option>
              <option value="CAMPAIGN">Campaigns</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-black/60">Role:</span>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="p-2 rounded-lg border-2 border-black bg-[#FBF9F4]"
            >
              <option value="ALL">All Roles</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Store Admin">Store Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_#000000]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-[#FBF9F4] text-xs font-bold uppercase tracking-wider text-black">
                <th className="p-4 pl-6">ID & Timestamp</th>
                <th className="p-4">Actor (By Whom)</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Action Taken</th>
                <th className="p-4">Target Entity (On Whom)</th>
                <th className="p-4 pr-6">Action Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs font-bold text-black/50">
                    No audit log events match your search query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-black/[0.02]">
                    <td className="p-4 pl-6">
                      <div className="font-mono font-bold text-xs text-black">{log.id}</div>
                      <div className="text-[11px] text-black/50 font-medium">{log.timestamp}</div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-xs text-black">{log.actorName}</div>
                      <div className="text-[11px] text-black/60 font-mono">{log.actorEmail}</div>
                      <span
                        className={`inline-block text-[9px] font-black uppercase px-2 py-0.2 rounded border mt-1 ${
                          log.actorRole === "Super Admin"
                            ? "bg-red-50 border-red-300 text-red-800"
                            : "bg-purple-50 border-purple-300 text-purple-800"
                        }`}
                      >
                        {log.actorRole}
                      </span>
                    </td>

                    <td className="p-4 font-mono font-bold text-xs text-indigo-700">
                      {log.ipAddress}
                    </td>

                    <td className="p-4">
                      <span className="font-mono text-xs font-bold text-black bg-black/5 px-2 py-1 rounded border border-black/20 block w-max">
                        {log.action}
                      </span>
                      <span className="text-[10px] font-bold text-black/40 uppercase block mt-1">
                        Category: {log.actionCategory}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-xs text-black">{log.targetName}</div>
                      <div className="text-[10px] font-semibold text-black/50">{log.targetType}</div>
                    </td>

                    <td className="p-4 pr-6 text-xs text-black/80 font-medium max-w-xs leading-relaxed">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
