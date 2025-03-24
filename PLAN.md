# Build Plan: Invisble AI Assistant

An AI assistant UI completely invisible to screen sharing software to avoid distracting my collegues.

### Stack:

- electron
- LLM api

### Workflow:

1. Open desktop app before your meeting (on zoom, google meet, etc)
2. while screen sharing, use a kb shortcut to take a screenshot
3. the transparent overlay ui provides useful answers for the contxt driven by the screenshot
4. continue working with the answer
5. new screen grab and repeat the process during the meeting
6. finish the meeting and close the app!

### Key features:

- completely invisble UI on screen sharing software
- keyboard shortcuts, no mouse needed
  - capture screen
  - arrange assistant UI
  - reset chat
- IMPORTANT: interacting with this desktop app wont take focus away from the users' current focused app
- settings can be accessed through a separate settings UI (maybe in the native preferences) rather than the invisible chat UI

### Implementation Steps:

1. implement invisible UI
   - only a hello world UI needed, no AI
   - all invisible features to work that advanced screen sharing software
   - no focus stealing
2. implement keyboard shortcuts with dummy UI
   - screen grabbing
   - arrange
   - fake chat UI
3. add real LLM api
4. more advanced UI

---------- SOME THINGS TO THINK ABOUT FOR INVISIBLE (DO NOT FOLLOW EXACTLY) -------

# Comprehensive Anti-Detection Techniques Used

Here's a complete list of all the specific techniques implemented to make the application invisible to screen sharing software:

## Window Properties and Creation

1. **Transparent Window Background**: Using `backgroundColor: '#00000000'` with full alpha transparency
2. **Frameless Window**: Setting `frame: false` to remove standard OS window decoration
3. **Taskbar Hiding**: Using `skipTaskbar: true` to prevent taskbar/dock entries
4. **Shadow Removal**: Setting `hasShadow: false` to eliminate window shadows
5. **Semi-Transparent UI**: Using RGBA colors with alpha channels instead of solid colors

## Platform-Specific Window Types

### macOS

6. **Utility Window Type**: Using `setAlwaysOnTop(true, 'utility', 1)` for a window type ignored by capture
7. **Vibrancy Effect**: Applying `setVibrancy('hud')` to blend with system elements
8. **Button Visibility**: Using `setWindowButtonVisibility(false)` to hide standard controls
9. **Screen Recording Detection**: Monitoring `systemPreferences.getMediaAccessStatus('screen')`

### Windows

10. **Tool Window Flag**: Applying `WS_EX_TOOLWINDOW` (0x00000080) via native methods
11. **Custom Z-Ordering**: Applying special layering for Windows capture avoidance
12. **Menu Removal**: Using `setMenu(null)` to remove standard menu bar

### Linux

13. **Window Type Hints**: Using `setTypeHint('tooltip')` to mark as temporary UI
14. **X11 Properties**: Setting window manager hints to be excluded from captures

## Rendering Techniques

15. **Canvas-Based UI**: Drawing all elements on HTML5 canvas instead of DOM
16. **Custom Rendering Loop**: Using `requestAnimationFrame` to handle all drawing
17. **Memory-Optimized Image Cache**: Caching thumbnails to prevent redraw artifacts
18. **Layered Opacity**: Using subtle opacity gradients difficult for screen capture to reproduce

## Behavioral Techniques

19. **Self-Hiding During Screenshots**: Temporarily hiding our own windows before taking screenshots
20. **Focus Prevention**: Using `showInactive()` instead of `show()` to prevent stealing focus
21. **Silent Notifications**: Using `silent: true` for all notification functions
22. **Natural Focus Restoration**: Tracking and restoring focus to the original window

## Interaction Design

23. **Keyboard-Only Interface**: Eliminating all need for mouse interaction
24. **Custom Drag Regions**: Using `-webkit-app-region: drag` for window movement without standard title bar
25. **Pointer Events Disabling**: Using `pointer-events: none` on non-interactive elements
26. **Custom Key Handling**: Direct keyboard event listeners for navigation

## Additional Stealth Measures

27. **Small Icon Size**: Using 16x16 icon to minimize tray visibility
28. **Graceful System Integration**: Using native notification APIs appropriate for each platform
29. **Minimal CPU Usage**: Efficient rendering to avoid high CPU usage that might be noticed
30. **Memory Footprint Management**: Cleaning up unused resources to keep a low profile

These techniques work together to create multiple layers of invisibility. While no single approach is 100% effective against all screen sharing tools, the combination creates a highly effective stealth system that works against the vast majority of screen sharing applications.
