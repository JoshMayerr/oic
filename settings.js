const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", async () => {
  const apiKeyInput = document.getElementById("openai-key");
  const apiKeyError = document.getElementById("api-key-error");
  const saveButton = document.getElementById("save-settings");

  // Check if API key is already configured
  const hasApiKey = await ipcRenderer.invoke("get-api-key-status");
  if (hasApiKey) {
    apiKeyInput.value = "••••••••••••••••"; // Show dots for existing key
  }

  // Ensure paste works
  apiKeyInput.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const menu = window.electronAPI.buildContextMenu();
    menu.popup();
  });

  // Validate API key format
  function isValidApiKey(key) {
    return /^sk-[A-Za-z0-9]{32,}$/.test(key.trim());
  }

  // Handle input validation
  apiKeyInput.addEventListener("input", () => {
    const key = apiKeyInput.value.trim();
    if (key && !isValidApiKey(key)) {
      apiKeyError.classList.add("visible");
      saveButton.disabled = true;
    } else {
      apiKeyError.classList.remove("visible");
      saveButton.disabled = false;
    }
  });

  // Handle save
  saveButton.addEventListener("click", async () => {
    const apiKey = apiKeyInput.value.trim();

    // Basic validation
    if (!apiKey.startsWith("sk-")) {
      apiKeyError.classList.add("visible");
      return;
    }
    apiKeyError.classList.remove("visible");

    try {
      await ipcRenderer.invoke("set-api-key", apiKey);
      apiKeyInput.value = "••••••••••••••••"; // Show dots after successful save
      showNotification("API key saved successfully!");
    } catch (error) {
      showNotification("Failed to save API key. Please try again.", "error");
    }
  });
});

// Helper function to show notifications
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    background-color: ${type === "success" ? "#34c759" : "#ff3b30"};
    color: white;
    font-size: 13px;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  // Add animation keyframes
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
