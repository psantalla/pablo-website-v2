---
title: "macOS Wi-Fi/Ethernet Priority Toggle in Menu Bar"
description: "One-click toggle between Wi-Fi and Ethernet priority using SwiftBar and a native bash plugin"
order: 0
date: 2026-05-12
docTopics:
  - macOS
  - SwiftBar
  - Networking
---

> Click in the menu bar to switch which interface gets priority. Wi-Fi when you want to move around, Ethernet when you want stability. macOS handles the fallback natively if you unplug the cable. No third-party app for the toggle itself, just a small bash plugin running inside SwiftBar. I went with a single click on the title and no dropdown to keep the surface minimal, errors are logged to a file if something fails.

## Use Case

You are on a video call over Ethernet through a USB-C dongle. The call is stable, the cable is doing its job. Then you need to get up. Maybe pace around the room, grab water, move to the couch. Until now this meant ending the call early, or yanking the dongle and praying the Wi-Fi takes over fast enough. macOS does fall back to Wi-Fi when it loses the cable, but the transition is abrupt and apps notice. Calls drop frames. Long-lived TCP connections renegotiate. SSH sessions hang for a moment.

What I actually want is the opposite flow: keep the cable plugged in, but tell macOS "from now on prefer Wi-Fi", give the OS a few seconds to make Wi-Fi the active route while the cable is still there as a safety net, then unplug whenever I want without a hard cut. One click in the menu bar, three seconds of grace, done. Same scenario reversed when I sit back down: click again, priority goes back to Ethernet, no Settings panel.

Other places where this is useful day to day:

- **Long file transfers, syncs or backups** (Syncthing, Kopia, rsync) where you don't want the underlying socket to die mid-transfer just because you needed to move.
- **Local dev servers tied to a specific IP** when working on something that other devices on the network are hitting. Switching priority gracefully avoids the IP shuffle that happens when the cable goes away cold.
- **Diagnostics:** force traffic through Wi-Fi or Ethernet to isolate which path is causing latency, packet loss or DNS weirdness, without unplugging anything.

## Problem

macOS has Service Order in System Settings to prioritize one network service over another, but switching it requires opening Settings every time. Annoying when you change context often.

## Solution

A SwiftBar plugin that reads and reorders network services with `networksetup`. Left-click toggles, with a 3-second window to cancel if you misclicked.

### Install SwiftBar

```bash
brew install --cask swiftbar
```

Open it. First launch asks for the plugin folder. If you don't already have one set, pick anywhere you want, somewhere under `~/Documents` is a common default. The one I use is `~/SwiftBar` because I keep it short and out of the way. Whatever you choose, remember the path since you'll drop the script there in the next step.

If SwiftBar was already installed, check the current plugin folder under SwiftBar Preferences. You can keep it as-is.

### Identify your network services

```bash
networksetup -listallnetworkservices
```

You need the exact names of your Wi-Fi and Ethernet entries. In my case `Wi-Fi` and `AX88179A` (USB-C dongle). Adjust the constants in the script if yours differ.

### Create the plugin

Inside your SwiftBar plugin folder, create the script:

```bash
touch <plugin-folder>/network-priority.30s.sh
chmod +x <plugin-folder>/network-priority.30s.sh
```

Open it and paste:

