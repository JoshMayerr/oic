const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  screen,
  desktopCapturer,
} = require("electron");
const path = require("path");
const Store = require("electron-store");
const {
  ensureScreenRecordingPermission,
  captureFullScreen,
} = require("./screenshot");
const { initializeLLMService } = require("./llm-service");

// Initialize electron store
const store = new Store();

// IPC handlers for settings
ipcMain.handle("get-settings", () => {
  return store.get("settings") || {};
});

ipcMain.handle("save-settings", (event, settings) => {
  store.set("settings", settings);
  return true;
});

// IPC handlers for window controls
ipcMain.handle("minimize-window", () => {
  if (invisibleWindow) {
    invisibleWindow.minimize();
  }
});

ipcMain.handle("hide-window", () => {
  if (invisibleWindow) {
    invisibleWindow.hide();
  }
});

let invisibleWindow;

function createInvisibleWindow() {
  invisibleWindow = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    transparent: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  invisibleWindow.loadFile("index.html");

  // Handle window visibility
  invisibleWindow.on("show", () => {
    invisibleWindow.showInactive();
  });

  // Prevent the window from being closed with mouse
  invisibleWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      invisibleWindow.hide();
    }
    return false;
  });
}

// Register global shortcuts
function registerShortcuts() {
  // Screenshot shortcut (Command/Ctrl + Shift + S)
  globalShortcut.register("CommandOrControl+Shift+S", async () => {
    try {
      // Hide window before taking screenshot
      if (invisibleWindow && invisibleWindow.isVisible()) {
        invisibleWindow.hide();
      }

      // Wait for window to hide
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check permission and take screenshot
      const hasPermission = await ensureScreenRecordingPermission();
      if (!hasPermission) {
        console.log("Permission not granted. Skipping screenshot.");
        return;
      }

      const screenshotPath = await captureFullScreen(desktopCapturer, screen);
      if (screenshotPath) {
        console.log("Screenshot saved:", screenshotPath);
        // Notify renderer about successful capture
        if (invisibleWindow) {
          invisibleWindow.webContents.send("screenshot-captured", {
            filePath: screenshotPath,
            timestamp: Date.now(),
          });
        }
      }

      // Show window again
      if (invisibleWindow) {
        invisibleWindow.showInactive();
      }
    } catch (error) {
      console.error("Screenshot failed:", error);
    }
  });

  // Toggle visibility shortcut (Command/Ctrl + Shift + H)
  globalShortcut.register("CommandOrControl+Shift+H", () => {
    if (invisibleWindow.isVisible()) {
      invisibleWindow.hide();
    } else {
      invisibleWindow.showInactive();
    }
  });

  // Reset chat shortcut (Command/Ctrl + Shift + R)
  globalShortcut.register("CommandOrControl+Shift+R", () => {
    invisibleWindow.webContents.send("reset-chat");
  });
}

// When app is ready
app.whenReady().then(async () => {
  createInvisibleWindow();
  registerShortcuts();
  initializeLLMService();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createInvisibleWindow();
    }
  });
});

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Clean up on app quit
app.on("before-quit", () => {
  app.isQuitting = true;
  globalShortcut.unregisterAll();
});
