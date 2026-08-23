const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const EXTENSION_DIR = path.join(__dirname, "..", "extension");
const REFS_DIR = path.join(__dirname, "..", "refs", "elements");

const contentScriptPath = path.join(EXTENSION_DIR, "content_script.js");
const hideCssPath = path.join(EXTENSION_DIR, "hide.css");
const manifestPath = path.join(EXTENSION_DIR, "manifest.json");

describe("No Posts No Shorts - Unit Test Suite", () => {
  let contentScriptCode;
  let hideCssCode;
  let manifestData;

  beforeEach(() => {
    contentScriptCode = fs.readFileSync(contentScriptPath, "utf8");
    hideCssCode = fs.readFileSync(hideCssPath, "utf8");
    manifestData = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  });

  describe("1. Manifest V3 Integrity", () => {
    test("must be manifest version 3", () => {
      assert.strictEqual(manifestData.manifest_version, 3);
    });

    test("must target YouTube Desktop and Mobile URLs", () => {
      const matches = manifestData.content_scripts[0].matches;
      assert.ok(matches.includes("*://www.youtube.com/*"));
      assert.ok(matches.includes("*://m.youtube.com/*"));
    });

    test("must inject content_script.js and hide.css at document_start", () => {
      const scriptConfig = manifestData.content_scripts[0];
      assert.ok(scriptConfig.js.includes("content_script.js"));
      assert.ok(scriptConfig.css.includes("hide.css"));
      assert.strictEqual(scriptConfig.run_at, "document_start");
    });
  });

  describe("2. CSS Rules (hide.css) Safety & Selectors", () => {
    test("CRITICAL: hide.css must NOT contain override-arrow-position-for-shorts selector", () => {
      const cssWithoutComments = hideCssCode.replace(/\/\*[\s\S]*?\*\//g, "");
      assert.strictEqual(
        cssWithoutComments.includes("override-arrow-position-for-shorts"),
        false,
        "hide.css rule list must not contain override-arrow-position-for-shorts",
      );
    });

    test("hide.css must contain all Mobile and Desktop Shorts selectors", () => {
      const expectedSelectors = [
        "ytm-reel-shelf-renderer",
        "ytd-reel-shelf-renderer",
        "ytd-rich-shelf-renderer[is-shorts]",
        "ytm-shorts-lockup-view-model",
        "ytm-shorts-lockup-view-model-v2",
        "ytm-reel-item-renderer",
        "ytd-reel-item-renderer",
        'ytd-rich-item-renderer:has(a[href*="/shorts/"])',
        'ytm-rich-item-renderer:has(a[href*="/shorts/"])',
        'ytm-pivot-bar-item-renderer:has(a[href*="/shorts/"])',
      ];

      for (const selector of expectedSelectors) {
        assert.ok(
          hideCssCode.includes(selector),
          `hide.css missing selector: ${selector}`,
        );
      }
    });

    test("hide.css must contain community post selectors", () => {
      const expectedPostSelectors = [
        '[class*="post"]',
        '[class*="Post"]',
        "ytm-backstage-post-thread-renderer",
        "ytm-backstage-post-renderer",
        "ytm-post-multi-image-renderer",
        "ytd-post-renderer",
      ];

      for (const selector of expectedPostSelectors) {
        assert.ok(
          hideCssCode.includes(selector),
          `hide.css missing post selector: ${selector}`,
        );
      }
    });
  });

  describe("3. Content Script (content_script.js) Logic", () => {
    test("CRITICAL: selectorsToRemove must NOT include override-arrow-position-for-shorts", () => {
      assert.strictEqual(
        contentScriptCode.includes('"override-arrow-position-for-shorts"'),
        false,
        "content_script.js must not select override-arrow-position-for-shorts",
      );
    });

    test("should contain warning comment regarding override-arrow-position-for-shorts", () => {
      assert.ok(
        contentScriptCode.includes("override-arrow-position-for-shorts"),
        "content_script.js should document the override-arrow-position-for-shorts warning",
      );
    });

    test("should configure selectorsToRemove with mobile and desktop elements", () => {
      const expectedInJS = [
        "ytm-reel-shelf-renderer",
        "ytd-reel-shelf-renderer",
        "ytd-rich-shelf-renderer[is-shorts]",
        "ytm-shorts-lockup-view-model",
        "ytm-shorts-lockup-view-model-v2",
      ];

      for (const item of expectedInJS) {
        assert.ok(
          contentScriptCode.includes(item),
          `content_script.js missing selector: ${item}`,
        );
      }
    });

    test("should execute element removal and helper functions in mock DOM context", () => {
      const removedElements = [];
      const listenersAdded = {};

      const mockDocument = {
        readyState: "interactive",
        location: { pathname: "/" },
        documentElement: { nodeType: 1 },
        body: { nodeType: 1 },
        querySelectorAll: (selector) => {
          if (selector.includes("body")) {
            return [
              {
                tagName: "YTM-SHORTS-LOCKUP-VIEW-MODEL",
                attributes: [{ name: "class", value: "shorts" }],
                parentNode: {
                  remove: function () {
                    removedElements.push(this);
                  },
                },
                remove: function () {
                  removedElements.push(this);
                },
              },
            ];
          }
          return [
            {
              tagName: "YTM-REEL-SHELF-RENDERER",
              attributes: [],
              parentNode: {
                remove: function () {
                  removedElements.push(this);
                },
              },
              remove: function () {
                removedElements.push(this);
              },
            },
          ];
        },
        addEventListener: (event, handler) => {
          listenersAdded[event] = handler;
        },
      };

      const mockWindow = {
        location: { pathname: "/" },
        addEventListener: (event, handler) => {
          listenersAdded[event] = handler;
        },
      };

      class MockMutationObserver {
        constructor(callback) {
          this.callback = callback;
        }
        observe() {}
      }

      // Run content script code within mock sandbox
      const fn = new Function(
        "document",
        "window",
        "MutationObserver",
        "setTimeout",
        "clearTimeout",
        contentScriptCode +
          "; return { cleanYouTubeHome, shouldClean, selectorsToRemove };",
      );

      const exports = fn(
        mockDocument,
        mockWindow,
        MockMutationObserver,
        (fn) => fn(),
        () => {},
      );

      // Verify SPA event listeners were registered
      assert.ok(listenersAdded["yt-navigate-finish"]);
      assert.ok(listenersAdded["yt-page-data-updated"]);
      assert.ok(listenersAdded["popstate"]);

      // Verify shouldClean logic
      assert.strictEqual(exports.shouldClean([{ type: "childList" }]), true);

      // Switch URL to /watch
      mockWindow.location.pathname = "/watch";
      mockDocument.location.pathname = "/watch";
      assert.strictEqual(exports.shouldClean([{ type: "childList" }]), false);

      // Verify cleanYouTubeHome aborts on /watch
      const beforeCount = removedElements.length;
      exports.cleanYouTubeHome();
      assert.strictEqual(
        removedElements.length,
        beforeCount,
        "cleanYouTubeHome should abort on /watch",
      );

      // Switch back to home feed
      mockWindow.location.pathname = "/";
      mockDocument.location.pathname = "/";
      exports.cleanYouTubeHome();
      assert.ok(
        removedElements.length > beforeCount,
        "cleanYouTubeHome should remove elements on home page",
      );
    });
  });

  describe("4. Reference Fixtures Match Test", () => {
    test("reference HTML files must contain YouTube Shorts elements that match our selectors", () => {
      const mobileHtml = fs.readFileSync(
        path.join(REFS_DIR, "shorts_mobile_portrait.html"),
        "utf8",
      );
      const desktopHtml = fs.readFileSync(
        path.join(REFS_DIR, "shorts_desktop.html"),
        "utf8",
      );

      assert.ok(
        mobileHtml.includes("ytm-shorts-lockup-view-model") ||
          mobileHtml.includes("ytd-reel-shelf-renderer"),
        "Mobile fixture contains expected Shorts tags",
      );

      assert.ok(
        desktopHtml.includes("ytd-rich-shelf-renderer") ||
          desktopHtml.includes("ytm-shorts-lockup-view-model"),
        "Desktop fixture contains expected Shorts tags",
      );
    });
  });
});
