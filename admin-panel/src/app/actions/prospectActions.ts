"use server";

import connectDB from "../../lib/db";
import { ProspectSession, IProspectSession } from "../../lib/models";

/**
 * Server Action: Heartbeat & Active Feature Time Tracker
 * Increments total time and specific feature duration for a prospective client.
 */
export async function recordProspectHeartbeatAction(data: {
  visitorId: string;
  prospectTag?: string;
  activeFeature?: string;
  secondsDelta: number;
  deviceInfo?: string;
}) {
  try {
    await connectDB();
    const { visitorId, prospectTag, activeFeature, secondsDelta, deviceInfo } = data;
    if (!visitorId) return { success: false, error: "Visitor ID required" };

    const cleanTag = prospectTag?.trim() || `Visitor-${visitorId.substring(0, 6)}`;
    const delta = Math.max(1, Math.min(secondsDelta, 120)); // cap delta between 1-120s

    let session = await ProspectSession.findOne({ visitorId });

    if (!session) {
      session = new ProspectSession({
        visitorId,
        prospectTag: cleanTag,
        deviceInfo: deviceInfo || "Browser",
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

    // Update existing prospect session
    session.totalTimeSeconds = (session.totalTimeSeconds || 0) + delta;
    session.lastSeenAt = new Date();

    if (deviceInfo && !session.deviceInfo) {
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

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const formattedSessions = sessions.map((s: any) => {
      const totalSec = s.totalTimeSeconds || 0;
      totalSecondsAcrossAll += totalSec;

      if (new Date(s.lastSeenAt) > twoMinutesAgo) {
        activeNowCount += 1;
      }

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
      if (hasIntent || hasCallback || totalSec > 300) {
        highIntentLeadsCount += 1;
      }

      const score = Math.min(
        100,
        (hasCallback ? 50 : 0) +
          (hasIntent ? 30 : 0) +
          Math.min(30, Math.floor(totalSec / 20)) +
          Math.min(20, (s.gamesPlayed?.length || 0) * 10)
      );

      return {
        id: s._id.toString(),
        prospectTag: s.prospectTag,
        visitorId: s.visitorId,
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

    return {
      success: true,
      data: {
        totalProspects: sessions.length,
        activeNowCount,
        highIntentLeadsCount,
        averageTimeSeconds: sessions.length ? Math.round(totalSecondsAcrossAll / sessions.length) : 0,
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
