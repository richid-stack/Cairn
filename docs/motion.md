# Motion rules

Motion in Cairn explains something. If an animation does not do one of the jobs below, it is removed.

## The three jobs

1. **Feedback.** Something you did was received: a button presses in, a switch slides, a toast arrives.
2. **Continuity.** Something moved or changed place and the eye should follow it: a dialog rising from below, a menu opening beside its button.
3. **Waiting.** Something is on its way: a skeleton sweep, a spinner. Never decoration while nothing is loading.

## Timing

| Token                      | Time   | Use                                                    |
| -------------------------- | ------ | ------------------------------------------------------ |
| `--cairn-duration-instant` | 90 ms  | Press, hover and focus feedback. Never slower than 100 |
| `--cairn-duration-quick`   | 160 ms | Small things appearing: toast, menu, dialog, switch    |
| `--cairn-duration-base`    | 240 ms | Panels and drawers moving                              |
| `--cairn-duration-slow`    | 360 ms | Whole-screen changes. Nothing is longer than 400 ms    |

| Easing               | Use                                                                         |
| -------------------- | --------------------------------------------------------------------------- |
| `--cairn-ease-enter` | Things arriving: fast start, soft landing                                   |
| `--cairn-ease-exit`  | Things leaving: gentle start, quick finish. Leaving is faster than arriving |
| `--cairn-ease`       | Movement that stays on screen                                               |

## Rules

- Only animate `opacity` and `transform`, plus colors. Animating size or position properties makes the page jump on slow phones.
- Interruptible. If someone clicks again mid-animation, the new state wins at once.
- Never block. Nothing waits for an animation to finish before it can be used.
- **Reduced motion.** Every duration token becomes 1 ms under `prefers-reduced-motion: reduce`, so anything driven by tokens stops moving without extra code. Keyframe animations that loop (spinner, skeleton) have their own reduced-motion rule: the spinner becomes a still dotted ring and the skeleton a still block. A test fails if a duration token is missed.
- Meaning never lives only in motion. A toast has a written tone and an icon; a spinner has a text label.
