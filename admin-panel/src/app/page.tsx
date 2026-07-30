"use client";

import React, { useState } from "react";

interface Game {
  id: string;
  name: string;
  type: string;
  icon: string;
  status: "Active" | "Inactive";
  scans: number;
  winRate: string;
  shadowColor: string;
}

const initialGames: Game[] = [
  { id: "1", name: "Spin the Wheel", type: "Wheel", icon: "🎡", status: "Active", scans: 1420, winRate: "15%", shadowColor: "shadow-flat-purple" },
  { id: "2", name: "Instant Lottery", type: "Scratch", icon: "🎟️", status: "Active", scans: 950, winRate: "8%", shadowColor: "shadow-flat-orange" },
  { id: "3", name: "Slot Machine", type: "Slots", icon: "🎰", status: "Active", scans: 2100, winRate: "12%", shadowColor: "shadow-flat-pink" },
  { id: "4", name: "Catch & Win", type: "Catch", icon: "🧺", status: "Inactive", scans: 430, winRate: "20%", shadowColor: "shadow-flat-green" },
  { id: "5", name: "Snakes & Ladders", type: "Board", icon: "🐍", status: "Active", scans: 880, winRate: "10%", shadowColor: "shadow-flat-black" },
];

export default function AdminDashboard() {
  const [games, setGames] = useState<Game[]>(initialGames);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [newGameIcon, setNewGameIcon] = useState("🎡");

  const toggleStatus = (id: string) => {
    setGames(prev =>
      prev.map(g => (g.id === id ? { ...g, status: g.status === "Active" ? "Inactive" : "Active" } : g))
    );
  };

  const addGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim()) return;

    const newGame: Game = {
      id: String(games.length + 1),
      name: newGameName,
      type: "Custom",
      icon: newGameIcon,
      status: "Active",
      scans: 0,
      winRate: "10%",
      shadowColor: "shadow-flat-yellow",
    };

    setGames([...games, newGame]);
    setNewGameName("");
    setShowAddModal(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F3EB]">
      {/* Navigation Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b-2 border-black bg-white max-w-7xl mx-auto w-full mt-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-lg">⚙️</span>
          </div>
          <span className="font-serif font-black text-2xl tracking-tight">ForStore Admin</span>
        </div>

        <nav className="flex items-center gap-6 font-semibold">
          <span className="bg-orange-50 border border-orange-200 text-[#FF4C29] px-3 py-1 rounded-full text-xs font-bold">
            Live Dashboard
          </span>
          <a href="/" className="hover:text-black/70 transition-colors text-sm">
            View Live Site ↗
          </a>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-10 flex flex-col gap-10">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl font-bold text-black">Loyalty Game Management</h1>
            <p className="text-[#4A4A4A] mt-1">Design, monitor, and configure QR code loyalty games for your stores.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#111111] text-white py-3.5 px-6 rounded-xl font-bold border-2 border-black shadow-[4px_4px_0px_0px_#FF4C29] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#FF4C29] transition-all text-sm flex items-center gap-2 self-start sm:self-auto"
          >
            + Create New Game
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#8B5CF6]">
            <p className="text-xs font-bold text-black/50 tracking-wider">TOTAL SCANS</p>
            <h3 className="font-serif text-3xl font-black mt-2 text-black">5,780</h3>
            <span className="text-emerald-700 text-xs font-bold block mt-2">↑ 14% vs last week</span>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#FF4C29]">
            <p className="text-xs font-bold text-black/50 tracking-wider">ACTIVE GAMES</p>
            <h3 className="font-serif text-3xl font-black mt-2 text-black">
              {games.filter(g => g.status === "Active").length} / {games.length}
            </h3>
            <span className="text-black/60 text-xs font-bold block mt-2">Running across 3 locations</span>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#10B981]">
            <p className="text-xs font-bold text-black/50 tracking-wider">TOTAL REWARDS CLAIMED</p>
            <h3 className="font-serif text-3xl font-black mt-2 text-black">812</h3>
            <span className="text-emerald-700 text-xs font-bold block mt-2">Win Rate Average: ~12%</span>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#F59E0B]">
            <p className="text-xs font-bold text-black/50 tracking-wider">NEW LOYALTY USERS</p>
            <h3 className="font-serif text-3xl font-black mt-2 text-black">1,245</h3>
            <span className="text-emerald-700 text-xs font-bold block mt-2">↑ 22% monthly growth</span>
          </div>
        </div>

        {/* Table & Management Container */}
        <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_#000000]">
          <div className="bg-black/5 p-5 border-b-2 border-black flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-black">Configure Store Games</h2>
            <span className="text-xs font-semibold text-black/60">Updated just now</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-black bg-[#FBF9F4] text-xs font-bold uppercase tracking-wider text-black">
                  <th className="p-4 pl-6">Game Info</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Total Scans</th>
                  <th className="p-4">Win Probability</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {games.map(game => (
                  <tr key={game.id} className="hover:bg-black/[0.02] transition-colors text-sm text-black">
                    <td className="p-4 pl-6 font-semibold flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg border border-black/20 flex items-center justify-center text-lg bg-white ${game.shadowColor.replace("shadow-flat-", "bg-")}-50`}>
                        {game.icon}
                      </div>
                      {game.name}
                    </td>
                    <td className="p-4 font-medium text-black/70">{game.type}</td>
                    <td className="p-4 font-bold">{game.scans}</td>
                    <td className="p-4 font-semibold">{game.winRate}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                        game.status === "Active"
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                          : "bg-red-50 border-red-300 text-red-800"
                      }`}>
                        {game.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => toggleStatus(game.id)}
                          className="bg-transparent border border-black hover:bg-black/5 font-semibold text-xs py-1.5 px-3 rounded-lg transition-colors"
                        >
                          {game.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                        <button className="bg-[#111111] text-white hover:bg-black/85 font-semibold text-xs py-1.5 px-3 rounded-lg transition-colors">
                          Config
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create New Game Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#F6F3EB] rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_#000000] p-6 max-w-md w-full relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 font-bold text-lg hover:text-black/70"
            >
              ✕
            </button>
            <h3 className="font-serif text-2xl font-bold text-black mb-4">Create New Loyalty Game</h3>
            <form onSubmit={addGame} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-black/70 uppercase tracking-wider mb-1.5">
                  Game Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Memory Matching"
                  value={newGameName}
                  onChange={e => setNewGameName(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-black bg-white focus:outline-none focus:ring-1 focus:ring-[#FF4C29]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black/70 uppercase tracking-wider mb-1.5">
                  Select Game Icon
                </label>
                <div className="grid grid-cols-5 gap-2 text-2xl">
                  {["🎡", "🎟️", "🎰", "🧺", "🐍", "👆", "🎲", "🧩", "🃏", "🎳"].map(ico => (
                    <button
                      key={ico}
                      type="button"
                      onClick={() => setNewGameIcon(ico)}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        newGameIcon === ico ? "border-[#FF4C29] bg-white scale-110" : "border-transparent hover:bg-black/5"
                      }`}
                    >
                      {ico}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border-2 border-black rounded-xl font-bold text-sm bg-white hover:bg-black/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#111111] text-white rounded-xl font-bold text-sm border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#FF4C29] transition-all"
                >
                  Create Game
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
