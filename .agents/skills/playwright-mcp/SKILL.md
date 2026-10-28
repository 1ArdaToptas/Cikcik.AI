---
name: playwright-mcp
description: >-
  Microsoft Playwright MCP server integration guide. Use this skill when the user wants
  to automate browser interactions, inspect accessibility trees, test web pages, click/type
  in live UI flows, take browser snapshots, or configure Microsoft Playwright MCP (@playwright/mcp).
---

# Microsoft Playwright MCP (`@playwright/mcp`)

Provides browser automation capabilities using [Playwright](https://playwright.dev) via Model Context Protocol (MCP). Instead of relying purely on screenshots, Playwright MCP interacts directly with the browser's **accessibility tree** (`browser_snapshot`), returning deterministic element references (`ref`) for fast, reliable browser actions.

## Installed Configuration

The Playwright MCP server (`@playwright/mcp` v0.0.83) is installed globally and configured in `~/.gemini/config/mcp_config.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "node",
      "args": [
        "C:\\Users\\ardat\\AppData\\Roaming\\npm\\node_modules\\@playwright\\mcp\\cli.js"
      ]
    }
  }
}
```

### Optional CLI Flags
You can customize the server behavior in `~/.gemini/config/mcp_config.json` by appending flags to `args`:
- `--headless`: Run browser in headless mode without opening a visible window
- `--browser=chrome|firefox|webkit|msedge`: Choose target browser engine
- `--viewport-size=1280x720`: Set initial viewport dimensions
- `--device="iPhone 15"`: Emulate a specific mobile device

## Core MCP Tools Provided by Playwright MCP

When the `playwright` MCP server is active, the following tools become available:
- `browser_navigate`: Navigate to a URL (e.g., `http://localhost:5173`)
- `browser_snapshot`: Capture accessibility snapshot of the current page with interactive `ref` IDs
- `browser_click`: Perform click on an element using its `ref` and human-readable `element` description
- `browser_type`: Type text into an editable element (`ref`)
- `browser_press_key`: Press a keyboard key (e.g., `Enter`, `Escape`, `Tab`)
- `browser_select_option`: Select an option in a dropdown (`<select>`)
- `browser_hover`: Hover over an element
- `browser_take_screenshot`: Capture a visual PNG/JPEG screenshot of the page or element
- `browser_console_messages`: Retrieve browser console logs and errors
- `browser_network_requests`: Inspect network requests made by the page
- `browser_close`: Close the browser page

## Recommended Workflow for Testing This App (`tts-app`)

1. Ensure the backend (`http://127.0.0.1:8000`) and frontend (`http://localhost:5173`) servers are running.
2. Call `browser_navigate` to open `http://localhost:5173`.
3. Call `browser_snapshot` to inspect the accessibility tree and get element `ref` values.
4. Interact with elements (`browser_click`, `browser_type`) using their `ref` from the latest snapshot.
5. Check `browser_console_messages` and `browser_network_requests` to verify zero runtime or API errors.
