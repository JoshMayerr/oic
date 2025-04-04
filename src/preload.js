const { contextBridge, ipcRenderer, shell } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Get settings
  getSettings: () => ipcRenderer.invoke("get-settings"),

  // Save settings
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),

  // Show settings window
  showSettings: () => ipcRenderer.invoke("show-settings"),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  hideWindow: () => ipcRenderer.invoke("hide-window"),

  // Context menu
  buildContextMenu: () => ipcRenderer.invoke("build-context-menu"),

  // Screenshot handling
  onScreenshotCaptured: (callback) =>
    ipcRenderer.on("screenshot-captured", (event, value) => callback(value)),
  analyzeScreenshot: (data) => ipcRenderer.invoke("analyze-screenshot", data),
  onStreamUpdate: (callback) =>
    ipcRenderer.on("stream-update", (event, value) => callback(value)),
  getScreenshotsDirectory: () =>
    ipcRenderer.invoke("get-screenshots-directory"),
  getRecentScreenshots: () => ipcRenderer.invoke("get-recent-screenshots"),

  // Test response
  testResponse: (prompt) => ipcRenderer.invoke("test-response", prompt),

  // File handling
  openFile: (path) => shell.openPath(path),

  // Chat reset
  onResetChat: (callback) =>
    ipcRenderer.on("reset-chat", (event) => callback()),

  // Window position
  onWindowPositionChanged: (callback) =>
    ipcRenderer.on("window-position-changed", (event, value) =>
      callback(value)
    ),
  updatePosition: (position) => ipcRenderer.invoke("update-position", position),

  // Scroll chat
  onScrollChat: (callback) =>
    ipcRenderer.on("scroll-chat", (event, direction) => callback(direction)),

  // Click-through mode
  onToggleMouseIgnore: (callback) =>
    ipcRenderer.on("toggle-mouse-ignore", (event, value) => callback(value)),
});

// No need for additional electron context bridge since we're handling everything through electronAPI
