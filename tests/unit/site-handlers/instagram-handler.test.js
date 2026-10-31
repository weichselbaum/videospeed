/**
 * Instagram player chrome, GIF-filter opt-out, and comment/DM typing.
 * The fixture is a reduced logged-out Reels capture (see the HTML file).
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  installChromeMock,
  cleanupChromeMock,
  resetMockStorage,
} from '../../helpers/chrome-mock.js';
import { createMockVideo } from '../../helpers/test-utils.js';

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/instagram/reel-player.html'
);

function mountFixture() {
  const host = document.createElement('div');
  host.innerHTML = readFileSync(fixturePath, 'utf8');
  document.body.appendChild(host);
  return host;
}

function videoIn(card) {
  const video = createMockVideo({ playbackRate: 1, readyState: 1, muted: true });
  video.controls = false;
  card.querySelector('[data-video-slot]').appendChild(video);
  return video;
}

describe('InstagramHandler', () => {
  beforeEach(() => {
    installChromeMock();
    resetMockStorage();
    vi.stubGlobal('location', {
      hostname: 'www.instagram.com',
      href: 'https://www.instagram.com/reels/DfGCxoWSRWQ/',
      pathname: '/reels/DfGCxoWSRWQ/',
    });
    window.VSC.siteHandlerManager.refresh();
    window.VSC.stateManager?.controllers.clear();
  });

  afterEach(() => {
    window.VSC.siteHandlerManager.cleanup();
    document.body.replaceChildren();
    vi.unstubAllGlobals();
    window.VSC.siteHandlerManager.refresh();
    cleanupChromeMock();
  });

  it('matches instagram hosts and ignores other sites', () => {
    expect(window.VSC.InstagramHandler.matches('www.instagram.com')).toBe(true);
    expect(window.VSC.InstagramHandler.matches('instagram.com')).toBe(true);
    expect(window.VSC.InstagramHandler.matches('m.instagram.com')).toBe(true);
    expect(window.VSC.InstagramHandler.matches('www.youtube.com')).toBe(false);
    expect(window.VSC.InstagramHandler.matches('www.facebook.com')).toBe(false);
  });

  it('appends the controller to the Video player surface, not the video parent', () => {
    const root = mountFixture();
    const card = root.querySelector('#reel-labeled');
    const video = videoIn(card);
    const handler = window.VSC.siteHandlerManager.getCurrentHandler();

    expect(handler).toBeInstanceOf(window.VSC.InstagramHandler);

    const position = handler.getControllerPosition(video.parentElement, video);
    const surface = card.querySelector('[aria-label="Video player"]');

    expect(position.insertionPoint).toBe(surface);
    expect(position.targetParent).toBe(surface);
    expect(position.insertionMethod).toBe('append');
    expect(surface.contains(video)).toBe(false);
    expect(surface.querySelector('[data-tap-target]')).not.toBeNull();
  });

  it('uses the locale-independent player group and the vpuid portal', () => {
    const root = mountFixture();
    const handler = new window.VSC.InstagramHandler();

    const localeVideo = videoIn(root.querySelector('#reel-locale'));
    const portalVideo = videoIn(root.querySelector('#reel-portal'));

    expect(
      handler.getControllerPosition(localeVideo.parentElement, localeVideo).insertionPoint
    ).toBe(root.querySelector('[data-locale-player]'));
    expect(
      handler.getControllerPosition(portalVideo.parentElement, portalVideo).insertionPoint
    ).toBe(root.querySelector('[data-instancekey="id-vpuid-fixture-portal"]'));
  });

  it('does not attach a reel to another reel’s player', () => {
    const root = mountFixture();
    const handler = new window.VSC.InstagramHandler();
    const first = videoIn(root.querySelector('#reel-labeled'));
    const second = videoIn(root.querySelector('#reel-locale'));

    const firstSurface = handler.findPlayerSurface(first);
    const secondSurface = handler.findPlayerSurface(second);

    expect(firstSurface).not.toBe(secondSurface);
    expect(firstSurface.closest('#reel-labeled')).not.toBeNull();
    expect(secondSurface.closest('#reel-locale')).not.toBeNull();
  });

  it('re-appends the badge when the player chrome drops it', async () => {
    const root = mountFixture();
    const card = root.querySelector('#reel-labeled');
    const video = videoIn(card);
    const handler = new window.VSC.InstagramHandler();
    const wrapper = document.createElement('vsc-controller');
    card.querySelector('[data-video-slot]').appendChild(wrapper);

    handler.anchorController(wrapper, video);

    const surface = card.querySelector('[aria-label="Video player"]');
    expect(wrapper.parentElement).toBe(surface);

    wrapper.remove();
    card.appendChild(document.createElement('span'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapper.parentElement).toBe(surface);
    expect(surface.querySelector('[data-tap-target]')).not.toBeNull();

    handler.releaseController(wrapper);
    wrapper.remove();
    card.appendChild(document.createElement('i'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper.isConnected).toBe(false);
    handler.cleanup();
  });

  it('keeps muted looping videos on Instagram and still filters them elsewhere', () => {
    const video = document.createElement('video');
    video.loop = true;
    video.muted = true;
    video.controls = false;

    const manager = window.VSC.siteHandlerManager;
    expect(manager.getCurrentHandler()).toBeInstanceOf(window.VSC.InstagramHandler);
    expect(manager.shouldIgnoreVideo(video)).toBe(false);

    vi.stubGlobal('location', {
      hostname: 'www.example.com',
      href: 'https://www.example.com/watch',
      pathname: '/watch',
    });
    manager.refresh();

    expect(manager.getCurrentHandler()).toBeInstanceOf(window.VSC.BaseSiteHandler);
    expect(manager.shouldIgnoreVideo(video)).toBe(true);

    video.loop = false;
    expect(manager.shouldIgnoreVideo(video)).toBe(false);
  });

  it('treats comment and DM fields as typing, and not the video tap target', async () => {
    const root = mountFixture();
    const config = window.VSC.videoSpeedConfig;
    await config.load();
    const events = new window.VSC.EventManager(config, null);

    expect(events.isTypingContext(root.querySelector('#dm-composer'))).toBe(true);
    expect(events.isTypingContext(root.querySelector('#comment-box'))).toBe(true);

    const inner = document.createElement('span');
    root.querySelector('#dm-composer').appendChild(inner);
    expect(events.isTypingContext(inner)).toBe(true);

    expect(events.isTypingContext(root.querySelector('#comment-button'))).toBe(false);
    expect(events.isTypingContext(root.querySelector('[data-tap-target]'))).toBe(false);

    vi.stubGlobal('location', {
      hostname: 'www.example.com',
      href: 'https://www.example.com/',
      pathname: '/',
    });
    window.VSC.siteHandlerManager.refresh();
    const generic = new window.VSC.EventManager(config, null);
    expect(generic.isTypingContext(root.querySelector('#dm-composer'))).toBe(false);
    expect(generic.isTypingContext(root.querySelector('#comment-box'))).toBe(true);
  });

  it('places a new video’s controller in the player and applies the session speed', async () => {
    const root = mountFixture();
    const card = root.querySelector('#reel-labeled');
    const video = videoIn(card);

    const config = window.VSC.videoSpeedConfig;
    await config.load();
    config.settings.rememberSpeed = true;
    config.settings.lastSpeed = 1.7;

    const eventManager = new window.VSC.EventManager(config, null);
    const actionHandler = new window.VSC.ActionHandler(config, eventManager);
    eventManager.actionHandler = actionHandler;

    const controller = new window.VSC.VideoController(
      video,
      video.parentElement,
      config,
      actionHandler
    );

    const surface = card.querySelector('[aria-label="Video player"]');
    expect(video.playbackRate).toBe(1.7);
    expect(controller.div.parentElement).toBe(surface);
    expect(surface.querySelector('[data-tap-target]')).not.toBeNull();
    expect(controller.div.compareDocumentPosition(surface.querySelector('[data-tap-target]'))).toBe(
      Node.DOCUMENT_POSITION_PRECEDING
    );

    controller.remove();
    expect(controller.div.isConnected).toBe(false);
  });
});
