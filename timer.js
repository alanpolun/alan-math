// timer.js — floating elapsed-time pill for the alan-math-2 practice pages.
// Imported from auth.js (which every page loads), so a page only needs auth.js to get it.
//
// Rules:
//   * only on practice pages (mathN.html) — never on login/register/log/parent/admin
//   * skipped when the page already shows its own timer (math1..6, math16)
//   * counts from page load; FREEZES when the student submits; restarts on a new practice
//   * API for pages that want to drive it explicitly:
//         window.floatingTimer.stop()   /  .start()  /  .reset()  /  .seconds()
//   * fallback: clicks on submit / new-practice buttons are detected by their label,
//     so pages with custom handlers still behave correctly without being edited.
(function () {
    var m = location.pathname.match(/math\d+\.html$/i);
    if (!m) return;
    if (document.body && document.body.dataset && document.body.dataset.noFloatingTimer === '1') return;

    function pageHasOwnTimer() {
        var els = document.querySelectorAll('[id], [class]');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (el.id && el.id.indexOf('floating-timer') === 0) continue;
            if (el.closest && el.closest('#floating-timer')) continue;
            var tag = (el.id + ' ' + (typeof el.className === 'string' ? el.className : '')).toLowerCase();
            if (tag.indexOf('timer') !== -1 || tag.indexOf('countdown') !== -1) return true;
        }
        return false;
    }

    // ---- state ---------------------------------------------------------------
    var running = false;
    var startedAt = 0;        // ms timestamp of the current run
    var bankedMs = 0;         // ms accumulated before the last stop
    var iv = null;

    function elapsedMs() {
        return bankedMs + (running ? (Date.now() - startedAt) : 0);
    }
    function fmt(sec) {
        var h = Math.floor(sec / 3600), m2 = Math.floor((sec % 3600) / 60), s = sec % 60;
        var mm = (m2 < 10 ? '0' : '') + m2, ss = (s < 10 ? '0' : '') + s;
        return h > 0 ? h + ':' + mm + ':' + ss : mm + ':' + ss;
    }

    var pill = null, text = null;

    function paint() {
        if (!text) return;
        var sec = Math.round(elapsedMs() / 1000);
        text.textContent = (running ? '' : '⏸ ') + fmt(sec);
        pill.style.background = running ? 'rgba(255,255,255,.95)' : 'rgba(243,244,246,.95)';
        pill.style.color = running ? '#4338ca' : '#6b7280';
        pill.style.borderColor = running ? (sec >= 600 ? '#fca5a5' : '#c7d2fe') : '#d1d5db';
    }

    function tick() { paint(); }

    var api = {
        start: function () {
            if (running) return;
            running = true;
            startedAt = Date.now();
            if (iv) clearInterval(iv);
            iv = setInterval(tick, 1000);
            paint();
        },
        stop: function () {
            if (!running) { paint(); return; }
            bankedMs = elapsedMs();
            running = false;
            if (iv) { clearInterval(iv); iv = null; }
            paint();
        },
        reset: function () {
            bankedMs = 0;
            running = false;
            if (iv) { clearInterval(iv); iv = null; }
            paint();
            api.start();
        },
        seconds: function () { return Math.round(elapsedMs() / 1000); },
        isRunning: function () { return running; }
    };
    window.floatingTimer = api;
    // legacy helper kept for pages that already read it
    window.getElapsedSeconds = api.seconds;

    function mount() {
        if (pageHasOwnTimer()) return;            // respect an existing timer
        if (document.getElementById('floating-timer')) return;

        pill = document.createElement('div');
        pill.id = 'floating-timer';
        pill.title = '本次練習已用時間（提交後會停）';
        pill.style.cssText = [
            'position:fixed', 'top:8px', 'left:50%', 'transform:translateX(-50%)',
            'z-index:9997', 'display:flex', 'align-items:center', 'gap:6px',
            'background:rgba(255,255,255,.95)', 'border:2px solid #c7d2fe',
            'border-radius:999px', 'padding:5px 16px', 'font-weight:800',
            'font-size:15px', 'color:#4338ca', 'box-shadow:0 2px 10px rgba(0,0,0,.15)',
            'font-variant-numeric:tabular-nums', 'pointer-events:none',
            'transition:background .2s,color .2s,border-color .2s',
            "font-family:-apple-system,'PingFang HK','Microsoft JhengHei',sans-serif"
        ].join(';');
        pill.innerHTML = '<span aria-hidden="true">⏱</span><span id="floating-timer-text">00:00</span>';
        document.body.appendChild(pill);
        text = document.getElementById('floating-timer-text');

        api.start();

        // some pages build their own timer a moment later (math14) — step aside if so
        [1500, 4000].forEach(function (delay) {
            setTimeout(function () {
                if (pageHasOwnTimer()) {
                    if (iv) { clearInterval(iv); iv = null; }
                    running = false;
                    if (pill && pill.parentNode) pill.parentNode.removeChild(pill);
                }
            }, delay);
        });
    }

    // ---- auto stop / restart on the page's own buttons -----------------------
    var STOP_RE = /提交|交卷|對答案|对答案|檢查答案|检查答案|查看答案|完成|submit/i;
    var START_RE = /新練習|新练习|再來|再来|重新|換一批|换一批|生成新|新的題目|新的题目|開始|开始|start/i;

    document.addEventListener('click', function (e) {
        var btn = e.target && e.target.closest ? e.target.closest('button, a, input[type=button], input[type=submit]') : null;
        if (!btn) return;
        var label = ((btn.textContent || '') + ' ' + (btn.value || '')).trim();
        if (STOP_RE.test(label)) { api.stop(); return; }
        if (START_RE.test(label)) { api.reset(); }
    }, true);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
