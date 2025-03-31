const axios = require("axios");
const { ipcMain } = require("electron");
const Store = require("electron-store");
const fs = require("fs");
const config = require("./config");

// Initialize settings store
const store = new Store();

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are an invisible AI assistant that analyzes screenshots during meetings and presentations.

Key Responsibilities:
1. Analyze visual content quickly and efficiently
2. Provide concise, actionable insights
3. Identify key information, patterns, and potential issues
4. Suggest relevant follow-up questions or actions

Guidelines:
- Keep responses brief and scannable (max 200 words)
- Use bullet points and clear formatting
- Highlight important terms using **bold**
- Focus on actionable insights
- If code is shown, provide quick technical insights
- For data/charts, emphasize key trends and anomalies
- During presentations, note key takeaways and action items

Format your responses in sections:
• Quick Summary (2-3 sentences)
• Key Points (3-5 bullets)
• Suggested Actions (if applicable)
• Technical Notes (if code/data is present)`;

// Initialize the LLM service
function initializeLLMService() {
  // Register IPC handlers
  ipcMain.handle("analyze-screenshot", async (event, data) => {
    try {
      return await makeLLMRequest(event, data);
    } catch (error) {
      throw new Error(`Failed to analyze screenshot: ${error.message}`);
    }
  });

  ipcMain.handle("test-response", async (event, prompt) => {
    try {
      return await makeLLMRequest(event, { prompt });
    } catch (error) {
      throw new Error(`Failed to test response: ${error.message}`);
    }
  });

  // Add handlers for API key management
  ipcMain.handle("get-api-key-status", () => config.hasOpenAIKey());
  ipcMain.handle("set-api-key", (event, key) => config.setOpenAIKey(key));
}

async function makeLLMRequest(event, data) {
  const apiKey = config.getOpenAIKey();
  if (!apiKey) {
    throw new Error(
      "OpenAI API key not configured. Please set your API key in the settings."
    );
  }

  // Prepare request data
  const requestData = {
    model: "gpt-4o-mini",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              data.prompt || "Analyze this screenshot and provide insights.",
          },
        ],
      },
    ],
  };

  // Add image if it's a screenshot analysis
  if (data.filePath) {
    if (!fs.existsSync(data.filePath)) {
      throw new Error("Screenshot file not found");
    }
    const imageBuffer = fs.readFileSync(data.filePath);
    const base64Image = imageBuffer.toString("base64");
    requestData.input[0].content.push({
      type: "input_image",
      image_url: `data:image/png;base64,${base64Image}`,
    });
  }

  // Make API request
  const response = await axios({
    method: "post",
    url: "https://api.openai.com/v1/responses",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    data: requestData,
  });

  const content = response.data.output[0].content[0].text;
  const messageId = Date.now().toString();

  // Send response to renderer
  event.sender.send("stream-update", {
    messageId,
    content,
    isComplete: true,
    status: "completed",
  });

  return {
    success: true,
    messageId,
    provider: "openai",
    model: "gpt-4o-mini",
    status: "completed",
  };
}

module.exports = {
  initializeLLMService,
};
