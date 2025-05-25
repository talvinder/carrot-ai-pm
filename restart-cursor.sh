#!/bin/bash

echo "🔄 Cursor MCP Client Restart Helper"
echo "=================================="
echo ""
echo "This script helps with the known MCP client issue where tools"
echo "are not detected until after multiple restarts (GitHub issue #1679)"
echo ""

# Function to check if Cursor is running
check_cursor() {
    if pgrep -f "Cursor" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to kill Cursor processes
kill_cursor() {
    echo "🛑 Stopping Cursor processes..."
    pkill -f "Cursor" 2>/dev/null || true
    sleep 2
    
    # Force kill if still running
    if check_cursor; then
        echo "🔨 Force stopping remaining Cursor processes..."
        pkill -9 -f "Cursor" 2>/dev/null || true
        sleep 2
    fi
}

# Function to start Cursor
start_cursor() {
    echo "🚀 Starting Cursor..."
    if command -v cursor > /dev/null; then
        cursor > /dev/null 2>&1 &
    elif [ -d "/Applications/Cursor.app" ]; then
        open -a "Cursor"
    else
        echo "❌ Cursor not found. Please start it manually."
        return 1
    fi
    sleep 3
}

echo "Starting restart cycle to fix MCP tool detection..."
echo ""

for i in {1..4}; do
    echo "🔄 Restart cycle $i/4"
    
    if check_cursor; then
        kill_cursor
    fi
    
    start_cursor
    
    echo "✅ Cycle $i complete. Please check if tools are visible in Cursor."
    
    if [ $i -lt 4 ]; then
        echo "⏳ Waiting 10 seconds before next cycle..."
        sleep 10
        echo ""
    fi
done

echo ""
echo "🎉 Restart cycles complete!"
echo ""
echo "If tools are still not visible:"
echo "1. Check MCP Logs in Cursor for connection errors"
echo "2. Verify the MCP configuration path is correct"
echo "3. Try manually restarting Cursor 2-3 more times"
echo "4. Check if other MCP servers (like weather) are working" 