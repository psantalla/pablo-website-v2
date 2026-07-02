---
title: Google Labs refresh
madeAt: Left Field Labs
date: 2026-05-20
projectLink: https://labs.google/
description: "Frontend engineering on the Google Labs update across three sprints with Left Field Labs: structure, motion, interactivity, performance."
projectTopics:
  - Frontend
  - TypeScript
  - GSAP
  - Matter.js
draft: false
---
{% import "components/video-control.njk" as vc %}

> Heads up: this is more about how the project felt than the technical guts. Most of what shipped came out of team iteration at <a href="https://leftfieldlabs.com/" target="_blank" rel="noopener noreferrer">Left Field Labs</a>, so I keep the deep implementation details out of public writing. Happy to chat about ideas. The "how did you build X" questions are easier to walk through in an unrelated codebase.

I worked on the Google Labs update with <a href="https://leftfieldlabs.com/" target="_blank" rel="noopener noreferrer">Left Field Labs</a> across three sprints, contributing directly to Google's codebase through Gerrit. Left Field Labs led the engagement and worked closely with the Google Labs team. The level of iteration around details was high, which I genuinely enjoyed. My focus was the frontend: structure, motion, interactivity and keeping performance in good shape as the page became more demanding.

{{ vc.figure("portfolio-glabs.mp4", "", 1920, 1068) }}

It's where products like <a href="https://flow.google" target="_blank" rel="noopener noreferrer">Google Flow</a>, <a href="https://notebooklm.google/" target="_blank" rel="noopener noreferrer">NotebookLM</a>, <a href="https://stitch.withgoogle.com/" target="_blank" rel="noopener noreferrer">Stitch</a>, <a href="https://labs.google.com/pomelli/about" target="_blank" rel="noopener noreferrer">Pomelli</a> and <a href="https://www.flowmusic.app/" target="_blank" rel="noopener noreferrer">Flow Music</a> get surfaced. A lot of eyes on it, so details mattered.

{{ vc.figure("glabs-interactions.mp4", "Close work with the motion design team. Every interaction calibrated and signed off together: in a team where rough-enough doesn't fly, that conversation is half the work.", 876, 1080) }}

So much of it is the small details, and the shapes are the best example. That part was a blast. The requests got delightfully weird: draw faces on them, make them react to being poked. Chasing those down turned into some genuinely fun physics work. The polish comes from exactly that, the team poking at odd ideas until the thing feels alive instead of just correct.

{{ vc.figure("portfolio-labs-shapes.mp4", "(I may or may not have hidden a few easter eggs in there.)", 1920, 1068) }}

A few things under the hood:

- +15% performance on a page running ~30 videos, via careful loading and viewport-aware playback.
- Physics rebuilt on Matter.js: scroll velocity feeds the simulation, so movement reacts to how you actually scroll.
- Lottie animations that read intent: scroll harder, things speed up, and it feels less scripted.

<script src="/js/video-control.js" defer></script>
