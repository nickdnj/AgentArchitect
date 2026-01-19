#!/bin/bash
# OAuth Initialization Script for MCP Servers
# Run this script to complete OAuth authentication for Gmail and GDrive accounts

set -e

echo "=== MCP OAuth Initialization ==="
echo ""
echo "This script will help you authenticate with Google APIs."
echo "A browser window will open for each account you choose to initialize."
echo ""

# Function to initialize Gmail OAuth
init_gmail() {
    local account_name=$1
    local creds_dir=$2

    echo "--- Gmail: $account_name ---"
    echo "Credentials directory: $creds_dir"

    # Ensure directory exists
    mkdir -p "$creds_dir"

    # Check for OAuth keys
    if [ ! -f "$creds_dir/credentials.json" ]; then
        echo "ERROR: credentials.json not found in $creds_dir"
        echo "Please download from Google Cloud Console and save as credentials.json"
        return 1
    fi

    echo "Starting OAuth flow... (browser will open)"
    echo "Sign in with your $account_name Google account"
    echo ""

    # Run npx locally to perform OAuth flow
    GMAIL_CREDENTIALS_PATH="$creds_dir/credentials.json" \
    GMAIL_TOKEN_PATH="$creds_dir/token.json" \
    npx -y @gongrzhe/server-gmail-autoauth-mcp &

    local pid=$!
    sleep 5

    # Check if token was created
    if [ -f "$creds_dir/token.json" ]; then
        echo "SUCCESS: Token saved to $creds_dir/token.json"
        kill $pid 2>/dev/null || true
    else
        echo "Waiting for OAuth completion..."
        echo "Press Enter after you've completed the browser authentication"
        read -r
        kill $pid 2>/dev/null || true

        if [ -f "$creds_dir/token.json" ]; then
            echo "SUCCESS: Token saved"
        else
            echo "WARNING: Token file not created. OAuth may have failed."
        fi
    fi
    echo ""
}

# Function to initialize GDrive OAuth
init_gdrive() {
    local account_name=$1
    local creds_dir=$2

    echo "--- Google Drive: $account_name ---"
    echo "Credentials directory: $creds_dir"

    mkdir -p "$creds_dir"

    if [ ! -f "$creds_dir/gcp-oauth.keys.json" ]; then
        echo "ERROR: gcp-oauth.keys.json not found in $creds_dir"
        echo "Please download from Google Cloud Console and save as gcp-oauth.keys.json"
        return 1
    fi

    echo "Starting OAuth flow... (browser will open)"
    echo "Sign in with your $account_name Google account"
    echo ""

    GDRIVE_CREDS_DIR="$creds_dir" npx -y @isaacphi/mcp-gdrive &

    local pid=$!
    sleep 5

    echo "Waiting for OAuth completion..."
    echo "Press Enter after you've completed the browser authentication"
    read -r
    kill $pid 2>/dev/null || true

    echo "OAuth flow complete. Credentials cached in $creds_dir"
    echo ""
}

# Interactive menu
echo "Select what to initialize:"
echo "1) Gmail - Board (wharfside-govdocs)"
echo "2) Gmail - Personal (d3marco-1)"
echo "3) Google Drive - Board (wharfside-govdocs)"
echo "4) Google Drive - Personal (d3marco-1)"
echo "5) All Gmail accounts"
echo "6) All Google Drive accounts"
echo "7) Everything (all accounts)"
echo ""
read -p "Selection [1-7]: " choice

case $choice in
    1) init_gmail "Board" "$HOME/.config/mcp-gmail-board" ;;
    2) init_gmail "Personal" "$HOME/.config/mcp-gmail-personal" ;;
    3) init_gdrive "Board" "$HOME/.config/mcp-gdrive-board" ;;
    4) init_gdrive "Personal" "$HOME/.config/mcp-gdrive-personal" ;;
    5)
        init_gmail "Board" "$HOME/.config/mcp-gmail-board"
        init_gmail "Personal" "$HOME/.config/mcp-gmail-personal"
        ;;
    6)
        init_gdrive "Board" "$HOME/.config/mcp-gdrive-board"
        init_gdrive "Personal" "$HOME/.config/mcp-gdrive-personal"
        ;;
    7)
        init_gmail "Board" "$HOME/.config/mcp-gmail-board"
        init_gmail "Personal" "$HOME/.config/mcp-gmail-personal"
        init_gdrive "Board" "$HOME/.config/mcp-gdrive-board"
        init_gdrive "Personal" "$HOME/.config/mcp-gdrive-personal"
        ;;
    *)
        echo "Invalid selection"
        exit 1
        ;;
esac

echo "=== OAuth Initialization Complete ==="
