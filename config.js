const Store = require("electron-store");

const store = new Store({
  defaults: {
    openai: {
      apiKey: "",
    },
  },
});

module.exports = {
  getOpenAIKey: () => {
    return store.get("openai.apiKey") || "";
  },
  setOpenAIKey: (key) => store.set("openai.apiKey", key),
  hasOpenAIKey: () => {
    return !!store.get("openai.apiKey");
  },
};
