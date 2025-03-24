# Open Interview Coder

## Environment Setup

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your OpenAI API key:

   ```
   OPENAI_API_KEY=your-api-key-here
   ```

3. The API key can be configured in two ways:
   - Through the app's settings UI (recommended for users)
   - Via the `.env` file (recommended for development)

Note: The `.env` file is included in the production build as a resource. Users can override the API key through the settings UI.
