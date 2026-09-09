const fs = require("fs");
const path = require("path");

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  const adminPanelDir = path.resolve(__dirname, "..");
  const dotNextDir = path.join(adminPanelDir, ".next");
  const standaloneDir = path.join(dotNextDir, "standalone");

  console.log("[prepare-hostinger] Ensuring .next has production node_modules and server.js for Hostinger...");

  // 1. Copy standalone node_modules into .next/node_modules if present
  const standaloneModules = path.join(standaloneDir, "node_modules");
  const dotNextModules = path.join(dotNextDir, "node_modules");
  if (fs.existsSync(standaloneModules)) {
    console.log("[prepare-hostinger] Copying standalone node_modules into .next/node_modules...");
    copyDirSync(standaloneModules, dotNextModules);
  } else {
    // Fallback: copy from admin-panel/node_modules for key production packages
    const localModules = path.join(adminPanelDir, "node_modules");
    const requiredPkgs = ["next", "react", "react-dom", "mongoose"];
    for (const pkg of requiredPkgs) {
      const srcPkg = path.join(localModules, pkg);
      const destPkg = path.join(dotNextModules, pkg);
      if (fs.existsSync(srcPkg)) {
        console.log(`[prepare-hostinger] Copying ${pkg} into .next/node_modules/${pkg}...`);
        copyDirSync(srcPkg, destPkg);
      }
    }
  }

  // 2. Copy server.js into .next/server.js
  const customServer = path.join(adminPanelDir, "server.js");
  const dotNextServer = path.join(dotNextDir, "server.js");
  if (fs.existsSync(customServer)) {
    fs.copyFileSync(customServer, dotNextServer);
    console.log("[prepare-hostinger] Copied custom server.js into .next/server.js");
  }

  // 3. Copy package.json into .next/package.json
  const pkgJson = path.join(adminPanelDir, "package.json");
  const dotNextPkg = path.join(dotNextDir, "package.json");
  if (fs.existsSync(pkgJson)) {
    fs.copyFileSync(pkgJson, dotNextPkg);
    console.log("[prepare-hostinger] Copied package.json into .next/package.json");
  }

  // 4. Copy public folder into .next/standalone/public and .next/public
  const publicDir = path.join(adminPanelDir, "public");
  if (fs.existsSync(publicDir)) {
    copyDirSync(publicDir, path.join(dotNextDir, "public"));
    if (fs.existsSync(standaloneDir)) {
      copyDirSync(publicDir, path.join(standaloneDir, "public"));
      copyDirSync(path.join(dotNextDir, "static"), path.join(standaloneDir, ".next", "static"));
    }
  }

  console.log("[prepare-hostinger] Successfully prepared Hostinger deployment bundle in .next!");
} catch (err) {
  console.warn("[prepare-hostinger] Warning during post-build preparation:", err.message);
}
