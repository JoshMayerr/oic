// DOM Elements
const keyboardHelp = document.getElementById("keyboard-help");
const chatHistory = document.getElementById("chat-history");
const typingIndicator = document.getElementById("typing-indicator");

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
  setupEventListeners();
  setupKeyboardHelp();
});

// Set up event listeners
function setupEventListeners() {
  // Window position update
  window.electronAPI.onWindowPositionChanged((position) => {
    document.body.setAttribute("data-position", position);
  });

  // Handle keyboard shortcuts
  document.addEventListener("keydown", handleKeyboardShortcuts);

  // Handle new screenshots
  window.electronAPI.onScreenshotCaptured(addScreenshotToChat);

  // Handle chat reset
  window.electronAPI.onResetChat(resetChat);

  // Handle response updates
  window.electronAPI.onStreamUpdate(updateMessage);
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(event) {
  if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
    return;
  }

  if (event.key === "Escape") {
    window.electronAPI.hideWindow();
  }

  if ((event.metaKey || event.ctrlKey) && event.key === "t") {
    event.preventDefault();
    handleTestResponse(
      "Tell me a short story about a robot learning to paint."
    );
  }
}

// Scroll to bottom of chat
function scrollToBottom() {
  const chatContainer = document.querySelector(".chat-container");
  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
    // Double-check scroll after a short delay to handle dynamic content
    setTimeout(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 100);
  }
}

// Update message
function updateMessage(data) {
  const { messageId, content, isComplete } = data;

  // Find or create message element
  let messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
  if (!messageEl) {
    messageEl = createMessageElement(messageId);
    chatHistory.appendChild(messageEl);
  }

  // Update content
  const contentWrapper = messageEl.querySelector(".message-content");
  if (contentWrapper) {
    contentWrapper.innerHTML = marked.parse(content);
    messageEl.classList.remove("loading");
    scrollToBottom();
  }

  // Handle completion
  if (isComplete) {
    typingIndicator.classList.add("hidden");

    // Update the message in the messages array
    const messageIndex = messages.findIndex((m) => m.messageId === messageId);
    if (messageIndex !== -1) {
      messages[messageIndex].content = content;
      messages[messageIndex].status = "completed";
    }
  }
}

// Create message element
function createMessageElement(messageId) {
  const messageEl = document.createElement("div");
  messageEl.className = "message assistant loading";
  messageEl.setAttribute("data-message-id", messageId);

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "message-content markdown-body";
  messageEl.appendChild(contentWrapper);

  return messageEl;
}

// Add error message
function addErrorMessage(message) {
  const errorEl = document.createElement("div");
  errorEl.className = "message error";
  errorEl.textContent = `Error: ${message}`;
  chatHistory.appendChild(errorEl);
  scrollToBottom();
}

// Add screenshot to chat
async function addScreenshotToChat(data) {
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
  img.addEventListener("click", () =>
    window.electronAPI.openFile(data.filePath)
  );

  messageEl.appendChild(img);
  chatHistory.appendChild(messageEl);
  scrollToBottom();

  try {
    const result = await window.electronAPI.analyzeScreenshot({
      filePath: data.filePath,
      history: messages
        .filter((m) => m.type === "assistant")
        .map((m) => ({
          role: "assistant",
          content: m.content,
        })),
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    messages.push({
      type: "assistant",
      timestamp: Date.now(),
      messageId: result.messageId,
      provider: result.provider,
      model: result.model,
      content: "",
      status: "pending",
    });
  } catch (error) {
    addErrorMessage(error.message);
  }
}

// Reset chat
function resetChat() {
  messages = [];
  chatHistory.innerHTML = "";
  typingIndicator.classList.add("hidden");
}

// Handle test response
async function handleTestResponse(prompt) {
  try {
    // Add user message
    const userMessage = {
      type: "user",
      timestamp: Date.now(),
      content: prompt,
    };
    messages.push(userMessage);

    const userMessageEl = document.createElement("div");
    userMessageEl.className = "message user";
    userMessageEl.textContent = prompt;
    chatHistory.appendChild(userMessageEl);

    // Add assistant message placeholder
    const messageId = Date.now().toString();
    messages.push({
      type: "assistant",
      timestamp: Date.now(),
      messageId,
      content: "",
      status: "pending",
    });

    const assistantMessageEl = createMessageElement(messageId);
    chatHistory.appendChild(assistantMessageEl);
    scrollToBottom();

    const result = await window.electronAPI.testResponse(prompt);
    if (!result.success) {
      throw new Error(result.error);
    }
  } catch (error) {
    addErrorMessage(error.message);
  }
}

// Set up keyboard help
function setupKeyboardHelp() {
  const shortcuts = {
    "Take Screenshot": "⌘ + ⇧ + S",
    "Test Response": "⌘ + T",
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
