// DOM Elements
const minimizeBtn = document.getElementById("minimize-btn");
const closeBtn = document.getElementById("close-btn");
const statusText = document.getElementById("status-text");
const keyboardHelp = document.getElementById("keyboard-help");
const chatHistory = document.getElementById("chat-history");

// Chat state
let messages = [];

// Initialize marked with options
if (typeof marked === "undefined") {
  console.error("marked library not loaded");
} else {
  marked.setOptions({
    breaks: true,
    gfm: true,
    sanitize: false,
  });
}

// Initialize the UI
document.addEventListener("DOMContentLoaded", async () => {
  // Load settings
  const settings = await window.electronAPI.getSettings();

  // Set up event listeners
  setupEventListeners();

  // Set up keyboard help
  setupKeyboardHelp();
});

// Set up event listeners
function setupEventListeners() {
  // Window position update
  window.electronAPI.onWindowPositionChanged((position) => {
    document.body.setAttribute("data-position", position);
  });

  // Control buttons with improved error handling
  minimizeBtn.addEventListener("click", async () => {
    try {
      await window.electronAPI.minimizeWindow();
      statusText.textContent = "Minimized";
    } catch (error) {
      console.error("Failed to minimize:", error);
    }
  });

  closeBtn.addEventListener("click", async () => {
    try {
      await window.electronAPI.hideWindow();
      statusText.textContent = "Hidden";
    } catch (error) {
      console.error("Failed to hide:", error);
    }
  });

  // Handle keyboard shortcuts for UI navigation
  document.addEventListener("keydown", handleKeyboardShortcuts);

  // Handle new screenshots
  window.electronAPI.onScreenshotCaptured((data) => {
    addScreenshotToChat(data);
  });

  // Handle chat reset
  window.electronAPI.onResetChat(() => {
    resetChat();
  });

  // Handle streaming updates
  window.electronAPI.onStreamUpdate((data) => {
    console.log("Received stream update:", data);
    updateStreamingMessage(data);
  });

  // Handle test stream
  window.electronAPI.testStream = async (prompt) => {
    try {
      statusText.textContent = "Testing stream...";
      const result = await window.electronAPI.testStream(prompt);
      console.log("Test stream result:", result);

      if (result.success) {
        // Add assistant message to messages array
        messages.push({
          type: "assistant",
          timestamp: Date.now(),
          messageId: result.messageId,
          provider: result.provider,
          model: result.model,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error in test stream:", error);
      statusText.textContent = "Test failed";

      // Add error message to chat
      const errorEl = document.createElement("div");
      errorEl.className = "message error";
      errorEl.textContent = `Error: ${error.message}`;
      chatHistory.appendChild(errorEl);
      chatHistory.scrollTop = chatHistory.scrollHeight;
    }
  };
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(event) {
  // Don't handle shortcuts if we're in a text input
  if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
    return;
  }

  // Escape to hide
  if (event.key === "Escape") {
    closeBtn.click();
  }
}

// Update streaming message
function updateStreamingMessage(data) {
  const { messageId, content, isComplete } = data;
  console.log("Updating message:", {
    messageId,
    contentLength: content.length,
    isComplete,
  });

  // Find or create message element
  let messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
  if (!messageEl) {
    console.log("Creating new message element");
    messageEl = document.createElement("div");
    messageEl.className = "message assistant";
    messageEl.setAttribute("data-message-id", messageId);
    chatHistory.appendChild(messageEl);
  }

  // Update content
  let contentWrapper = messageEl.querySelector(".message-content");
  if (!contentWrapper) {
    console.log("Creating new content wrapper");
    contentWrapper = document.createElement("div");
    contentWrapper.className = "message-content";
    messageEl.appendChild(contentWrapper);
  }
  contentWrapper.textContent = content;

  // Update status if complete
  if (isComplete) {
    console.log("Stream complete");
    statusText.textContent = "Analysis complete";
  }

  // Scroll to bottom
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Add screenshot to chat
async function addScreenshotToChat(data) {
  console.log("Starting screenshot analysis...");
  const message = {
    type: "screenshot",
    timestamp: Date.now(),
    filePath: data.filePath,
  };

  messages.push(message);

  const messageEl = document.createElement("div");
  messageEl.className = "message user";

  const img = document.createElement("img");
  img.src = `file://${data.filePath}`;
  img.className = "screenshot-thumbnail";
  img.alt = "Screenshot";
  img.addEventListener("click", () => {
    window.electronAPI.openFile(data.filePath);
  });

  messageEl.appendChild(img);
  chatHistory.appendChild(messageEl);

  // Scroll to bottom
  chatHistory.scrollTop = chatHistory.scrollHeight;

  // Update status
  statusText.textContent = "Analyzing screenshot...";

  try {
    // Get chat history for context
    const history = messages
      .filter((m) => m.type === "assistant")
      .map((m) => ({
        role: "assistant",
        content: m.content,
      }));

    console.log("Sending screenshot for analysis...");
    // Analyze screenshot
    const result = await window.electronAPI.analyzeScreenshot({
      filePath: data.filePath,
      history,
    });

    console.log("Received analysis result:", result);

    if (result.success) {
      // Add assistant message to messages array
      messages.push({
        type: "assistant",
        timestamp: Date.now(),
        messageId: result.messageId,
        provider: result.provider,
        model: result.model,
      });
    } else {
      console.error("Analysis failed:", result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("Error in screenshot analysis:", error);
    statusText.textContent = "Analysis failed";

    // Add error message to chat
    const errorEl = document.createElement("div");
    errorEl.className = "message error";
    errorEl.textContent = `Error: ${error.message}`;
    chatHistory.appendChild(errorEl);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
}

// Reset chat
function resetChat() {
  messages = [];
  chatHistory.innerHTML = "";
  statusText.textContent = "Chat reset";
}

// Set up keyboard help
function setupKeyboardHelp() {
  const shortcuts = {
    "Take Screenshot": "⌘ + ⇧ + S",
    "Test Stream": "⌘ + ⇧ + T",
    "Toggle Visibility": "⌘ + ⇧ + H",
    "Reset Chat": "⌘ + ⇧ + R",
    "Move to Top": "⌘ + ⇧ + ↑",
    "Move to Bottom": "⌘ + ⇧ + ↓",
    "Move to Left": "⌘ + ⇧ + ←",
    "Move to Right": "⌘ + ⇧ + →",
    "Open Settings": "⌘ + ⇧ + ,",
  };

  keyboardHelp.innerHTML = Object.entries(shortcuts)
    .map(
      ([action, keys]) => `
      <div class="shortcut">
        <span class="action">${action}</span>
        <span class="keys">${keys}</span>
      </div>
    `
    )
    .join("");
}
