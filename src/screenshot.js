const { app, dialog, shell, systemPreferences } = require("electron");
const fs = require("fs");
const path = require("path");

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

// Captures a full-screen screenshot and saves it as screenshot.png
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
  const outputPath = path.join(
    app.getPath("pictures"),
    `screenshot-${timestamp}.png`
  );

  fs.writeFileSync(outputPath, image.toPNG());
  console.log("Screenshot saved to:", outputPath);
  return outputPath;
}

module.exports = {
  ensureScreenRecordingPermission,
  captureFullScreen,
};
