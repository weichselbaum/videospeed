# [Install from Chrome Web Store][chrome-web-store-link]

[![Chrome Web Store][chrome-web-store-version]][chrome-web-store-link] [![Chrome Web Store Users][chrome-web-store-users-badge]][chrome-web-store-link] [![Chrome Web Store Users][chrome-web-store-stars]][chrome-web-store-link]

**Video Speed Controller** gives you fine-grained control over any HTML5 video
or audio element, on any site.

## The science of accelerated playback

**TL;DR** -- faster playback translates to better engagement and retention.

The average adult reads at [250-300 words per minute][wpm-study] (wpm). Speech
averages ~150 wpm; slide presentations often closer to 100 wpm. Given the
choice, most viewers [speed up playback to ~1.3-1.5x][ms-study] to close the
gap. Accelerated viewing [keeps attention longer][byu-study] -- faster delivery
means higher engagement. With practice, many settle at 2x or above and find it
[uncomfortable to return to 1x][mit-study].

[wpm-study]: http://www.paperbecause.com/PIOP/files/f7/f7bb6bc5-2c4a-466f-9ae7-b483a2c0dca4.pdf
[ms-study]: http://research.microsoft.com/en-us/um/redmond/groups/coet/compression/chi99/paper.pdf
[byu-study]: http://www.enounce.com/docs/BYUPaper020319.pdf
[mit-study]: http://alumni.media.mit.edu/~barons/html/avios92.html#beasleyalteredspeech

HTML5 media elements expose a native playback rate API, but most players hide
or artificially limit it. Speed adjustments should be effortless and frequent:
we don't read at a fixed pace, and we shouldn't watch at one either.

## Features

- **Universal** - works on any site with HTML5 media: YouTube, Netflix,
  Coursera, podcasts, local files, etc.
- **Video and audio** - controls both `<video>` and `<audio>` elements.
- **Fine-grained speed** - 0.07x to 16x in configurable increments.
- **Per-site speed rules** - set a default playback speed for specific domains
  (e.g., always 2x on lecture sites).
- **Per-site disable** - turn off the controller on sites where you don't
  want it.
- **Remember speed** - optionally persist your last speed across sessions
  and tabs.
- **Speed fightback** - automatically re-applies your chosen speed when a
  site's player tries to reset it.
- **Draggable overlay** - reposition the on-video speed indicator anywhere
  you like.
- **Fully customizable shortcuts** - remap every key, add modifier combos
  (Ctrl, Shift, Alt), create multiple preferred-speed toggles.
- **Custom controller CSS** - style or reposition the overlay with your own
  CSS rules.

## Default keyboard shortcuts

- **S** - decrease playback speed
- **D** - increase playback speed
- **R** - reset playback speed to 1.0x
- **Z** - rewind video by 10 seconds
- **X** - advance video by 10 seconds
- **G** - toggle between current and preferred speed
- **V** - show/hide the controller
- **M** - set a marker at current position
- **J** - jump back to the previously set marker

All shortcuts are fully customizable in the extension's settings page. You can
reassign keys, add modifier combinations, and define multiple preferred-speed
shortcuts with different values for quick toggling. Click **Add New** in
settings to create additional bindings. Refresh the page after making changes
for them to take effect.

## Instagram support

The controller runs on instagram.com for feed videos, Reels (the Reels tab and
`/reels/` URLs), Stories, and video posts opened in the permalink or modal
view. The speed badge is attached to Instagram's video player chrome, in the
corner of the video, so it stays on top of the tap layer. Clicks on the badge
change speed; taps and swipes on the rest of the video still go to Instagram.

Shortcuts work while an Instagram video is playing. They do not run while
focus is in a comment box, a message field, or any other text input.

**Remember speed** (extension options) stores the speed you pick and applies
it when Instagram swaps in the next reel or story and when you move to another
Instagram page. On a single visit, that speed also follows videos Instagram
has already put on the page, including the next reel in the list.

### Load the unpacked extension

1. From this repository, run `npm install` and then `npm run build`. The
   unpacked extension is the `dist/` directory.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select `dist/`.
5. Reload any Instagram tab that was already open.

Reload Instagram after changing options so the page picks up the new settings.

## License

(MIT License) - Copyright (c) 2014 Ilya Grigorik

[chrome-web-store-version]: https://img.shields.io/chrome-web-store/v/nffaoalbilbmmfgbnbgppjihopabppdk?label=Chrome%20Web%20Store
[chrome-web-store-users-badge]: https://img.shields.io/chrome-web-store/users/nffaoalbilbmmfgbnbgppjihopabppdk
[chrome-web-store-stars]: https://img.shields.io/chrome-web-store/stars/nffaoalbilbmmfgbnbgppjihopabppdk
[github-release-badge]: https://img.shields.io/github/v/release/igrigorik/videospeed
[chrome-web-store-link]: https://chromewebstore.google.com/detail/video-speed-controller/nffaoalbilbmmfgbnbgppjihopabppdk
[github-release-link]: https://github.com/igrigorik/videospeed/releases
