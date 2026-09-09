"use server";

import connectDB from "../../lib/db";
import { ProspectSession, IProspectSession } from "../../lib/models";

/**
 * Server Action: Heartbeat & Active Feature Time Tracker
 * Increments total time and specific feature duration for a prospective client.
 * Tracks device persistence and return visits.
 */
export async function recordProspectHeartbeatAction(data: {
  visitorId: string;
  deviceId?: string;
  prospectTag?: string;
  activeFeature?: string;
  secondsDelta: number;
  deviceInfo?: string;
  isNewVisit?: boolean;
}) {
  try {
    await connectDB();
    const { visitorId, deviceId, prospectTag, activeFeature, secondsDelta, deviceInfo, isNewVisit } = data;
    if (!visitorId) return { success: false, error: "Visitor ID required" };

    const cleanTag = prospectTag?.trim() || `Visitor-${visitorId.substring(0, 6)}`;
    const delta = Math.max(1, Math.min(secondsDelta, 120)); // cap delta between 1-120s

    let session = await ProspectSession.findOne({
      $or: [
        { visitorId },
        ...(deviceId ? [{ deviceId }] : []),
      ],
    });

    if (!session) {
      session = new ProspectSession({
        visitorId,
        deviceId: deviceId || "",
        prospectTag: cleanTag,
        deviceInfo: deviceInfo || "Browser",
        visitCount: 1,
        totalTimeSeconds: delta,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        featureTimes: activeFeature ? { [activeFeature]: delta } : {},
        gamesPlayed: [],
        intentSignals: [{ action: "first_visit", timestamp: new Date(), metadata: cleanTag }],
      });
      await session.save();
      return { success: true, isNew: true };
    }

    // Check if returning visit (explicit flag or returning after 30 mins)
    const timeSinceLastSeen = Date.now() - new Date(session.lastSeenAt).getTime();
    if (isNewVisit || timeSinceLastSeen > 30 * 60 * 1000) {
      session.visitCount = (session.visitCount || 1) + 1;
      session.intentSignals.push({
        action: "return_visit",
        timestamp: new Date(),
        metadata: `Visit #${session.visitCount} on ${deviceInfo || "Device"}`,
      });
      session.markModified("intentSignals");
    }

    // Update existing prospect session
    session.totalTimeSeconds = (session.totalTimeSeconds || 0) + delta;
    session.lastSeenAt = new Date();

    if (deviceId && !session.deviceId) {
      session.deviceId = deviceId;
    }

    if (deviceInfo) {
      session.deviceInfo = deviceInfo;
    }

    // Upgrade visitor tag if prospect query parameter was provided
    if (prospectTag && !prospectTag.startsWith("Visitor-") && session.prospectTag.startsWith("Visitor-")) {
      session.prospectTag = prospectTag.trim();
    }

    // Increment feature time
    if (activeFeature) {
      const currentFeatures = session.featureTimes || {};
      const currentSecs = (currentFeatures[activeFeature] as number) || 0;
      session.featureTimes = {
        ...currentFeatures,
        [activeFeature]: currentSecs + delta,
      };
      session.markModified("featureTimes");
    }

    await session.save();
    return { success: true };
  } catch (err: any) {
    console.error("Error in recordProspectHeartbeatAction:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Server Action: Records the subtle onboarding prompt entry (Name, Email, or Skip)
 * Tracks whether client entered both, name_only, email_only, or skipped/dismissed
 */
export async function recordProspectOnboardingAction(data: {
  visitorId: string;
  deviceId?: string;
  name?: string;
  email?: string;
  status: "both" | "name_only" | "email_only" | "skipped" | "dismissed";
  prospectTag?: string;
  deviceInfo?: string;
}) {
  try {
    await connectDB();
    const { visitorId, deviceId, name, email, status, prospectTag, deviceInfo } = data;
    if (!visitorId) return { success: false, error: "Visitor ID required" };

    const cleanName = name?.trim() || "";
    const cleanEmail = email?.trim() || "";
    const determinedTag =
      cleanName ||
      cleanEmail ||
      (prospectTag && !prospectTag.startsWith("Visitor-") ? prospectTag.trim() : null) ||
      `Visitor-${visitorId.substring(0, 6)}`;

    let session = await ProspectSession.findOne({
      $or: [
        { visitorId },
        ...(deviceId ? [{ deviceId }] : []),
      ],
    });

    const statusAction = `onboarding_gate_${status}`;
    const statusMetadata =
      status === "both"
        ? `Entered Name: "${cleanName}" & Email: "${cleanEmail}"`
        : status === "name_only"
        ? `Entered Name only: "${cleanName}"`
        : status === "email_only"
        ? `Entered Email only: "${cleanEmail}"`
        : status === "skipped"
        ? "Skipped onboarding prompt"
        : "Dismissed (Closed X) onboarding prompt";

    if (!session) {
      session = new ProspectSession({
        visitorId,
        deviceId: deviceId || "",
        prospectTag: determinedTag,
        clientName: cleanName,
        clientEmail: cleanEmail,
        onboardingStatus: status,
        deviceInfo: deviceInfo || "Browser",
        visitCount: 1,
        totalTimeSeconds: 5,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        featureTimes: { "Demo Welcome": 5 },
        gamesPlayed: [],
        intentSignals: [
          {
            action: statusAction,
            timestamp: new Date(),
            metadata: statusMetadata,
          },
        ],
      });
      await session.save();
      return { success: true };
    }

    // Update existing session
    session.clientName = cleanName || session.clientName || "";
    session.clientEmail = cleanEmail || session.clientEmail || "";
    session.onboardingStatus = status;
    if (deviceId && !session.deviceId) session.deviceId = deviceId;
    if (cleanName) {
      session.prospectTag = cleanName;
    } else if (cleanEmail && session.prospectTag.startsWith("Visitor-")) {
      session.prospectTag = cleanEmail;
    }

    session.intentSignals.push({
      action: statusAction,
      timestamp: new Date(),
      metadata: statusMetadata,
    });
    session.markModified("intentSignals");
    session.lastSeenAt = new Date();
    await session.save();
    return { success: true };
  } catch (err: any) {
    console.error("Error in recordProspectOnboardingAction:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Server Action: Tracks when a prospective client plays a minigame in demo
 */
export async function recordProspectGameSessionAction(data: {
  visitorId: string;
  gameSlug: string;
  durationSeconds: number;
  score: number;
  prospectTag?: string;
}) {
  try {
    await connectDB();
    const { visitorId, gameSlug, durationSeconds, score, prospectTag } = data;
    if (!visitorId || !gameSlug) return { success: false };

    let session = await ProspectSession.findOne({ visitorId });
    if (!session) {
      session = new ProspectSession({
        visitorId,
        prospectTag: prospectTag?.trim() || `Visitor-${visitorId.substring(0, 6)}`,
        totalTimeSeconds: Math.max(durationSeconds, 10),
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        featureTimes: { "Arcade Gameplay": Math.max(durationSeconds, 10) },
        gamesPlayed: [
          {
            gameSlug,
            plays: 1,
            totalSeconds: Math.max(durationSeconds, 10),
            highScore: score,
          },
        ],
        intentSignals: [],
      });
      await session.save();
      return { success: true };
    }

    // Update gameplay stat in gamesPlayed array
    const existingGameIndex = session.gamesPlayed.findIndex((g) => g.gameSlug === gameSlug);
    if (existingGameIndex >= 0) {
      session.gamesPlayed[existingGameIndex].plays += 1;
      session.gamesPlayed[existingGameIndex].totalSeconds += Math.max(durationSeconds, 5);
      session.gamesPlayed[existingGameIndex].highScore = Math.max(
        session.gamesPlayed[existingGameIndex].highScore,
        score
      );
    } else {
      session.gamesPlayed.push({
        gameSlug,
        plays: 1,
        totalSeconds: Math.max(durationSeconds, 5),
        highScore: score,
      });
    }

    session.markModified("gamesPlayed");
    session.lastSeenAt = new Date();
    await session.save();
    return { success: true };
  } catch (err: any) {
    console.error("Error in recordProspectGameSessionAction:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Server Action: Tracks high-intent sales signals (WhatsApp click, Email click, Standee download)
 */
export async function recordProspectIntentAction(data: {
  visitorId: string;
  action: string;
  metadata?: string;
  prospectTag?: string;
}) {
  try {
    await connectDB();
    const { visitorId, action, metadata, prospectTag } = data;
    if (!visitorId || !action) return { success: false };

    let session = await ProspectSession.findOne({ visitorId });
    if (!session) {
      session = new ProspectSession({
        visitorId,
        prospectTag: prospectTag?.trim() || `Visitor-${visitorId.substring(0, 6)}`,
        totalTimeSeconds: 10,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        featureTimes: {},
        gamesPlayed: [],
        intentSignals: [{ action, timestamp: new Date(), metadata }],
      });
      await session.save();
      return { success: true };
    }

    session.intentSignals.push({
      action,
      timestamp: new Date(),
      metadata,
    });
    session.markModified("intentSignals");
    session.lastSeenAt = new Date();
    await session.save();
    return { success: true };
  } catch (err: any) {
    console.error("Error in recordProspectIntentAction:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Server Action: Captures 5-min Walkthrough Callback request from prospect
 */
export async function recordProspectLeadAction(data: {
  visitorId: string;
  cafeName: string;
  contact: string;
}) {
  try {
    await connectDB();
    const { visitorId, cafeName, contact } = data;

    let session = await ProspectSession.findOne({ visitorId });
    if (!session) {
      session = new ProspectSession({
        visitorId,
        prospectTag: cafeName.trim(),
        totalTimeSeconds: 30,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        featureTimes: {},
        gamesPlayed: [],
        intentSignals: [{ action: "callback_submitted", timestamp: new Date(), metadata: `${cafeName} (${contact})` }],
        walkthroughRequest: {
          cafeName: cafeName.trim(),
          contact: contact.trim(),
          requestedAt: new Date(),
        },
      });
      await session.save();
      return { success: true };
    }

    session.walkthroughRequest = {
      cafeName: cafeName.trim(),
      contact: contact.trim(),
      requestedAt: new Date(),
    };
    if (session.prospectTag.startsWith("Visitor-")) {
      session.prospectTag = cafeName.trim();
    }
    session.intentSignals.push({
      action: "callback_submitted",
      timestamp: new Date(),
      metadata: `${cafeName} (${contact})`,
    });
    session.markModified("walkthroughRequest");
    session.markModified("intentSignals");
    await session.save();
    return { success: true };
  } catch (err: any) {
    console.error("Error in recordProspectLeadAction:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Server Action: Queries all prospect data & aggregates for the Super Admin console
 */
export async function getProspectAnalyticsAction() {
  try {
    await connectDB();
    const sessions = await ProspectSession.find().sort({ lastSeenAt: -1 }).limit(100).lean();

    // Calculate aggregated metrics
    let totalSecondsAcrossAll = 0;
    const featurePopularityMap: Record<string, number> = {};
    const gamePopularityMap: Record<string, { plays: number; seconds: number }> = {};
    let highIntentLeadsCount = 0;
    let activeNowCount = 0;

    let gateBothCount = 0;
    let gateNameOnlyCount = 0;
    let gateEmailOnlyCount = 0;
    let gateSkippedCount = 0;
    let gateDismissedCount = 0;
    let gatePendingCount = 0;

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const formattedSessions = sessions.map((s: any) => {
      const totalSec = s.totalTimeSeconds || 0;
      totalSecondsAcrossAll += totalSec;

      if (new Date(s.lastSeenAt) > twoMinutesAgo) {
        activeNowCount += 1;
      }

      // Track onboarding gate choices
      const obStatus = s.onboardingStatus || "pending";
      if (obStatus === "both") gateBothCount += 1;
      else if (obStatus === "name_only") gateNameOnlyCount += 1;
      else if (obStatus === "email_only") gateEmailOnlyCount += 1;
      else if (obStatus === "skipped") gateSkippedCount += 1;
      else if (obStatus === "dismissed") gateDismissedCount += 1;
      else gatePendingCount += 1;

      // Aggregate feature times
      if (s.featureTimes) {
        Object.entries(s.featureTimes).forEach(([feature, secs]) => {
          const numSecs = Number(secs) || 0;
          featurePopularityMap[feature] = (featurePopularityMap[feature] || 0) + numSecs;
        });
      }

      // Aggregate games
      if (Array.isArray(s.gamesPlayed)) {
        s.gamesPlayed.forEach((g: any) => {
          if (!gamePopularityMap[g.gameSlug]) {
            gamePopularityMap[g.gameSlug] = { plays: 0, seconds: 0 };
          }
          gamePopularityMap[g.gameSlug].plays += g.plays || 0;
          gamePopularityMap[g.gameSlug].seconds += g.totalSeconds || 0;
        });
      }

      // Compute engagement score
      const hasIntent = s.intentSignals && s.intentSignals.length > 0;
      const hasCallback = !!s.walkthroughRequest?.contact;
      const hasContact = !!(s.clientEmail || s.clientName);
      if (hasIntent || hasCallback || hasContact || totalSec > 300) {
        highIntentLeadsCount += 1;
      }

      const score = Math.min(
        100,
        (hasCallback ? 40 : 0) +
          (obStatus === "both" ? 30 : obStatus === "name_only" || obStatus === "email_only" ? 20 : 0) +
          (hasIntent ? 20 : 0) +
          Math.min(25, Math.floor(totalSec / 20)) +
          Math.min(15, (s.gamesPlayed?.length || 0) * 5)
      );

      return {
        id: s._id.toString(),
        prospectTag: s.prospectTag,
        visitorId: s.visitorId,
        deviceId: s.deviceId || "",
        clientName: s.clientName || "",
        clientEmail: s.clientEmail || "",
        onboardingStatus: obStatus,
        visitCount: s.visitCount || 1,
        deviceInfo: s.deviceInfo || "Desktop",
        totalTimeSeconds: totalSec,
        firstSeenAt: s.firstSeenAt ? new Date(s.firstSeenAt).toISOString() : null,
        lastSeenAt: s.lastSeenAt ? new Date(s.lastSeenAt).toISOString() : null,
        isLiveNow: new Date(s.lastSeenAt) > twoMinutesAgo,
        featureTimes: s.featureTimes || {},
        gamesPlayed: s.gamesPlayed || [],
        intentSignals: s.intentSignals || [],
        walkthroughRequest: s.walkthroughRequest || null,
        leadScore: score,
      };
    });

    // Sort features by popularity
    const rankedFeatures = Object.entries(featurePopularityMap)
      .map(([name, totalSecs]) => ({ name, totalSecs }))
      .sort((a, b) => b.totalSecs - a.totalSecs);

    // Sort games by plays
    const rankedGames = Object.entries(gamePopularityMap)
      .map(([slug, data]) => ({ slug, ...data }))
      .sort((a, b) => b.plays - a.plays);

    const totalGateInteractions = gateBothCount + gateNameOnlyCount + gateEmailOnlyCount + gateSkippedCount + gateDismissedCount;
    const leadsProvidedCount = gateBothCount + gateNameOnlyCount + gateEmailOnlyCount;
    const conversionRatePct = totalGateInteractions > 0 ? Math.round((leadsProvidedCount / totalGateInteractions) * 100) : 0;

    return {
      success: true,
      data: {
        totalProspects: sessions.length,
        activeNowCount,
        highIntentLeadsCount,
        averageTimeSeconds: sessions.length ? Math.round(totalSecondsAcrossAll / sessions.length) : 0,
        gateMetrics: {
          totalInteractions: totalGateInteractions,
          conversionRatePct,
          both: gateBothCount,
          nameOnly: gateNameOnlyCount,
          emailOnly: gateEmailOnlyCount,
          skipped: gateSkippedCount,
          dismissed: gateDismissedCount,
          pending: gatePendingCount,
        },
        rankedFeatures,
        rankedGames,
        prospects: formattedSessions,
      },
    };
  } catch (err: any) {
    console.error("Error in getProspectAnalyticsAction:", err);
    return { success: false, error: err.message };
  }
}
