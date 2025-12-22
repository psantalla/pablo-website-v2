---
title: "VS Code on Raspberry Pi 5 - Stable Setup"
description: "Fix for VS Code crashes on Raspberry Pi 5 with 16K pagesize kernel"
order: 3
date: 2025-12-21
docTopics:
  - Raspberry Pi
  - VS Code
  - Linux
changelog:
  - "Translated from Spanish to English"
---

> VS Code v1.97+ crashes on Pi 5 with "code 5" error due to incompatibility with the 16K pagesize kernel. This is the workaround I've been using since the bug appeared. As of this revision date, Microsoft hasn't fixed it yet, but it's likely this will become unnecessary at some point.

## Problem

VS Code v1.97+ crashes with "code 5" error on Pi5 due to incompatibility with 16K pagesize kernel.

## Solution

### Kernel Fix (permanent)

1. Edit boot configuration:

```bash
sudo nano /boot/firmware/config.txt
```

2. Add at the end:

```
kernel=kernel8.img
```

3. Reboot:

```bash
sudo reboot
```

### Install VS Code

```bash
sudo apt update
sudo apt install code -y
```

### First Launch

```bash
code
```

On login: accept "Use weaker encryption" (keyring not available by default).

## Performance

- Loss: ~2-5% with 4K kernel vs 16K (imperceptible in practice).
- Benefit: Stable VS Code + automatic updates.

## Restore 16K Kernel (if Microsoft fixes the bug)

1. Edit boot configuration:

```bash
sudo nano /boot/firmware/config.txt
```

2. Remove this line:

```
kernel=kernel8.img
```

3. Reboot:

```bash
sudo reboot
```

4. Check if VS Code remains stable. If it crashes, revert the change.

## Known Issues

- **Keyring warning:** Normal behavior, use "weaker encryption"
- **Mouse lag:** `Ctrl+Shift+P` → "Configure Runtime Arguments" → uncomment `"disable-hardware-acceleration": true`
- **VNC:** Degraded performance, use SSH Remote instead

## System Info

- **Bug affects:** VS Code v1.97.x, v1.98.x (and possibly later versions)
- **Tested on:** Raspberry Pi 5 (8GB), Raspberry Pi OS Bookworm 64-bit
