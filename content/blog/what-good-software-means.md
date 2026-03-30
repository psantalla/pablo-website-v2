---
title: What good software really is
description: How to define quality beyond UX, UI, or bug counts.
date: 2026-03-29
tags:
  - development
  - software
changelog:
draft: false
---
Good software… what does that even mean?

It’s one of those terms people throw around without really knowing. It can be UX, a polished UI, low bugs… or all of it at once. The phrase is so broad it’s lost meaning.

Good software is readable. Not just for machines, but for humans who will have to work with it later. Short, intentional pieces of code make it clear what’s happening.

It’s reusable within the project. Global where it makes sense, specific where it needs to be. Dependencies stay low, internal and external. DRY applies to code, files, and components.

Implementation isn’t just following the design; it’s about making decisions that survive change.

That’s where pillars come in. They define what cannot break. Core functionality like user and permission management, payment processing, or main data structures are functional pillars: they must stay stable. Design pillars, like the layout system, spacing, or color tokens in the design system, also must remain consistent.
