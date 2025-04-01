// Settings management
document.addEventListener("DOMContentLoaded", async () => {
  // Get all form elements
  const openaiKeyInput = document.getElementById("openaiKey");
  const saveButton = document.getElementById("saveButton");
  const closeButton = document.getElementById("closeButton");

  // Verify all elements exist
  if (!openaiKeyInput || !saveButton || !closeButton) {
    console.error("Required DOM elements not found");
    return;
  }

  // Load current settings
  try {
    const settings = await window.electronAPI.getSettings();

    // Apply settings to form elements
    if (settings && settings.openaiKey) {
      openaiKeyInput.value = settings.openaiKey;
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }

  // Handle save button click
  saveButton.addEventListener("click", async () => {
    const settings = {
      openaiKey: openaiKeyInput.value.trim(),
    };

    try {
      await window.electronAPI.saveSettings(settings);
      // Show success message
      saveButton.textContent = "Saved!";
      setTimeout(() => {
        saveButton.textContent = "Save Settings";
      }, 2000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings. Please try again.");
    }
  });

  // Handle close button click
  closeButton.addEventListener("click", () => {
    window.electronAPI.hideWindow();
  });
});
