"use client";

import React, { useState, useEffect } from "react";
import { getProspectAnalyticsAction } from "../../../app/actions/prospectActions";

interface ProspectGameStat {
  gameSlug: string;
  plays: number;
  totalSeconds: number;
  highScore: number;
}

interface ProspectIntentSignal {
  action: string;
  timestamp: string;
  metadata?: string;
}

interface ProspectSessionData {
  id: string;
  prospectTag: string;
  visitorId: string;
  deviceInfo: string;
  totalTimeSeconds: number;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  isLiveNow: boolean;
  featureTimes: Record<string, number>;
  gamesPlayed: ProspectGameStat[];
  intentSignals: ProspectIntentSignal[];
  walkthroughRequest: { cafeName?: string; contact?: string; requestedAt?: string } | null;
  leadScore: number;
}

export default function ProspectTrackerTab() {
  const [data, setData] = useState<{
    totalProspects: number;
    activeNowCount: number;
    highIntentLeadsCount: number;
    averageTimeSeconds: number;
    rankedFeatures: { name: string; totalSecs: number }[];
    rankedGames: { slug: string; plays: number; seconds: number }[];
    prospects: ProspectSessionData[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [filterSearch, setFilterSearch] = useState("");
  const [selectedProspect, setSelectedProspect] = useState<ProspectSessionData | null>(null);

  // Link Generator State
  const [newProspectName, setNewProspectName] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await getProspectAnalyticsAction();
      if (res.success && res.data) {
        setData(res.data as any);
      }
    } catch (e) {
      console.error("Failed to load prospect analytics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 20000); // auto-refresh every 20s
    return () => clearInterval(interval);
  }, []);

  const handleGenerateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProspectName.trim()) return;

    const slug = encodeURIComponent(newProspectName.trim());
    const baseUrl = typeof window !== "undefined" && window.location.hostname.includes("curaflowstudio.com")
      ? "https://demo.curaflowstudio.com"
      : typeof window !== "undefined"
      ? window.location.origin
      : "https://demo.curaflowstudio.com";

    const link = `${baseUrl}/admin?prospect=${slug}`;
    setGeneratedLink(link);
    setCopied(false);
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatSeconds = (secs: number) => {
    if (!secs || secs < 60) return `${secs || 0}s`;
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}m ${remSecs}s`;
  };

  const filteredProspects = data?.prospects.filter((p) => {
    if (!filterSearch.trim()) return true;
    const term = filterSearch.toLowerCase();
    return (
      p.prospectTag.toLowerCase().includes(term) ||
      p.visitorId.toLowerCase().includes(term) ||
      p.deviceInfo.toLowerCase().includes(term) ||
      (p.walkthroughRequest?.contact && p.walkthroughRequest.contact.toLowerCase().includes(term))
    );
  }) || [];

  return (
    <div className="space-y-6 text-left">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-2xl font-black text-white">Prospect Intelligence & Demo Tracker</h2>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold uppercase rounded-full">
              Live Real-Time
            </span>
          </div>
          <p className="text-xs text-white/50 font-semibold mt-1">
            Track which prospective clients are opening your demo, how long they stay, and what features they love most.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="py-2 px-4 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          <span>🔄</span>
          <span>{loading ? "Refreshing..." : "Refresh Data"}</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111622] border border-white/10 rounded-2xl p-4 shadow-md">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/50 block mb-1">
            Total Prospects
          </span>
          <div className="font-serif text-3xl font-black text-white">{data?.totalProspects || 0}</div>
          <span className="text-[11px] text-white/40 font-semibold mt-1 block">Unique visitors tracked</span>
        </div>

        <div className="bg-[#111622] border border-white/10 rounded-2xl p-4 shadow-md">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Active Right Now
          </span>
          <div className="font-serif text-3xl font-black text-emerald-400">{data?.activeNowCount || 0}</div>
          <span className="text-[11px] text-white/40 font-semibold mt-1 block">Live in last 2 minutes</span>
        </div>

        <div className="bg-[#111622] border border-white/10 rounded-2xl p-4 shadow-md">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FF4C29] block mb-1">
            🔥 Hot Intent Leads
          </span>
          <div className="font-serif text-3xl font-black text-[#FF4C29]">{data?.highIntentLeadsCount || 0}</div>
          <span className="text-[11px] text-white/40 font-semibold mt-1 block">Clicked WhatsApp / &gt;5 min use</span>
        </div>

        <div className="bg-[#111622] border border-white/10 rounded-2xl p-4 shadow-md">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 block mb-1">
            Avg Time on Demo
          </span>
          <div className="font-serif text-3xl font-black text-purple-300">
            {formatSeconds(data?.averageTimeSeconds || 0)}
          </div>
          <span className="text-[11px] text-white/40 font-semibold mt-1 block">Active engagement time</span>
        </div>
      </div>

      {/* Generator Tool: Create Personalized Demo Link for Any Client */}
      <div className="bg-gradient-to-r from-[#161D2B] to-[#1E2638] border border-white/15 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 bg-[#FF4C29] text-white font-mono text-[9px] font-black uppercase rounded tracking-wider">
            SALES LINK GENERATOR
          </span>
          <span className="text-xs font-semibold text-white/60">Send branded link to any prospective cafe owner</span>
        </div>
        <h3 className="font-serif text-lg font-black text-white">Generate Personalized Client Demo Link</h3>
        <p className="text-xs text-white/60 mt-1 max-w-2xl">
          When you send this custom link to a prospect (e.g. <em>Blue Tokai</em> or <em>Third Wave Coffee</em>), all their clicks, games played, and time spent on features will be automatically identified under their name below.
        </p>

        <form onSubmit={handleGenerateLink} className="flex flex-col sm:flex-row gap-3 mt-4">
          <input
            type="text"
            required
            value={newProspectName}
            onChange={(e) => setNewProspectName(e.target.value)}
            placeholder="Client Cafe / Brand Name (e.g. Blue Tokai Cafe)"
            className="flex-1 p-3 rounded-xl border border-white/20 bg-[#0E131F] text-white font-semibold text-xs focus:outline-none focus:border-[#FF4C29]"
          />
          <button
            type="submit"
            className="py-3 px-5 bg-[#FF4C29] hover:bg-[#E03E1D] text-white font-black text-xs rounded-xl border border-white/20 shadow-md hover:translate-y-[-1px] transition-all cursor-pointer whitespace-nowrap"
          >
            Create Tracking Link 🔗
          </button>
        </form>

        {generatedLink && (
          <div className="mt-4 p-3.5 bg-black/40 border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="font-mono text-xs text-emerald-300 truncate w-full sm:w-auto flex-1">
              {generatedLink}
            </div>
            <button
              onClick={handleCopyLink}
              className="py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs rounded-xl shadow cursor-pointer transition-all whitespace-nowrap"
            >
              {copied ? "✓ Copied to Clipboard!" : "Copy Link 📋"}
            </button>
          </div>
        )}
      </div>

      {/* Feature & Game Popularity Insights: "What clients are liking and what not" */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Engaging Features */}
        <div className="bg-[#111622] border border-white/10 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-serif text-base font-black text-white">Feature Popularity Ranking</h4>
              <p className="text-[11px] text-white/50 font-semibold">Total active time spent by prospective clients</p>
            </div>
            <span className="text-xl">🏆</span>
          </div>

          <div className="space-y-3">
            {data?.rankedFeatures && data.rankedFeatures.length > 0 ? (
              data.rankedFeatures.slice(0, 6).map((feat, idx) => {
                const maxSec = data.rankedFeatures[0]?.totalSecs || 1;
                const pct = Math.round((feat.totalSecs / maxSec) * 100);

                return (
                  <div key={feat.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-white/90">
                        <span className="text-white/40 mr-1.5">#{idx + 1}</span>
                        {feat.name}
                      </span>
                      <span className="font-mono text-purple-300">{formatSeconds(feat.totalSecs)}</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-[#FF4C29] h-full rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-white/40 py-4 text-center font-mono">No feature tracking records yet.</div>
            )}
          </div>
        </div>

        {/* Most Played Minigames */}
        <div className="bg-[#111622] border border-white/10 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-serif text-base font-black text-white">Minigame Engagement</h4>
              <p className="text-[11px] text-white/50 font-semibold">Which games prospects actually test & play</p>
            </div>
            <span className="text-xl">🎮</span>
          </div>

          <div className="space-y-3">
            {data?.rankedGames && data.rankedGames.length > 0 ? (
              data.rankedGames.slice(0, 6).map((g, idx) => {
                const maxPlays = data.rankedGames[0]?.plays || 1;
                const pct = Math.round((g.plays / maxPlays) * 100);

                return (
                  <div key={g.slug} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-white/90 uppercase font-mono">
                        <span className="text-white/40 mr-1.5">#{idx + 1}</span>
                        {g.slug.replace(/-/g, " ")}
                      </span>
                      <span className="font-mono text-emerald-400">
                        {g.plays} plays ({formatSeconds(g.seconds)})
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-white/40 py-4 text-center font-mono">No minigame sessions recorded yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Prospect Activity Table */}
      <div className="bg-[#111622] border border-white/10 rounded-3xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h4 className="font-serif text-base font-black text-white">All Prospective Client Sessions</h4>
            <p className="text-[11px] text-white/50 font-semibold">Click any prospect row to inspect their exact journey</p>
          </div>

          <input
            type="text"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Search by client name, device, contact..."
            className="p-2.5 rounded-xl border border-white/20 bg-[#0E131F] text-white font-semibold text-xs focus:outline-none focus:border-[#FF4C29] w-full sm:w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/50 font-mono text-[10px] uppercase">
                <th className="py-3 px-3">Client / Prospect</th>
                <th className="py-3 px-3">Live Status</th>
                <th className="py-3 px-3">Time Spent</th>
                <th className="py-3 px-3">Lead Intent</th>
                <th className="py-3 px-3">Games Tested</th>
                <th className="py-3 px-3">Device</th>
                <th className="py-3 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-semibold">
              {filteredProspects.length > 0 ? (
                filteredProspects.map((p) => {
                  const hasCallback = !!p.walkthroughRequest?.contact;
                  const hasWhatsApp = p.intentSignals.some((s) => s.action.includes("whatsapp"));

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProspect(p)}
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white text-xs flex items-center gap-2">
                          <span>{p.prospectTag}</span>
                          {p.leadScore >= 70 && (
                            <span className="px-1.5 py-0.5 bg-[#FF4C29]/20 text-[#FF4C29] text-[9px] font-mono uppercase font-black rounded">
                              HOT 🔥
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-white/40 block mt-0.5">
                          ID: {p.visitorId.substring(0, 12)}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        {p.isLiveNow ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            ONLINE NOW
                          </span>
                        ) : (
                          <span className="text-white/40 font-mono text-[11px]">
                            {p.lastSeenAt ? new Date(p.lastSeenAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently"}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-purple-300">
                        {formatSeconds(p.totalTimeSeconds)}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap gap-1.5">
                          {hasCallback && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-lg border border-amber-500/30">
                              📞 Requested Call
                            </span>
                          )}
                          {hasWhatsApp && (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-lg border border-emerald-500/30">
                              💬 Clicked WhatsApp
                            </span>
                          )}
                          {!hasCallback && !hasWhatsApp && (
                            <span className="text-white/40 text-[11px]">Browsing demo</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono text-xs">
                        {p.gamesPlayed.length > 0 ? (
                          <span className="text-emerald-400">
                            🎮 {p.gamesPlayed.length} games ({p.gamesPlayed.reduce((acc, g) => acc + g.plays, 0)} rounds)
                          </span>
                        ) : (
                          <span className="text-white/30">0 played</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-white/50 text-[11px] font-mono">
                        {p.deviceInfo}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <button className="py-1 px-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold cursor-pointer">
                          Inspect →
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/40 font-mono text-xs">
                    No prospect sessions matching the filter. Send out a demo link to start tracking!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prospect Detail Drawer / Modal */}
      {selectedProspect && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#161D2B] border border-white/20 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative text-left text-white my-6">
            <button
              onClick={() => setSelectedProspect(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold hover:bg-white hover:text-black transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-[#FF4C29] text-white font-mono text-[9px] font-black uppercase rounded">
                PROSPECT DEEP-DIVE
              </span>
              <span className="text-xs text-white/50 font-mono">ID: {selectedProspect.visitorId}</span>
            </div>

            <h3 className="font-serif text-2xl font-black text-white">{selectedProspect.prospectTag}</h3>
            <p className="text-xs text-white/60 font-semibold mt-1">
              Device: {selectedProspect.deviceInfo} • Total Active Demo Time:{" "}
              <strong className="text-purple-300 font-mono">{formatSeconds(selectedProspect.totalTimeSeconds)}</strong>
            </p>

            {/* Callback Request Info if available */}
            {selectedProspect.walkthroughRequest && (
              <div className="my-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                <span className="text-[10px] font-mono uppercase font-black text-amber-400 block mb-1">
                  📞 5-Min Walkthrough Request:
                </span>
                <div className="text-xs font-bold text-white">
                  Cafe Name: {selectedProspect.walkthroughRequest.cafeName || "N/A"}
                </div>
                <div className="text-xs font-mono text-emerald-300 mt-0.5">
                  Contact: {selectedProspect.walkthroughRequest.contact || "N/A"}
                </div>
              </div>
            )}

            {/* Feature Time Breakdown */}
            <div className="my-5">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white/50 mb-3">
                Feature Time Breakdown (What they explored):
              </h4>
              <div className="space-y-2">
                {Object.entries(selectedProspect.featureTimes).map(([feat, secs]) => (
                  <div key={feat} className="flex justify-between items-center p-2.5 bg-white/5 rounded-xl text-xs font-semibold">
                    <span>{feat}</span>
                    <span className="font-mono text-purple-300 font-bold">{formatSeconds(Number(secs))}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Games Tested */}
            <div className="my-5">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white/50 mb-3">
                Minigames Played:
              </h4>
              {selectedProspect.gamesPlayed.length > 0 ? (
                <div className="space-y-2">
                  {selectedProspect.gamesPlayed.map((g) => (
                    <div key={g.gameSlug} className="flex justify-between items-center p-2.5 bg-white/5 rounded-xl text-xs font-semibold">
                      <span className="uppercase font-mono">🎮 {g.gameSlug.replace(/-/g, " ")}</span>
                      <span className="font-mono text-emerald-300">
                        {g.plays} rounds • {formatSeconds(g.totalSeconds)} • High Score: {g.highScore}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-white/40 italic">Client did not play any minigames yet.</div>
              )}
            </div>

            {/* Intent Event Log */}
            <div className="my-5">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white/50 mb-3">
                Action & Intent Signals:
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {selectedProspect.intentSignals.map((sig, i) => (
                  <div key={i} className="text-xs text-white/70 font-mono flex items-center justify-between p-2 bg-black/20 rounded-lg">
                    <span>⚡ {sig.action}</span>
                    <span className="text-white/40 text-[10px]">
                      {new Date(sig.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedProspect(null)}
                className="py-2.5 px-5 bg-white text-black font-black text-xs rounded-xl shadow cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
