"use client";

import React, { useState, useEffect } from "react";
import CustomDropdown from "../CustomDropdown";
import { getAuditLogsAction } from "../../app/actions/adminActions";

export default function AuditLogsTab() {
  const [filter, setFilter] = useState("All Actions");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getAuditLogsAction();
      if (res.success && res.logs) {
        setLogs(res.logs);
      }
    } catch (e) {
      console.error("Failed to fetch audit logs from DB", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12 select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-black mb-1">Audit Logs (Live DB)</h2>
          <p className="text-sm font-semibold text-black/60">Monitor security and track all live system actions in MongoDB Atlas.</p>
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
                <th className="p-4">Actor Email</th>
                <th className="p-4 pr-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-xs font-bold text-black/40">
                    Loading audit logs from MongoDB Atlas...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-xs font-bold text-black/40">
                    No audit logs recorded in database.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-black/[0.02] font-semibold">
                    <td className="p-4 pl-6 text-black/50 text-xs whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-4">
                      <span className="bg-black/5 text-black px-2 py-1 rounded border border-black/10 text-[10px] font-bold font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-black/70">{log.actorEmail}</td>
                    <td className="p-4 pr-6 text-black">{log.details}</td>
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
