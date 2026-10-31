/**
 * Instagram handler.
 *
 * Logged-out Reels (Oct 2026) render the <video> in one branch and a
 * full-size tap layer in a sibling branch. That layer is a
 * [role="group"][data-visualcompletion="ignore"] element labeled
 * "Video player" in English, hosted by a data-instancekey="id-vpuid-…"
 * portal. The default controller is inserted beside the <video>, under
 * that layer, so the badge is visible but not clickable.
 *
 * The badge is appended inside the player surface (a small hit target in
 * the corner). The rest of the surface keeps receiving taps and swipes.
 * Feed and story videos often use the same player and are also muted
 * looping clips without native controls, which the generic GIF filter
 * would otherwise drop.
 */

window.VSC = window.VSC || {};

class InstagramHandler extends window.VSC.BaseSiteHandler {
  constructor() {
    super();
    /** @type {Map<HTMLElement, {observer: MutationObserver, video: HTMLMediaElement}>} */
    this.anchors = new Map();
  }

  /**
   * @param {string} [hostname]
   * @returns {boolean}
   */
  static matches(hostname = location.hostname) {
    return (
      hostname === 'instagram.com' ||
      hostname === 'www.instagram.com' ||
      hostname === 'm.instagram.com'
    );
  }

  /**
   * Instagram feed and story clips are frequently loop+muted without native
   * controls. They are real videos, not the GIF/sticker pattern the shared
   * filter is for.
   * @returns {boolean}
   */
  preserveMutedLoops() {
    return true;
  }

  /**
   * Comment and DM composers are often role=textbox without being a native
   * input. The video tap target is role=button and must still fall through
   * to shortcuts.
   * @param {EventTarget} target
   * @returns {boolean}
   */
  isTypingContext(target) {
    return !!target?.closest?.('[role="textbox"]');
  }

  /**
   * Place the controller in the player chrome that sits above the video.
   * @param {HTMLElement} parent
   * @param {HTMLMediaElement} video
   * @returns {{insertionPoint: HTMLElement, insertionMethod: string, targetParent: HTMLElement}}
   */
  getControllerPosition(parent, video) {
    const surface = this.findPlayerSurface(video);
    if (!surface) {
      return super.getControllerPosition(parent, video);
    }

    return {
      insertionPoint: surface,
      insertionMethod: 'append',
      targetParent: surface,
    };
  }

  /**
   * Keep the badge on the player surface when Instagram rebuilds that chrome.
   * Observes only the single-video card, and only moves the node when its
   * parent is wrong.
   * @param {HTMLElement} wrapper
   * @param {HTMLMediaElement} video
   */
  anchorController(wrapper, video) {
    this.releaseController(wrapper);

    const place = () => {
      if (!video.isConnected || !wrapper) {
        return;
      }
      const surface = this.findPlayerSurface(video);
      if (surface && wrapper.parentElement !== surface) {
        surface.appendChild(wrapper);
      }
    };

    place();

    const card = this.findAnchorRoot(video);
    if (!card) {
      return;
    }

    const observer = new MutationObserver(place);
    observer.observe(card, { childList: true, subtree: true });
    this.anchors.set(wrapper, { observer, video });
  }

  /**
   * @param {HTMLElement} wrapper
   */
  releaseController(wrapper) {
    const anchor = this.anchors.get(wrapper);
    if (!anchor) {
      return;
    }
    anchor.observer.disconnect();
    this.anchors.delete(wrapper);
  }

  /**
   * Walk up while the ancestor still contains only this video. Stop at the
   * closest ancestor that also contains the player chrome so an outer shell
   * with empty sibling cards cannot steal the badge.
   * @param {HTMLMediaElement} video
   * @returns {HTMLElement|null}
   */
  findAnchorRoot(video) {
    let fallback = null;
    for (const node of this.singleVideoAncestors(video)) {
      fallback = node;
      if (this.surfaceWithin(node, video)) {
        return node;
      }
    }
    return fallback;
  }

  /**
   * Player chrome for this video.
   *
   * English Instagram labels it "Video player". Other locales keep
   * role=group and data-visualcompletion=ignore on the same node. The
   * id-vpuid portal is the last resort when the inner group is absent.
   * @param {HTMLMediaElement} video
   * @returns {HTMLElement|null}
   */
  findPlayerSurface(video) {
    for (const node of this.singleVideoAncestors(video)) {
      const surface = this.surfaceWithin(node, video);
      if (surface) {
        return surface;
      }
    }
    return null;
  }

  /**
   * @param {HTMLMediaElement} video
   * @returns {Generator<HTMLElement>}
   * @private
   */
  *singleVideoAncestors(video) {
    let node = video?.parentElement || null;
    for (
      let depth = 0;
      depth < 16 && node && node !== document.body && node !== document.documentElement;
      depth += 1
    ) {
      const videos = node.querySelectorAll('video');
      if (videos.length !== 1 || !node.contains(video)) {
        break;
      }
      yield node;
      node = node.parentElement;
    }
  }

  /**
   * @param {HTMLElement} scope
   * @param {HTMLMediaElement} video
   * @returns {HTMLElement|null}
   * @private
   */
  surfaceWithin(scope, video) {
    if (scope.getAttribute('aria-label') === 'Video player' || this.isPlayerGroup(scope)) {
      return scope;
    }

    const groups = Array.from(
      scope.querySelectorAll(
        '[aria-label="Video player"], [role="group"][data-visualcompletion="ignore"]'
      )
    ).filter((group) => {
      const owned = group.querySelector('video');
      return !owned || owned === video;
    });
    if (groups.length > 0) {
      return groups[groups.length - 1];
    }

    return (
      Array.from(scope.querySelectorAll('[data-instancekey^="id-vpuid-"]')).find(
        (node) => !node.contains(video)
      ) || null
    );
  }

  /**
   * @param {HTMLElement} node
   * @returns {boolean}
   * @private
   */
  isPlayerGroup(node) {
    return (
      node.getAttribute('role') === 'group' &&
      node.getAttribute('data-visualcompletion') === 'ignore'
    );
  }

  /**
   * @override
   */
  cleanup() {
    for (const anchor of this.anchors.values()) {
      anchor.observer.disconnect();
    }
    this.anchors.clear();
    super.cleanup();
  }
}

window.VSC.InstagramHandler = InstagramHandler;
