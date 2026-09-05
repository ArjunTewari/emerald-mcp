#!/bin/bash
# Emerald AI MCP — one-shot installer for macOS
# Run from inside the cloned emerald-mcp folder: bash install.sh

set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="$HOME/.claude"
SKILL_DIR="$CLAUDE_DIR/skills/emerald-report"
MCP_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Emerald AI MCP Installer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Check Node.js
if ! command -v node &> /dev/null; then
  echo "✗ Node.js not found. Install it first:"
  echo "  brew install node"
  exit 1
fi
echo "✓ Node.js $(node --version)"

# 2. Install runtime dependencies
echo ""
echo "→ Installing MCP runtime dependencies ..."
npm install --omit=dev --prefix "$REPO_DIR"
echo "✓ Runtime dependencies installed"

# 3. Install SKILL.md into Claude Code skills folder
echo ""
echo "→ Installing SKILL.md to $SKILL_DIR ..."
mkdir -p "$SKILL_DIR"
cp "$REPO_DIR/SKILL.md" "$SKILL_DIR/SKILL.md"
echo "✓ Skill installed"

# 4. Create config.json if it doesn't exist
if [ ! -f "$REPO_DIR/config.json" ]; then
  cp "$REPO_DIR/config.json.example" "$REPO_DIR/config.json"
  echo ""
  echo "⚠  config.json created from template."
  echo "   Edit it now and fill in your API keys:"
  echo "   $REPO_DIR/config.json"
  echo ""
fi

# 5. Write Claude Desktop MCP config
echo "→ Configuring Claude Desktop ..."
mkdir -p "$(dirname "$MCP_CONFIG")"

if [ -f "$MCP_CONFIG" ]; then
  # Back up existing config
  cp "$MCP_CONFIG" "$MCP_CONFIG.bak"
  echo "   Backed up existing config to claude_desktop_config.json.bak"

  # Check if emerald-ai-agentic already exists
  if grep -q "emerald-ai-agentic" "$MCP_CONFIG"; then
    echo "   emerald-ai-agentic entry already present — skipping (edit manually if path changed)"
  else
    # Inject into existing JSON — insert before last closing brace of mcpServers
    python3 - "$MCP_CONFIG" "$REPO_DIR/mcp-agentic.mjs" << 'PYEOF'
import json, sys
config_path, mjs_path = sys.argv[1], sys.argv[2]
with open(config_path) as f:
    cfg = json.load(f)
cfg.setdefault("mcpServers", {})["emerald-ai-agentic"] = {
    "command": "node",
    "args": [mjs_path]
}
with open(config_path, "w") as f:
    json.dump(cfg, f, indent=2)
print("   ✓ emerald-ai-agentic added to Claude Desktop config")
PYEOF
  fi
else
  # Create fresh config
  python3 - "$MCP_CONFIG" "$REPO_DIR/mcp-agentic.mjs" << 'PYEOF'
import json, sys
config_path, mjs_path = sys.argv[1], sys.argv[2]
cfg = {"mcpServers": {"emerald-ai-agentic": {"command": "node", "args": [mjs_path]}}}
with open(config_path, "w") as f:
    json.dump(cfg, f, indent=2)
print("   ✓ Claude Desktop config created")
PYEOF
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Done! Next steps:"
echo ""
echo "  1. Fill in your API keys (if not done):"
echo "     open $REPO_DIR/config.json"
echo ""
echo "  2. Quit Claude Desktop completely (Cmd+Q)"
echo "     then relaunch it."
echo ""
echo "  3. In Claude, type: /emerald-report"
echo "     to generate your first report."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
