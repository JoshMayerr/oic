const Store = require("electron-store");
const path = require("path");
const fs = require("fs");
const { app } = require("electron");

// Function to load .env file
function loadEnvFile() {
  try {
    // In production, .env is in the resources directory
    const envPath = app.isPackaged
      ? path.join(process.resourcesPath, ".env")
      : path.join(__dirname, ".env");

    console.log("Looking for .env file at:", envPath);
    console.log("Is app packaged?", app.isPackaged);
    console.log("Resources path:", process.resourcesPath);

    if (fs.existsSync(envPath)) {
      console.log(".env file found!");
      const envContent = fs.readFileSync(envPath, "utf8");
      const envVars = envContent.split("\n").reduce((acc, line) => {
        const [key, value] = line.split("=").map((s) => s.trim());
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {});
      console.log("Loaded environment variables:", Object.keys(envVars));
      return envVars;
    } else {
      console.log(".env file not found at:", envPath);
    }
  } catch (error) {
    console.error("Error loading .env file:", error);
  }
  return {};
}

const store = new Store({
  defaults: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || "",
    },
  },
});

// Load environment variables
const envVars = loadEnvFile();

module.exports = {
  getOpenAIKey: () => {
    // First try to get from store (user-set value)
    const storedKey = store.get("openai.apiKey");
    if (storedKey) {
      console.log("Using stored API key");
      return storedKey;
    }

    // Then try environment variable
    const envKey = envVars.OPENAI_API_KEY || "";
    console.log("Using environment API key:", envKey ? "Present" : "Not found");
    return envKey;
  },
  setOpenAIKey: (key) => store.set("openai.apiKey", key),
  hasOpenAIKey: () => {
    const storedKey = store.get("openai.apiKey");
    const hasKey = !!storedKey || !!envVars.OPENAI_API_KEY;
    console.log("Has API key:", hasKey);
    return hasKey;
  },
};
