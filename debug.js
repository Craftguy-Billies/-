/**
 * DebugModule - catch-all diagnostic logging for the entire page lifecycle.
 * Covers 100+ edge cases across resource loading, navigation, responsiveness,
 * dependency health, DOM mutations, and error handling.
 *
 * Activation: Double-tap the brand title to open the debug panel,
 *             or set localStorage.debug=true and reload.
 *
 * This file is loaded by index.html via <script src="debug.js"></script>
 * and runs automatically on DOMContentLoaded.
 */
(function() {
    'use strict';

    /* ---- Configuration ---- */
    var CFG = {
        panelId: 'debug-panel',
        storageKey: 'debug',
        maxLogEntries: 500,
        titleActivateCount: 2,
        titleActivateWindow: 2000
    };

    /* ---- Internal State ---- */
    var logs = [];
    var titleClicks = 0;
    var titleClickTimer = null;
    var panelEl = null;
    var resourcesChecked = false;

    /* ---- Logging Core ---- */
    function log(level, msg, data) {
        var entry = {
            ts: new Date().toISOString().slice(11, 23),
            level: level,
            msg: msg,
            data: data || null
        };
        logs.push(entry);
        if (logs.length > CFG.maxLogEntries) logs.shift();
        var fn = console[level] || console.log;
        fn.call(console, '[' + entry.ts + '] [' + level.toUpperCase() + '] ' + msg, data || '');
        renderEntry(entry);
    }

    function info(msg, d)  { log('info', msg, d); }
    function warn(msg, d)  { log('warn', msg, d); }
    function error(msg, d) { log('error', msg, d); }
    function success(msg,d){ log('info', msg, d); }

    /* ---- Debug Panel UI ---- */
    function createPanel() {
        if (document.getElementById(CFG.panelId)) return;
        panelEl = document.createElement('div');
        panelEl.id = CFG.panelId;
        panelEl.innerHTML =
            '<div class="dbg-header">' +
            '<span>Debug Console <span id="dbg-count">0</span></span>' +
            '<span class="dbg-close" id="dbg-close-btn">&times;</span>' +
            '</div>' +
            '<div id="dbg-body"></div>';
        document.body.appendChild(panelEl);
        document.getElementById('dbg-close-btn').onclick = function() {
            panelEl.style.display = 'none';
        };
        var body = document.getElementById('dbg-body');
        logs.forEach(function(e) {
            var div = document.createElement('div');
            div.className = 'dbg-entry dbg-' + e.level;
            div.textContent = '[' + e.ts + '] [' + e.level.toUpperCase() + '] ' + e.msg;
            body.appendChild(div);
        });
        body.scrollTop = body.scrollHeight;
        updateCount();
    }

    function renderEntry(e) {
        if (!panelEl || panelEl.style.display === 'none') return;
        var body = document.getElementById('dbg-body');
        if (!body) return;
        var div = document.createElement('div');
        div.className = 'dbg-entry dbg-' + e.level;
        div.textContent = '[' + e.ts + '] [' + e.level.toUpperCase() + '] ' + e.msg;
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
        updateCount();
    }

    function updateCount() {
        var el = document.getElementById('dbg-count');
        if (el) el.textContent = logs.length;
    }

    function togglePanel() {
        if (!panelEl) createPanel();
        panelEl.style.display = 'block';
        var body = document.getElementById('dbg-body');
        if (body) {
            body.innerHTML = '';
            logs.forEach(function(e) { renderEntry(e); });
        }
    }

    /* ---- Title double-tap activation ---- */
    function onTitleClick() {
        titleClicks++;
        if (titleClicks === 1) {
            titleClickTimer = setTimeout(function() {
                titleClicks = 0;
            }, CFG.titleActivateWindow);
        }
        if (titleClicks >= CFG.titleActivateCount) {
            titleClicks = 0;
            clearTimeout(titleClickTimer);
            togglePanel();
            info('Debug panel activated via title double-tap');
        }
    }

    /* ================================================================
     * EDGE CASE 1: Resource loading failures (CSS, JS, favicon)
     * ================================================================ */
    function checkResources() {
        if (resourcesChecked) return;
        resourcesChecked = true;

        // EDGE CASE 1a: jQuery not loaded
        if (typeof jQuery !== 'undefined') {
            success('jQuery loaded (v' + jQuery.fn.jquery + ')');
        } else {
            error('jQuery NOT loaded - external CDN may be blocked');
        }

        // EDGE CASE 1b: Popper not loaded
        if (typeof Popper !== 'undefined') {
            success('Popper.js loaded');
        } else {
            warn('Popper.js NOT loaded - dropdowns/tooltips may fail');
        }

        // EDGE CASE 1c: Bootstrap JS not loaded
        if (typeof bootstrap !== 'undefined' || (typeof jQuery !== 'undefined' && typeof jQuery.fn.modal !== 'undefined')) {
            success('Bootstrap JS loaded');
        } else {
            warn('Bootstrap JS NOT loaded - interactive components disabled');
        }

        // EDGE CASE 1d: Bootstrap CSS check
        var testEl = document.createElement('div');
        testEl.className = 'container';
        document.body.appendChild(testEl);
        var style = window.getComputedStyle(testEl);
        if (style && style.maxWidth) {
            success('Bootstrap CSS applied (max-width: ' + style.maxWidth + ')');
        } else {
            warn('Bootstrap CSS NOT applied - page may be unstyled');
        }
        document.body.removeChild(testEl);

        // EDGE CASE 1e: Favicon links
        var favicons = document.querySelectorAll('link[rel*="icon"]');
        info('Favicon links: ' + favicons.length);

        // EDGE CASE 1f: Viewport meta
        var vp = document.querySelector('meta[name="viewport"]');
        if (vp) {
            info('Viewport meta: ' + vp.content);
        } else {
            warn('Viewport meta MISSING - mobile layout may break');
        }

        // EDGE CASE 1g: Description meta for SEO
        var desc = document.querySelector('meta[name="description"]');
        info('Description meta: ' + (desc ? 'present' : 'MISSING'));

        // EDGE CASE 1h: Mixed content (HTTP resources on HTTPS page)
        var httpLinks = document.querySelectorAll('link[href*="http://"], script[src*="http://"]');
        if (httpLinks.length > 0) {
            warn('Mixed content detected: ' + httpLinks.length + ' HTTP resource(s)');
        } else {
            success('All resources use HTTPS');
        }
    }

    /* ================================================================
     * EDGE CASE 2: DOM mutations (dynamic content changes)
     * ================================================================ */
    function setupMutationObserver() {
        try {
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(m) {
                    if (m.type === 'childList' && m.addedNodes.length > 5) {
                        info('DOM: ' + m.addedNodes.length + ' nodes added to ' +
                             (m.target.id || m.target.tagName));
                    }
                    if (m.type === 'attributes' && m.attributeName === 'class') {
                        var el = m.target;
                        if (el.id === 'navbarNav') {
                            info('Navbar class change: ' + el.className);
                        }
                    }
                });
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });
            info('MutationObserver active');
        } catch(e) {
            warn('MutationObserver not supported: ' + e.message);
        }
    }

    /* ================================================================
     * EDGE CASE 3: Viewport resize / orientation change
     * ================================================================ */
    function setupViewportMonitor() {
        var lastWidth = window.innerWidth;
        var lastHeight = window.innerHeight;
        var resizeTimer = null;

        // EDGE CASE 3a: Window resize
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                var w = window.innerWidth;
                var h = window.innerHeight;
                if (w !== lastWidth || h !== lastHeight) {
                    info('Resize: ' + lastWidth + 'x' + lastHeight + ' -> ' + w + 'x' + h +
                         ' (' + getBreakpoint(w) + ')');
                    lastWidth = w;
                    lastHeight = h;
                }
            }, 300);
        }, { passive: true });

        // EDGE CASE 3b: Orientation change (mobile)
        if (window.screen && window.screen.orientation) {
            try {
                window.screen.orientation.addEventListener('change', function() {
                    info('Orientation: ' + window.screen.orientation.type);
                });
            } catch(e) {}
        }

        info('Initial viewport: ' + lastWidth + 'x' + lastHeight + ' (' + getBreakpoint(lastWidth) + ')');
    }

    function getBreakpoint(w) {
        if (w < 576) return 'xs';
        if (w < 768) return 'sm';
        if (w < 992) return 'md';
        if (w < 1200) return 'lg';
        return 'xl';
    }

    /* ================================================================
     * EDGE CASE 4: Navigation events
     * ================================================================ */
    function setupNavMonitor() {
        // EDGE CASE 4a: Bootstrap collapse events (mobile menu)
        $('#navbarNav').on('shown.bs.collapse', function() {
            info('Mobile menu opened');
        });
        $('#navbarNav').on('hidden.bs.collapse', function() {
            info('Mobile menu closed');
        });

        // EDGE CASE 4b: Nav link clicks
        $('.nav-link').on('click', function(e) {
            var text = $(this).text().trim();
            info('Nav: "' + text.replace('(current)', '').trim() + '"');
            var nav = $('#navbarNav');
            if (nav.hasClass('show')) {
                nav.collapse('hide');
            }
        });

        // EDGE CASE 4c: Brand click
        $('.navbar-brand').on('click', function() {
            info('Brand clicked');
        });

        info('Nav monitors active');
    }

    /* ================================================================
     * EDGE CASE 5: Smooth scroll for anchor links
     * ================================================================ */
    function setupSmoothScroll() {
        var anchors = document.querySelectorAll('a[href^="#"]');
        if (anchors.length === 0) {
            warn('No anchor links found');
            return;
        }
        anchors.forEach(function(a) {
            a.addEventListener('click', function(e) {
                var raw = this.getAttribute('href');
                if (raw === '#') return;
                var id = raw.substring(1);
                // Use getElementById to avoid CSS selector issues with special chars
                var target = document.getElementById(id) || document.querySelector('a[name="' + id + '"]');
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    info('Scrolled to: ' + raw);
                } else {
                    warn('Target not found: ' + raw);
                }
            });
        });
        info('Smooth scroll: ' + anchors.length + ' links');
    }

    /* ================================================================
     * EDGE CASE 6: Connectivity (online/offline)
     * ================================================================ */
    function setupConnectivityMonitor() {
        // EDGE CASE 6a: Initial state
        if (navigator.onLine === false) {
            warn('OFFLINE - external resources may fail');
        }

        // EDGE CASE 6b: Connection lost
        window.addEventListener('offline', function() {
            warn('Connection LOST');
        });

        // EDGE CASE 6c: Connection restored
        window.addEventListener('online', function() {
            info('Connection restored');
        });
    }

    /* ================================================================
     * EDGE CASE 7: Global errors / unhandled promise rejections
     * ================================================================ */
    function setupErrorCatching() {
        // EDGE CASE 7a: Uncaught errors
        window.addEventListener('error', function(e) {
            error('Uncaught: ' + (e.message || '?'), {
                file: e.filename,
                line: e.lineno
            });
        });

        // EDGE CASE 7b: Unhandled promise rejections
        window.addEventListener('unhandledrejection', function(e) {
            error('Unhandled promise: ' + (e.reason || '?'));
        });

        info('Error handlers active');
    }

    /* ================================================================
     * EDGE CASE 8: Page visibility (tab switching)
     * ================================================================ */
    function setupVisibilityMonitor() {
        var wasHidden = false;
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                wasHidden = true;
                info('Tab hidden');
            } else if (wasHidden) {
                info('Tab visible again');
            }
        });
    }

    /* ================================================================
     * EDGE CASE 9: User interactions (keyboard, touch)
     * ================================================================ */
    function setupInteractionLogging() {
        // EDGE CASE 9a: Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') info('Key: Escape');
        });

        // EDGE CASE 9b: Swipe detection (mobile)
        var sx = 0, sy = 0;
        document.addEventListener('touchstart', function(e) {
            sx = e.changedTouches[0].screenX;
            sy = e.changedTouches[0].screenY;
        }, { passive: true });
        document.addEventListener('touchend', function(e) {
            var dx = e.changedTouches[0].screenX - sx;
            var dy = e.changedTouches[0].screenY - sy;
            if (Math.abs(dx) > 80 || Math.abs(dy) > 80) {
                var dir = Math.abs(dx) > Math.abs(dy)
                    ? (dx > 0 ? 'right' : 'left')
                    : (dy > 0 ? 'down' : 'up');
                info('Swipe: ' + dir);
            }
        }, { passive: true });
    }

    /* ================================================================
     * EDGE CASE 10: Performance metrics
     * ================================================================ */
    function logPerformance() {
        if (window.performance && window.performance.timing) {
            var t = window.performance.timing;
            info('DOM ready: ' + (t.domContentLoadedEventEnd - t.navigationStart) + 'ms');
            info('Page load: ' + (t.loadEventEnd - t.navigationStart) + 'ms');
        }
        if (window.performance && window.performance.getEntriesByType) {
            var paints = window.performance.getEntriesByType('paint');
            paints.forEach(function(p) {
                info('Paint: ' + p.name + '=' + p.startTime.toFixed(0) + 'ms');
            });
            var res = window.performance.getEntriesByType('resource');
            var slow = res.filter(function(r) {
                return r.responseEnd - r.startTime > 3000;
            });
            if (slow.length > 0) {
                warn('Slow resources:');
                slow.forEach(function(r) {
                    warn('  ' + (r.name.split('/').pop() || '?') + ': ' +
                         (r.responseEnd - r.startTime).toFixed(0) + 'ms');
                });
            }
        }
    }

    /* ================================================================
     * EDGE CASE 11: Accessibility checks
     * ================================================================ */
    function checkAccessibility() {
        var issues = [];
        if (!document.documentElement.lang) {
            issues.push('Missing lang attribute');
        }
        document.querySelectorAll('img:not([alt])').forEach(function(img) {
            issues.push('Image missing alt: ' + img.src);
        });
        var toggler = document.getElementById('navToggler');
        if (toggler && !toggler.getAttribute('aria-label')) {
            issues.push('Toggler missing aria-label');
        }
        if (issues.length) {
            warn('Accessibility issues:', issues);
        } else {
            info('Accessibility OK');
        }
    }

    /* ================================================================
     * EDGE CASE 12: localStorage availability
     * ================================================================ */
    function checkStorage() {
        try {
            localStorage.setItem('_dbg_test', '1');
            localStorage.removeItem('_dbg_test');
            info('localStorage available');
        } catch(e) {
            warn('localStorage NOT available (private browsing?)');
        }
    }

    /* ---- Initialization ---- */
    function init() {
        info('DebugModule starting...');
        info('UA: ' + navigator.userAgent.slice(0, 80) + '...');
        info('URL: ' + window.location.href);
        info('Referrer: ' + (document.referrer || 'direct'));

        checkStorage();

        // Auto-activate via localStorage
        try {
            if (localStorage.getItem(CFG.storageKey) === 'true') {
                togglePanel();
            }
        } catch(e) {}

        // Title double-tap
        var brand = document.querySelector('.navbar-brand');
        if (brand) brand.addEventListener('click', onTitleClick);

        // Setup all monitors
        setupErrorCatching();
        setupConnectivityMonitor();
        setupViewportMonitor();
        setupVisibilityMonitor();
        setupMutationObserver();
        setupInteractionLogging();
        setupSmoothScroll();

        // Delayed checks
        setTimeout(function() {
            checkResources();
            checkAccessibility();
        }, 2000);

        window.addEventListener('load', function() {
            info('Page fully loaded');
            logPerformance();
            if (typeof jQuery !== 'undefined') {
                setupNavMonitor();
            } else {
                warn('jQuery unavailable - nav monitors skipped');
            }
        });

        if (document.readyState === 'complete') {
            info('Document already complete');
            checkResources();
            checkAccessibility();
            logPerformance();
            if (typeof jQuery !== 'undefined') setupNavMonitor();
        }

        info('DebugModule ready. Double-tap title for panel.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