```bash
#!/bin/bash

# <xbar.title>Network Priority</xbar.title>
# <xbar.version>2.0</xbar.version>
# <xbar.desc>Toggle network service priority. Errors logged at $SWIFTBAR_PLUGIN_DATA_PATH/errors.log</xbar.desc>
# <swiftbar.hideAbout>true</swiftbar.hideAbout>
# <swiftbar.hideRunInTerminal>true</swiftbar.hideRunInTerminal>
# <swiftbar.hideLastUpdated>true</swiftbar.hideLastUpdated>
# <swiftbar.hideDisablePlugin>true</swiftbar.hideDisablePlugin>
# <swiftbar.hideSwiftBar>true</swiftbar.hideSwiftBar>
# <swiftbar.refreshOnOpen>true</swiftbar.refreshOnOpen>

set -euo pipefail

readonly WIFI_SERVICE="Wi-Fi"
readonly ETH_SERVICE="AX88179A"
readonly LABEL_WIFI="WIFI"
readonly LABEL_ETH="ETH"
readonly PENDING_FILE="/tmp/network-priority.pending"
readonly COMMIT_PID_FILE="/tmp/network-priority.commit.pid"
readonly COMMIT_DELAY=3
readonly LOG_DIR="${SWIFTBAR_PLUGIN_DATA_PATH:-/tmp}"
readonly LOG_FILE="${LOG_DIR}/errors.log"

log_error() {
  mkdir -p "$LOG_DIR" 2>/dev/null || true
  printf '%s\t%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" >> "$LOG_FILE"
}

get_service_order() {
  networksetup -listnetworkserviceorder 2>/dev/null | sed -n 's/^([0-9][0-9]*) \*\{0,1\}//p'
}

get_priority() {
  local service
  while IFS= read -r service; do
    case "$service" in
      "$WIFI_SERVICE") echo "wifi"; return ;;
      "$ETH_SERVICE")  echo "eth";  return ;;
    esac
  done < <(get_service_order)
}

get_active_interface() {
  route -n get default 2>/dev/null | awk '/interface:/ {print $2}'
}

get_active_service() {
  local iface="$1"
  [[ -z "$iface" ]] && return
  networksetup -listnetworkserviceorder 2>/dev/null | awk -v dev="Device: ${iface})" '
    /^\([0-9]+\)/ { sub(/^\([0-9]+\) \*?/, ""); name = $0 }
    /Hardware Port:/ && $0 ~ ("(, |\\()" dev "$") { print name; exit }
  '
}

label_for() {
  case "$1" in
    wifi) echo "$LABEL_WIFI" ;;
    eth)  echo "$LABEL_ETH" ;;
    *)    echo "-" ;;
  esac
}

refresh_plugin() {
  local name="${SWIFTBAR_PLUGIN_PATH:-}"
  if [[ -n "$name" ]]; then
    name="${name##*/}"
    open -g "swiftbar://refreshplugin?name=${name}" 2>/dev/null || true
  else
    open -g "swiftbar://refreshallplugins" 2>/dev/null || true
  fi
}

reorder() {
  local target="$1"
  local service new_order=() stderr_output

  case "$target" in
    wifi) new_order+=("$WIFI_SERVICE" "$ETH_SERVICE") ;;
    eth)  new_order+=("$ETH_SERVICE" "$WIFI_SERVICE") ;;
  esac

  while IFS= read -r service; do
    [[ "$service" == "$WIFI_SERVICE" || "$service" == "$ETH_SERVICE" ]] && continue
    new_order+=("$service")
  done < <(get_service_order)

  if ! stderr_output=$(networksetup -ordernetworkservices "${new_order[@]}" 2>&1 >/dev/null); then
    log_error "reorder to '$target' failed: ${stderr_output:-unknown error}"
    return 1
  fi
  return 0
}

kill_pending_commit() {
  if [[ -f "$COMMIT_PID_FILE" ]]; then
    local old_pid
    old_pid=$(cat "$COMMIT_PID_FILE" 2>/dev/null || true)
    [[ -n "$old_pid" ]] && kill "$old_pid" 2>/dev/null || true
    rm -f "$COMMIT_PID_FILE"
  fi
}

schedule_commit() {
  local target="$1"
  kill_pending_commit
  echo "$target" > "$PENDING_FILE"
  (
    trap 'rm -f "$PENDING_FILE" "$COMMIT_PID_FILE"; refresh_plugin' EXIT
    sleep "$COMMIT_DELAY"
    [[ -s "$PENDING_FILE" ]] && reorder "$(cat "$PENDING_FILE")" || true
  ) >/dev/null 2>&1 &
  echo "$!" > "$COMMIT_PID_FILE"
  disown
}

cancel_pending() {
  kill_pending_commit
  rm -f "$PENDING_FILE"
}

read_pending() {
  [[ -s "$PENDING_FILE" ]] || return 1
  cat "$PENDING_FILE"
}

if [[ "${1:-}" == "toggle" ]]; then
  if read_pending >/dev/null; then
    cancel_pending
  else
    current=$(get_priority)
    case "$current" in
      wifi) schedule_commit eth ;;
      eth)  schedule_commit wifi ;;
      *)    log_error "toggle invoked but neither Wi-Fi nor Ethernet found as priority" ;;
    esac
  fi
  exit 0
fi

priority=$(get_priority)
active_iface=$(get_active_interface)
active_service=$(get_active_service "$active_iface")

case "$active_service" in
  "$WIFI_SERVICE") active_label="$LABEL_WIFI" ;;
  "$ETH_SERVICE")  active_label="$LABEL_ETH" ;;
  *)               active_label="-" ;;
esac

priority_label=$(label_for "$priority")

if pending=$(read_pending); then
  pending_label=$(label_for "$pending")
  display="$priority_label > $pending_label"
else
  if [[ "$active_label" == "$priority_label" ]]; then
    display="$active_label"
  else
    display="$active_label · $priority_label"
  fi
fi

echo "$display | shell=$0 param1=toggle terminal=false refresh=true"
```

Save. Refresh SwiftBar:

```bash
killall SwiftBar && sleep 1 && open /Applications/SwiftBar.app
```

## Reading the Menu Bar

First token is what macOS is actually using right now. Second token (only shown if it differs) is the priority you chose.

| Display | Meaning |
|---|---|
| `WIFI` | Using Wi-Fi, priority Wi-Fi |
| `ETH` | Using Ethernet, priority Ethernet |
| `WIFI · ETH` | Using Wi-Fi but priority is Ethernet (cable unplugged or no link) |
| `ETH · WIFI` | Using Ethernet but priority is Wi-Fi (no Wi-Fi available) |
| `WIFI > ETH` | Pending toggle to Ethernet, applies in 3s, click again to cancel |

## How It Works

The script reorders network services with `networksetup -ordernetworkservices`. Both services stay enabled at all times, so macOS handles the fallback natively when the prioritized one loses connectivity.

State lives in macOS itself, so the priority persists across reboots without the script writing anything to disk for that.

## Tweaks

- **Different Ethernet adapter:** change `ETH_SERVICE` to match the name from `networksetup -listallnetworkservices`.
- **Faster polling:** rename the file from `.30s.sh` to `.10s.sh` for a 10-second refresh interval instead of 30.
- **Launch at Login:** click any SwiftBar item in the menu bar, Preferences, Launch at Login.

## Known Issues

- **No dropdown menu:** by design. SwiftBar has open issue #244 about how titles with a shell action behave. I chose left-click as toggle and skipped the dropdown to keep the surface minimal.
- **Right-click does nothing:** SwiftBar does not expose right-click as a separate event when the title has a shell action. Only left-click triggers the toggle.
- **Phantom services from old dongles:** macOS keeps services from disconnected adapters in the list. Doesn't break anything, the script ignores them.

## System Info

- **Tested on:** macOS 14 / 15, Apple Silicon
- **SwiftBar version:** 2.0.1
- **Dependencies:** none beyond macOS native tools (`networksetup`, `route`, `awk`, `sed`)
