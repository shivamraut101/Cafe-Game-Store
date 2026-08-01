export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  actorRole: "Super Admin" | "Store Admin";
  ipAddress: string;
  action: string;
  actionCategory: "SECURITY" | "BILLING" | "BRANDING" | "CAMPAIGN" | "SYSTEM";
  targetType: "Store Account" | "Game Campaign" | "Wallet" | "Domain Config";
  targetName: string;
  details: string;
}

const initialLogs: AuditLogEntry[] = [
  {
    id: "AUD-9821",
    timestamp: "2026-07-31 22:50:14 UTC",
    actorName: "Koushik (Super Admin)",
    actorEmail: "koushik@forstore.app",
    actorRole: "Super Admin",
    ipAddress: "157.48.22.19",
    action: "SUPER_ADMIN_CREDIT_GRANT",
    actionCategory: "BILLING",
    targetType: "Wallet",
    targetName: "Brew & Bites Cafe (Main Branch)",
    details: "Granted +1,000 bonus scan credits to store wallet.",
  },
  {
    id: "AUD-9820",
    timestamp: "2026-07-31 21:14:02 UTC",
    actorName: "Sarah Jenkins (Store Admin)",
    actorEmail: "manager@downtowntacos.com",
    actorRole: "Store Admin",
    ipAddress: "192.168.1.104",
    action: "STORE_BRANDING_UPDATE",
    actionCategory: "BRANDING",
    targetType: "Domain Config",
    targetName: "Downtown Tacos & Tequila",
    details: "Updated primary brand color to #FF4C29 and uploaded logo.",
  },
  {
    id: "AUD-9819",
    timestamp: "2026-07-31 18:30:45 UTC",
    actorName: "Koushik (Super Admin)",
    actorEmail: "koushik@forstore.app",
    actorRole: "Super Admin",
    ipAddress: "157.48.22.19",
    action: "SUPER_ADMIN_PLAN_CHANGE",
    actionCategory: "BILLING",
    targetType: "Store Account",
    targetName: "Corner Bakery & Espresso",
    details: "Upgraded subscription tier from Starter to Pro Store Plan ($29/mo).",
  },
  {
    id: "AUD-9818",
    timestamp: "2026-07-31 16:42:10 UTC",
    actorName: "Alex Rivera (Store Admin)",
    actorEmail: "contact@pixelarcade.io",
    actorRole: "Store Admin",
    ipAddress: "182.72.44.91",
    action: "STORE_GAME_TOGGLE",
    actionCategory: "CAMPAIGN",
    targetType: "Game Campaign",
    targetName: "Slot Machine Minigame",
    details: "Activated Slot Machine campaign for arcade customers.",
  },
  {
    id: "AUD-9817",
    timestamp: "2026-07-31 14:05:22 UTC",
    actorName: "Koushik (Super Admin)",
    actorEmail: "koushik@forstore.app",
    actorRole: "Super Admin",
    ipAddress: "157.48.22.19",
    action: "SUPER_ADMIN_IMPERSONATE",
    actionCategory: "SECURITY",
    targetType: "Store Account",
    targetName: "Brew & Bites Cafe (Main Branch)",
    details: "Super Admin initiated portal impersonation session for merchant support.",
  },
];

let globalLogs: AuditLogEntry[] = [...initialLogs];

export function getAuditLogs(): AuditLogEntry[] {
  return globalLogs;
}

export function logAction(entry: Omit<AuditLogEntry, "id" | "timestamp">): AuditLogEntry {
  const newEntry: AuditLogEntry = {
    ...entry,
    id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
  };
  globalLogs = [newEntry, ...globalLogs];
  return newEntry;
}

export function filterAuditLogs(
  logs: AuditLogEntry[],
  searchQuery: string,
  categoryFilter: string,
  roleFilter: string
): AuditLogEntry[] {
  return logs.filter(log => {
    const matchesSearch =
      searchQuery === "" ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "ALL" || log.actionCategory === categoryFilter;

    const matchesRole = roleFilter === "ALL" || log.actorRole === roleFilter;

    return matchesSearch && matchesCategory && matchesRole;
  });
}
