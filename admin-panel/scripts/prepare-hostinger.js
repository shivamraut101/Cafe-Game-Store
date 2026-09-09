const fs = require("fs");
const path = require("path");

try {
  const adminPanelDir = path.resolve(__dirname, "..");
  const dotNextDir = path.join(adminPanelDir, ".next");
  const standaloneDir = path.join(dotNextDir, "standalone");

  console.log("[prepare-hostinger] Preparing production deployment bundle...");

  if (!fs.existsSync(standaloneDir)) {
    console.error("[prepare-hostinger] Error: .next/standalone does not exist. Did next build run?");
    process.exit(1);
  }

  // 1. If Next.js placed server.js in a subfolder (due to workspace inference), hoist it to standalone root
  let rootServer = path.join(standaloneDir, "server.js");
  if (!fs.existsSync(rootServer)) {
    function findServer(dir, depth = 0) {
      if (depth > 4) return null;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === "node_modules") continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const res = findServer(full, depth + 1);
          if (res) return res;
        } else if (entry.name === "server.js") {
          return full;
        }
      }
      return null;
    }

    const nestedServer = findServer(standaloneDir);
    if (nestedServer) {
      const nestedDir = path.dirname(nestedServer);
      console.log(`[prepare-hostinger] Found nested standalone server at ${nestedDir}, hoisting to ${standaloneDir}...`);
      fs.cpSync(nestedDir, standaloneDir, { recursive: true, force: true, dereference: true });
    }
  }

  // 2. Copy public directory into standalone/public
  const publicDir = path.join(adminPanelDir, "public");
  if (fs.existsSync(publicDir)) {
    console.log("[prepare-hostinger] Copying public/ into .next/standalone/public...");
    fs.cpSync(publicDir, path.join(standaloneDir, "public"), { recursive: true, force: true });
  }

  // 3. Copy .next/static into standalone/.next/static
  const staticDir = path.join(dotNextDir, "static");
  if (fs.existsSync(staticDir)) {
    console.log("[prepare-hostinger] Copying .next/static into .next/standalone/.next/static...");
    fs.cpSync(staticDir, path.join(standaloneDir, ".next", "static"), { recursive: true, force: true });
  }

  // 4. For dual-compatibility (whether Hostinger points to .next or .next/standalone):
  // Copy the standalone server.js and node_modules into .next root
  if (fs.existsSync(rootServer)) {
    fs.copyFileSync(rootServer, path.join(dotNextDir, "server.js"));
    console.log("[prepare-hostinger] Synced standalone server.js into .next/server.js");
  }

  const standaloneModules = path.join(standaloneDir, "node_modules");
  const dotNextModules = path.join(dotNextDir, "node_modules");
  if (fs.existsSync(standaloneModules)) {
    console.log("[prepare-hostinger] Linking/copying node_modules into .next/node_modules...");
    fs.cpSync(standaloneModules, dotNextModules, { recursive: true, force: true, dereference: true });
  }

  if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, path.join(dotNextDir, "public"), { recursive: true, force: true });
  }

  console.log("[prepare-hostinger] Production bundle successfully prepared!");
} catch (err) {
  console.error("[prepare-hostinger] Error during post-build preparation:", err);
  process.exit(1);
}

