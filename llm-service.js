const axios = require("axios");
const { ipcMain } = require("electron");
const Store = require("electron-store");
const fs = require("fs");
const config = require("./config");
const { BrowserWindow } = require("electron");

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
  // Register IPC handler for screenshot analysis
  ipcMain.handle("analyze-screenshot", async (event, data) => {
    try {
      return await analyzeScreenshot(event, data);
    } catch (error) {
      console.error("Error in analyze-screenshot:", error);
      throw new Error(`Failed to analyze screenshot: ${error.message}`);
    }
  });

  // Add test handler for streaming
  ipcMain.handle("test-stream", async (event, prompt) => {
    try {
      return await testStream(event, prompt);
    } catch (error) {
      console.error("Error in test-stream:", error);
      throw new Error(`Failed to test stream: ${error.message}`);
    }
  });

  // Add handlers for API key management
  ipcMain.handle("get-api-key-status", () => config.hasOpenAIKey());
  ipcMain.handle("set-api-key", (event, key) => config.setOpenAIKey(key));
}

async function analyzeScreenshot(event, data) {
  try {
    const apiKey = config.getOpenAIKey();
    if (!apiKey) {
      throw new Error(
        "OpenAI API key not configured. Please set your API key in the settings."
      );
    }

    const { filePath, prompt, history = [] } = data;
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error("Screenshot file not found");
    }

    // Read and encode the image
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString("base64");

    // Prepare the API request
    const response = await axios({
      method: "post",
      url: "https://api.openai.com/v1/responses",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      data: {
        model: "gpt-4o-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: prompt || "Analyze this screenshot and provide insights.",
              },
              {
                type: "input_image",
                image_url: `data:image/png;base64,${base64Image}`,
              },
            ],
          },
        ],
        stream: true,
      },
    });

    // State for tracking the response
    let currentResponse = {
      id: null,
      messageId: null,
      content: "",
      status: "pending",
    };

    // Handle streaming response
    const stream = response.data;
    let buffer = "";

    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const streamEvent = JSON.parse(line.slice(6));
            console.log("Received stream event:", {
              type: streamEvent.type,
              hasMessageId: !!currentResponse.messageId,
              currentStatus: currentResponse.status,
              contentLength: currentResponse.content.length,
            });

            switch (streamEvent.type) {
              case "response.created":
                currentResponse.id = streamEvent.response.id;
                currentResponse.status = "created";
                break;

              case "response.in_progress":
                currentResponse.status = "in_progress";
                break;

              case "response.output_item.added":
                if (streamEvent.item?.type === "message") {
                  currentResponse.messageId = streamEvent.item.id;
                  currentResponse.status = "generating";
                  console.log("Got message ID:", currentResponse.messageId);
                }
                break;

              case "response.content_part.added":
                if (streamEvent.part?.type === "output_text") {
                  currentResponse.status = "generating";
                }
                break;

              case "response.output_text.delta":
                if (streamEvent.delta) {
                  currentResponse.content += streamEvent.delta;
                  // Send incremental update
                  if (currentResponse.messageId) {
                    event.sender.send("stream-update", {
                      messageId: currentResponse.messageId,
                      content: currentResponse.content,
                      isComplete: false,
                      status: currentResponse.status,
                    });
                  } else {
                    console.warn("No message ID yet, skipping update");
                  }
                }
                break;

              case "response.output_text.done":
                currentResponse.content = streamEvent.text;
                currentResponse.status = "done";
                // Send final update
                if (currentResponse.messageId) {
                  event.sender.send("stream-update", {
                    messageId: currentResponse.messageId,
                    content: currentResponse.content,
                    isComplete: true,
                    status: currentResponse.status,
                  });
                } else {
                  console.warn("No message ID yet, skipping final update");
                }
                break;

              case "response.completed":
                currentResponse.status = "completed";
                break;
            }
          } catch (e) {
            console.error("Error parsing stream data:", e);
          }
        }
      }
    }

    return {
      success: true,
      messageId: currentResponse.messageId,
      provider: "openai",
      model: "gpt-4o-mini",
      status: currentResponse.status,
    };
  } catch (error) {
    console.error("Screenshot analysis failed:", error);
    return {
      success: false,
      error: error.message || "Analysis failed",
      details: error.response?.data || error,
    };
  }
}

async function testStream(
  event,
  prompt = "Tell me a short story about a robot learning to paint."
) {
  try {
    const apiKey = config.getOpenAIKey();
    if (!apiKey) {
      throw new Error(
        "OpenAI API key not configured. Please set your API key in the settings."
      );
    }

    // Prepare the API request
    const response = await axios({
      method: "post",
      url: "https://api.openai.com/v1/responses",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      data: {
        model: "gpt-4o-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: prompt,
              },
            ],
          },
        ],
        stream: true,
      },
    });

    // State for tracking the response
    let currentResponse = {
      id: null,
      messageId: null,
      content: "",
      status: "pending",
    };

    // Handle streaming response
    const stream = response.data;
    let buffer = "";

    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const streamEvent = JSON.parse(line.slice(6));
            console.log("Received stream event:", {
              type: streamEvent.type,
              hasMessageId: !!currentResponse.messageId,
              currentStatus: currentResponse.status,
              contentLength: currentResponse.content.length,
            });

            switch (streamEvent.type) {
              case "response.created":
                currentResponse.id = streamEvent.response.id;
                currentResponse.status = "created";
                break;

              case "response.in_progress":
                currentResponse.status = "in_progress";
                break;

              case "response.output_item.added":
                if (streamEvent.item?.type === "message") {
                  currentResponse.messageId = streamEvent.item.id;
                  currentResponse.status = "generating";
                  console.log("Got message ID:", currentResponse.messageId);
                }
                break;

              case "response.content_part.added":
                if (streamEvent.part?.type === "output_text") {
                  currentResponse.status = "generating";
                }
                break;

              case "response.output_text.delta":
                if (streamEvent.delta) {
                  currentResponse.content += streamEvent.delta;
                  // Send incremental update
                  if (currentResponse.messageId) {
                    event.sender.send("stream-update", {
                      messageId: currentResponse.messageId,
                      content: currentResponse.content,
                      isComplete: false,
                      status: currentResponse.status,
                    });
                  } else {
                    console.warn("No message ID yet, skipping update");
                  }
                }
                break;

              case "response.output_text.done":
                currentResponse.content = streamEvent.text;
                currentResponse.status = "done";
                // Send final update
                if (currentResponse.messageId) {
                  event.sender.send("stream-update", {
                    messageId: currentResponse.messageId,
                    content: currentResponse.content,
                    isComplete: true,
                    status: currentResponse.status,
                  });
                } else {
                  console.warn("No message ID yet, skipping final update");
                }
                break;

              case "response.completed":
                currentResponse.status = "completed";
                break;
            }
          } catch (e) {
            console.error("Error parsing stream data:", e);
          }
        }
      }
    }

    return {
      success: true,
      messageId: currentResponse.messageId,
      provider: "openai",
      model: "gpt-4o-mini",
      status: currentResponse.status,
    };
  } catch (error) {
    console.error("Stream test failed:", error);
    return {
      success: false,
      error: error.message || "Stream test failed",
      details: error.response?.data || error,
    };
  }
}

module.exports = {
  initializeLLMService,
};
