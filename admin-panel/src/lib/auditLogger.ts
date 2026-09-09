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

const initialLogs: AuditLogEntry[] = [];

let globalLogs: AuditLogEntry[] = [];

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
