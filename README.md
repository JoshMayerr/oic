# Open Interview Coder

An AI-powered coding assistant that helps you during screen sharing sessions. The assistant appears as an overlay on your screen and can help with coding questions, debugging, and general programming assistance.

## Features

- Invisible overlay that appears during screen sharing
- Real-time AI assistance for coding questions
- Screenshot analysis capabilities
- Keyboard shortcuts for quick actions
- Settings management for API configuration

## Installation

### For Users

1. Download the latest release for your operating system from the releases page
2. Install the application
3. Launch the application
4. Configure your OpenAI API key in the settings (Settings > API Configuration)

### For Developers

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/open-interview-coder.git
   cd open-interview-coder
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
open-interview-coder/
├── assets/                 # Images and icons
│   ├── icon.iconset/       # macOS icon set
│   ├── OCTO.png            # Application icon
│   └── icon.icns           # macOS icon
├── src/                    # Source code
│   ├── main.js             # Main Electron process
│   ├── renderer.js         # Renderer process for the main window
│   ├── preload.js          # Preload script for secure IPC
│   ├── llm-service.js      # LLM API integration
│   ├── screenshot.js       # Screenshot capture functionality
│   ├── settings.js         # Settings window functionality
│   └── config.js           # Configuration management
├── styles.css              # Application styles
├── index.html              # Main application HTML
├── settings.html           # Settings page HTML
├── .gitignore              # Git ignore file
├── LICENSE                 # MIT License
├── package.json            # npm package configuration
└── README.md               # Project documentation
```

## Building for Distribution

To build the application for distribution:

```bash
# For macOS
npm run build:mac

# For Windows
npm run build:win

# For Linux
npm run build:linux
```

The built applications will be available in the `dist` directory.

## Usage

1. Launch the application
2. Use the keyboard shortcuts to show/hide the assistant:

   - `Cmd/Ctrl + Shift + S`: Take a screenshot
   - `Cmd/Ctrl + Shift + H`: Toggle assistant visibility
   - `Cmd/Ctrl + ←/→/↑/↓`: Move the assistant window
   - `Cmd + ,`: Open settings

3. The assistant will appear as an overlay on your screen during screen sharing sessions
4. Type your questions or requests in the chat interface
5. The AI will respond with relevant code snippets, explanations, and suggestions

## Configuration

The OpenAI API key can be configured through the app's settings UI:

1. Open the settings window (Settings > API Configuration)
2. Enter your OpenAI API key
3. Click "Save Changes"

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
