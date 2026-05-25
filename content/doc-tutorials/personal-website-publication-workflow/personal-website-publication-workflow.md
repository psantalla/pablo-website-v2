---
title: Website publication workflow
description: Quick summary about how I publish content on my personal website.
order: 2
date: 2026-05-24
docTopics:
  - Syncthing
  - Obsidian
  - Git
---
The content of my site (`/content`) is a set of markdown files (with accompanying media) that Eleventy compiles to HTML.

`/content` lives in a [repository](https://github.com/psantalla/pablo-website-v2), cloned on my local machine (a MacBook).

![Repository cloned on the MacBook](repo-clone.webp)

From that local copy on my MacBook, `/content` is synced via [Syncthing](https://syncthing.net/) with a folder on a hard drive connected to a Raspberry Pi.

![Syncthing between MacBook and Raspberry Pi](syncthing-mac-pi.webp)

The Pi doesn't only sync with my MacBook — it also syncs with my phone. Syncthing lets you re-distribute the same content to more devices from a single sync node.

![Syncthing also syncing with the phone](syncthing-pi-phone.webp)

Here's what we've got so far:

1. A GitHub repository holds the site, including the `/content` folder.
2. The full repository is cloned on my MacBook.
3. The MacBook syncs the files inside `/content` with a drive attached to a Raspberry Pi.
4. The Pi also syncs that content with my phone.

I also keep a vault of notes and files synced between my phone and my MacBook. That vault contains the website's content files too.

![Vault and content overlap](vault-overlap.webp)

So the MacBook intentionally holds replicas of a few things:

* The website's content files inside `/content`.
* The files in the vault that's synced with my phone.

These replicas live inside Syncthing's sync flow on purpose, which avoids conflicts that would arise from any process outside that flow touching the same files.

## Automatic publishing

Obsidian is convenient for editing markdown. For publishing, I'd rather lean on an independent Git system.

There are Obsidian plugins that would resolve a commit from inside the app, but the mobile integration has been reported as unstable, and I don't want the publishing path to depend on it.

The Raspberry Pi is always on. It's the stable node of the system.

`/content` lives in the repo next to project scaffolding: Nunjucks templates, Eleventy config, build data. The Pi doesn't need any of that — it's a content node, not a code node.

Syncthing filters at the source. Ignore patterns on the Pi exclude `.njk`, `.js`, `/feed`, `.virtual` from the transfer. What arrives on the Pi is content only: markdown, images, video.

The repository is cloned on the Pi with sparse-checkout, so only `/content` lives on disk, alongside the root files that sparse-checkout's cone mode includes by convention.

A `cron` job runs every ten minutes:

```bash
cd /mnt/files/pablo/personal-website \
  && git pull --rebase origin main \
  && git add content/ \
  && git diff --cached --quiet \
  || (git commit -m "content: auto-sync" && git push origin main)
```

`cron` because it needs no dependencies, starts with the system, and requires no maintenance. No daemons, no extra processes.

Before committing, it checks for an actual diff. No changes, no commit.

The push triggers GitHub Actions. Eleventy compiles. The site updates.
