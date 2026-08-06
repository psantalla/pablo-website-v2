---
title: Summer of Soccer by Google Search
madeAt: Left Field Labs
date: 2026-08-05
projectLink: https://search.google/summerofsoccer/
description: "Rapid frontend build with Left Field Labs for Google Search: motion, scroll snapping, and native 3D."
projectTopics:
- Frontend
- Motion
- GSAP
- SSG
draft: false
---
{% import "components/video-control.njk" as vc %}

> This is a project for <a href="https://search.google/" target="_blank" rel="noopener noreferrer">Google Search</a>, so there's a baseline of privacy around it. If something here catches your eye and you want to talk it through, happy to do it in a separate demo or with equivalent tech.

This is a casual, fun project I have the opportunity to work on. It happened during the last week of the World Cup (*fútbol* World Cup; *vamos España!* btw). It came up as a rapid implementation after a couple of cycles of design and dev sync where transitions and scroll snapping plays a role in guiding the user through the page.

{{ vc.figure("rotating-flags.mp4", "Simple but effective use of cursor position and native styles for a full 3D feel.", 1920, 1080) }}

Intentionally avoiding CTAs gives us some breathing room to time animations properly and really make the content show up in the right place, at the right moment, for the right amount of time.

{{ vc.figure("scroll-snapping.mp4", "Scroll snapping doing the heavy lifting: one beat per screen.", 1920, 1080) }}

{{ vc.figure("soccer-words-languages.mp4", "", 1920, 1080) }}

And as always at <a href="https://leftfieldlabs.com/" target="_blank" rel="noopener noreferrer">LFL</a>, motion design played a key role in getting iterations out the door in record time.

<script src="/js/video-control.js" defer></script>
