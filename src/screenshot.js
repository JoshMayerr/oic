const { app, dialog, shell, systemPreferences } = require("electron");
const fs = require("fs");
const path = require("path");

// Maximum number of screenshots to keep
const MAX_SCREENSHOTS = 20;

// Checks and optionally guides user to grant macOS screen recording permission
async function ensureScreenRecordingPermission() {
  if (process.platform !== "darwin") return true; // Only needed on macOS

  const status = systemPreferences.getMediaAccessStatus("screen");
  if (status === "granted") return true;

  const result = await dialog.showMessageBox({
    type: "info",
    buttons: ["Open Settings", "Cancel"],
    defaultId: 0,
    cancelId: 1,
    title: "Screen Recording Permission Required",
    message:
      "To capture the screen, please enable screen recording for this app in System Settings > Privacy & Security > Screen Recording.",
  });

  if (result.response === 0) {
    shell.openExternal(
      "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"
    );
  }

  return false;
}

// Ensures the screenshots directory exists
function ensureScreenshotsDirectory() {
  const screenshotsDir = path.join(app.getPath("userData"), "screenshots");

  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  return screenshotsDir;
}

// Cleans up old screenshots to prevent using too much disk space
function cleanupOldScreenshots() {
  try {
    const screenshotsDir = ensureScreenshotsDirectory();
    const files = fs
      .readdirSync(screenshotsDir)
      .filter((file) => file.startsWith("screenshot-") && file.endsWith(".png"))
      .map((file) => ({
        name: file,
        path: path.join(screenshotsDir, file),
        mtime: fs.statSync(path.join(screenshotsDir, file)).mtime,
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    // Keep only the most recent MAX_SCREENSHOTS
    if (files.length > MAX_SCREENSHOTS) {
      const filesToDelete = files.slice(MAX_SCREENSHOTS);
      filesToDelete.forEach((file) => {
        try {
          fs.unlinkSync(file.path);
          console.log(`Deleted old screenshot: ${file.name}`);
        } catch (err) {
          console.error(`Failed to delete screenshot ${file.name}:`, err);
        }
      });
    }
  } catch (err) {
    console.error("Error cleaning up screenshots:", err);
  }
}

// Gets a list of recent screenshots
function getRecentScreenshots(limit = 5) {
  try {
    const screenshotsDir = ensureScreenshotsDirectory();
    const files = fs
      .readdirSync(screenshotsDir)
      .filter((file) => file.startsWith("screenshot-") && file.endsWith(".png"))
      .map((file) => ({
        name: file,
        path: path.join(screenshotsDir, file),
        mtime: fs.statSync(path.join(screenshotsDir, file)).mtime,
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
      .slice(0, limit);

    return files;
  } catch (err) {
    console.error("Error getting recent screenshots:", err);
    return [];
  }
}

// Captures a full-screen screenshot and saves it to the app's data directory
async function captureFullScreen(desktopCapturer, screen) {
  const { width, height } = screen.getPrimaryDisplay().size;

  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width, height },
  });

  if (!sources.length) {
    console.error("No screen sources found.");
    return;
  }

  const image = sources[0].thumbnail;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  // Save to app's user data directory instead of pictures folder
  const screenshotsDir = ensureScreenshotsDirectory();
  const outputPath = path.join(screenshotsDir, `screenshot-${timestamp}.png`);

  fs.writeFileSync(outputPath, image.toPNG());
  console.log("Screenshot saved to:", outputPath);

  // Clean up old screenshots
  cleanupOldScreenshots();

  return outputPath;
}

module.exports = {
  ensureScreenRecordingPermission,
  captureFullScreen,
  getRecentScreenshots,
  cleanupOldScreenshots,
  ensureScreenshotsDirectory,
};
