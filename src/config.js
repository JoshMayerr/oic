const Store = require("electron-store");

const store = new Store({
  defaults: {
    openai: {
      apiKey: "",
    },
  },
});

module.exports = {
  getOpenAIKey: () => store.get("openai.apiKey") || "",
  setOpenAIKey: (key) => store.set("openai.apiKey", key),
  hasOpenAIKey: () => !!store.get("openai.apiKey"),
};
