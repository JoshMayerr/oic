// DOM Elements
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
  });
}

// Initialize the UI
document.addEventListener("DOMContentLoaded", async () => {
  setupEventListeners();
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

  // Handle chat scrolling
  window.electronAPI.onScrollChat((direction) => {
    const chatContainer = document.querySelector(".chat-container");
    if (chatContainer) {
      if (direction === "up") {
        chatContainer.scrollTop -= 100; // Scroll up by 100px
      } else if (direction === "down") {
        chatContainer.scrollTop += 100; // Scroll down by 100px
      }
    }
  });
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(event) {
  if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
    return;
  }

  if (event.key === "Escape") {
    window.electronAPI.hideWindow();
  }

  if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === "t") {
    event.preventDefault();
    handleTestResponse("write python code to print 'Hello, world!'");
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
  console.log("updateMessage called:", {
    messageId,
    contentLength: content.length,
    isComplete,
  });

  // Find or create message element
  let messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
  if (!messageEl) {
    console.log("Creating new message element");
    messageEl = createMessageElement(messageId);
    chatHistory.appendChild(messageEl);
    // Show typing indicator for new messages
    typingIndicator.classList.add("visible");
    console.log("Typing indicator shown");
    updateNullStateVisibility();
  }

  // Update content
  const contentWrapper = messageEl.querySelector(".message-content");
  if (contentWrapper) {
    if (content && typeof content === "string") {
      contentWrapper.innerHTML = marked.parse(content);
    } else {
      contentWrapper.innerHTML = ""; // Clear content if it's null/undefined or not a string
    }
    messageEl.style.display = "block"; // Show when content is added
    scrollToBottom();
  }

  // Handle completion
  if (isComplete) {
    console.log("Message complete, hiding typing indicator");
    typingIndicator.classList.remove("visible");

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
  messageEl.className = "message assistant";
  messageEl.setAttribute("data-message-id", messageId);
  messageEl.style.display = "none"; // Hide initially

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
    // Show typing indicator before analyzing screenshot
    typingIndicator.classList.add("visible");
    console.log("Showing typing indicator for screenshot analysis");

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
    typingIndicator.classList.remove("visible");
    addErrorMessage(error.message);
  }
}

// Reset chat
function resetChat() {
  chatHistory.innerHTML = "";
  messages = [];
  updateNullStateVisibility();
}

function updateNullStateVisibility() {
  const nullState = document.getElementById("null-state");
  if (nullState) {
    nullState.style.display = messages.length === 0 ? "flex" : "none";
  }
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

    // Show typing indicator
    typingIndicator.classList.add("visible");
    console.log("Showing typing indicator for new test response");

    // Add assistant message placeholder
    const messageId = Date.now().toString();
    const assistantMessage = {
      type: "assistant",
      timestamp: Date.now(),
      messageId,
      content: "",
      status: "pending",
    };
    messages.push(assistantMessage);

    const assistantMessageEl = createMessageElement(messageId);
    chatHistory.appendChild(assistantMessageEl);
    scrollToBottom();

    const result = await window.electronAPI.testResponse(prompt);
    if (!result.success) {
      throw new Error(result.error);
    }

    // Update the message with the response
    const contentWrapper = assistantMessageEl.querySelector(".message-content");
    if (contentWrapper) {
      if (result.content && typeof result.content === "string") {
        contentWrapper.innerHTML = marked.parse(result.content);
      } else {
        contentWrapper.innerHTML = ""; // Clear content if it's null/undefined or not a string
      }
      assistantMessageEl.classList.remove("loading");
      scrollToBottom();
    }

    // Update the message in the messages array
    assistantMessage.content = result.content;
    assistantMessage.status = "completed";

    // Hide typing indicator
    typingIndicator.classList.remove("visible");
    console.log("Test response complete, hiding typing indicator");
  } catch (error) {
    console.error("Error in handleTestResponse:", error);
    typingIndicator.classList.remove("visible");
    addErrorMessage(error.message);
  }
}
