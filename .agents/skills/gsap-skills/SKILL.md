---
name: gsap-skills
description: Comprehensive GSAP animation best practices including timelines, ScrollTrigger pin/scrub, 3D transform quickTo, lagSmoothing, and GPU acceleration.
---

# GSAP Skills — Best Practices Guide

## Core Principles

1. **Use `gsap.timeline()` for Sequenced Animations**:
   Group multi-element animations in timelines rather than chaining individual `gsap.to()` calls with manual delays.

2. **ScrollTrigger Optimization**:
   - Always call `gsap.registerPlugin(ScrollTrigger)` once at init.
   - Use `fastScrollEnd: true` or `preventOverlaps: true` for scroll performance.
   - Prefer `gsap.quickTo()` for mousemove and dynamic parallax handlers instead of creating new tweens on every mouse frame.

3. **GPU-Accelerated Properties**:
   Animates `transform` (`x`, `y`, `z`, `scale`, `rotation`, `rotateX`, `rotateY`) and `opacity` exclusively for 60fps renders. Avoid animating `top`, `left`, `width`, `height` directly.

4. **Will-Change & Cleanup**:
   - Set `will-change: transform, opacity` in CSS for animated layers.
   - Clean up ScrollTriggers with `ScrollTrigger.getAll().forEach(t => t.kill())` when tearing down or re-initializing scenes.
