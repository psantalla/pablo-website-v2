---
title: "Pi 5 NAS Setup"
description: "Complete setup guide for Raspberry Pi 5 as NAS with Time Machine, Samba, and Syncthing"
order: 2
date: 2025-12-14
docTopics:
  - Raspberry Pi
  - NAS
  - Samba
  - Syncthing
  - macOS
changelog:
  - "Translated from Spanish to English"
---

<blockquote>
This is my setup for turning a Raspberry Pi 5 into a home NAS server. It handles Time Machine backups, shared storage, and Android sync with ignore-delete functionality. Pretty straightforward once you know the steps.
</blockquote>

## Objective

NAS server: Time Machine (Mac), shared storage, Android→Pi sync with ignoreDelete (saves mobile space, files remain on server).

**Recommended disk sizes:**
- Minimum 2TB for basic setup (1TB Time Machine + 1TB files)
- 4-6TB sweet spot for home use (2TB Time Machine + rest for files)
- My setup: 4.5TB disk (1.8TB Time Machine + 2.7TB files, ext4)

Services: Samba, Avahi (mDNS), Syncthing.

## 1. Partitioning and Mounting

Create partitions and format:

```bash
sudo parted /dev/sda
mklabel gpt
mkpart primary hfs+ 0% 2TB
mkpart primary ext4 2TB 100%
quit

sudo mkfs.ext4 -L TimeMachine /dev/sda1
sudo mkfs.ext4 -L Files /dev/sda2
sudo mkdir -p /mnt/timemachine /mnt/files
sudo mount /dev/sda1 /mnt/timemachine
sudo mount /dev/sda2 /mnt/files
sudo chown -R yourusername:yourusername /mnt/timemachine /mnt/files
```

Get your UUIDs:

```bash
lsblk -o NAME,UUID
```

*Example UUIDs (yours will be different):*
- *TimeMachine: `a843d642-b9fa-444c-97c1-a40f80fafebf`*
- *Files: `8d84844b-f35c-468c-a1fb-bfccd67fa17c`*

Auto-mount in `/etc/fstab`:

```
UUID=your-timemachine-uuid /mnt/timemachine ext4 defaults,nofail 0 0
UUID=your-files-uuid /mnt/files ext4 defaults,nofail 0 0
```

## 2. Samba + Avahi

Installation and configuration:

```bash
sudo apt update && sudo apt install -y samba avahi-daemon
```

Edit `/etc/samba/smb.conf` and add at the end:

```ini
[TimeMachine]
comment = Time Machine Backup
path = /mnt/timemachine
browseable = yes
writeable = yes
create mask = 0600
directory mask = 0700
valid users = yourusername
vfs objects = catia fruit streams_xattr
fruit:aapl = yes
fruit:time machine = yes

[Files]
comment = Shared Files
path = /mnt/files
browseable = yes
writeable = yes
create mask = 0644
directory mask = 0755
valid users = yourusername
```

Set Samba password and enable services:

```bash
sudo smbpasswd -a yourusername
sudo systemctl restart smbd
sudo systemctl enable smbd avahi-daemon
```

Create `/etc/avahi/services/samba.service`:

```xml
<?xml version="1.0" standalone='no'?>
<!DOCTYPE service-group SYSTEM "avahi-service.dtd">
<service-group>
  <name replace-wildcards="yes">%h</n>
  <service>
    <type>_smb._tcp</type>
    <port>445</port>
  </service>
  <service>
    <type>_device-info._tcp</type>
    <port>9</port>
    <txt-record>model=TimeCapsule8,119</txt-record>
  </service>
  <service>
    <type>_adisk._tcp</type>
    <port>9</port>
    <txt-record>dk0=adVN=TimeMachine,adVF=0x82</txt-record>
    <txt-record>sys=adVF=0x100</txt-record>
  </service>
</service-group>
```

Restart Avahi:

```bash
sudo systemctl restart avahi-daemon
```

## 3. Syncthing

Installation:

```bash
curl -s https://syncthing.net/release-key.txt | gpg --dearmor | sudo tee /usr/share/keyrings/syncthing-archive-keyring.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/syncthing-archive-keyring.gpg] https://apt.syncthing.net/ syncthing stable" | sudo tee /etc/apt/sources.list.d/syncthing.list
sudo apt update && sudo apt install -y syncthing
sudo systemctl enable syncthing@yourusername.service
sudo systemctl start syncthing@yourusername.service
```

Web UI: `http://localhost:8384` or `http://your-pi-ip:8384`

Media folder with ignoreDelete (Android deletions don't affect Pi):

```bash
mkdir /mnt/files/Media
```

After accepting share from Android in web UI, stop Syncthing and edit config:

```bash
sudo systemctl stop syncthing@yourusername.service
nano /home/yourusername/.local/state/syncthing/config.xml
```

In the `<folder>` section for Media, change `<ignoreDelete>false</ignoreDelete>` to `<ignoreDelete>true</ignoreDelete>`.

Restart Syncthing:

```bash
sudo systemctl start syncthing@yourusername.service
```

## Access

**Network:**
- IP: Your Pi's IP address
- Hostname: `your-hostname.local`

**Shares:**
- Mac Time Machine: `smb://your-hostname.local/TimeMachine`
- Android TV: `smb://your-hostname.local/Files/Media`
- Syncthing: `http://your-pi-ip:8384`

**User:** your username

## Structure

```
/mnt/timemachine/ (1.8TB, ext4)
/mnt/files/ (2.7TB, ext4)
  └── Media/ (ignoreDelete=true)
```

## Verification

```bash
df -h | grep sda
sudo systemctl status smbd avahi-daemon syncthing@yourusername.service
```

## Notes

- **Auto-start:** Services and mounts start with the Pi
- **ignoreDelete:** Only Media folder. Other folders use normal bidirectional sync
- **ext4:** Better performance than HFS+. Time Machine works via SMB
- **Hostname:** Prefer `.local` hostname over IP (more robust)

## Quick Reference (AI Replication)

```
System: Pi 5, Raspberry Pi OS, 4-6TB USB disk
Goal: NAS + Time Machine + Android sync

1. Partition: 2TB ext4 (TimeMachine) + rest ext4 (Files)
2. fstab auto-mount in /mnt/timemachine and /mnt/files
3. samba + avahi-daemon
4. smb.conf with fruit:time machine = yes
5. Avahi samba.service (Time Capsule icon)
6. Syncthing official repo
7. /mnt/files/Media with ignoreDelete=true in config.xml
8. systemctl enable everything
```

## Quick Commands

Restart services:

```bash
sudo systemctl restart smbd avahi-daemon syncthing@yourusername.service
```

Logs:

```bash
sudo journalctl -u smbd -f
sudo journalctl -u syncthing@yourusername.service -f
```

Add user:

```bash
sudo adduser username
sudo smbpasswd -a username
```

Edit `/etc/samba/smb.conf` and add to `valid users`.

Change password:

```bash
sudo smbpasswd yourusername
```
