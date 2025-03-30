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

  // Handle keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Close window with Command+W
    if ((e.metaKey || e.ctrlKey) && e.key === "w") {
      e.preventDefault();
      window.electronAPI.hideWindow();
    }

    // Save with Command+S
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      if (!saveButton.disabled) {
        saveButton.click();
      }
    }
  });
});

// Helper function to show notifications
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.style.backgroundColor =
    type === "success" ? "#34c759" : "#ff3b30";
  notification.textContent = message;
  document.body.appendChild(notification);

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
