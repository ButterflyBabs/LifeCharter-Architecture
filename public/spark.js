/* LC Spark chat widget — LifeCharter Command Suite.
   <script src="https://lccommandsuite.com/spark.js" data-key="YOUR_PUBLIC_KEY" defer></script> */
(function () {
  "use strict";
  var me = document.currentScript;
  if (!me || window.__lcSpark) return;
  window.__lcSpark = 1;
  var KEY = me.getAttribute("data-key") || "";
  var API = new URL(me.src).origin + "/api/spark/public";
  var LS = "lc_spark_vk";
  if (!/^[a-f0-9]{16,64}$/.test(KEY)) return;

  function visitorKey() {
    var k = null;
    try { k = localStorage.getItem(LS); } catch { /* storage blocked */ }
    if (!k || !/^[a-zA-Z0-9_-]{16,64}$/.test(k)) {
      var a = new Uint8Array(18);
      if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
      else for (var i = 0; i < a.length; i++) a[i] = Math.random() * 256;
      k = Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
      try { localStorage.setItem(LS, k); } catch { /* storage blocked */ }
    }
    return k;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  // Escape everything, then turn https links (only) into safe anchors.
  function linkify(s) {
    return esc(s).replace(/https:\/\/[^\s<>"']+/g, function (u) {
      var trail = (u.match(/[.,!?;:)]+$/) || [""])[0];
      u = u.slice(0, u.length - trail.length);
      return '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + u + "</a>" + trail;
    }).replace(/\n/g, "<br>");
  }

  fetch(API + "?k=" + encodeURIComponent(KEY), { credentials: "omit" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (cfg) { if (cfg && cfg.enabled) mount(cfg); })
    .catch(function () {});

  function mount(cfg) {
    var navy = "#0F1A38", gold = "#D4AF63";
    var main = cfg.brandColor || navy;
    var accent = cfg.brandColor ? "#ffffff" : gold;
    var host = document.createElement("div");
    host.setAttribute("data-lc-spark", "");
    host.style.cssText = "position:fixed;z-index:2147483000;right:0;bottom:0;width:0;height:0";
    document.body.appendChild(host);
    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    var name = esc(cfg.name || "LC Spark");
    root.innerHTML =
      "<style>" +
      ":host{all:initial}*{box-sizing:border-box;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif}" +
      ".b{position:fixed;right:20px;bottom:20px;width:60px;height:60px;border-radius:50%;border:2px solid " + accent + ";background:" + main + ";color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(0,0,0,.25);transition:transform .15s}" +
      ".b:hover{transform:scale(1.05)}.b:focus-visible,button:focus-visible,textarea:focus-visible,a:focus-visible{outline:3px solid " + gold + ";outline-offset:2px}" +
      ".p{position:fixed;right:20px;bottom:92px;width:370px;max-width:calc(100vw - 40px);height:540px;max-height:calc(100vh - 120px);background:#fff;color:#1a1a1a;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.3);display:flex;flex-direction:column;overflow:hidden;font-size:15px;line-height:1.45}" +
      ".p[hidden]{display:none}" +
      ".h{background:" + main + ";color:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid " + accent + "}" +
      ".h strong{font-size:16px}.x{background:none;border:0;color:#fff;font-size:24px;line-height:1;cursor:pointer;padding:4px 8px;border-radius:6px}" +
      ".l{flex:1;overflow-y:auto;padding:14px;background:#F8F5F0;display:flex;flex-direction:column;gap:10px}" +
      ".m{max-width:85%;padding:9px 13px;border-radius:14px;word-wrap:break-word;overflow-wrap:anywhere}" +
      ".a{align-self:flex-start;background:#fff;border:1px solid #e3ddd2;color:#1a1a1a}.v{align-self:flex-end;background:" + main + ";color:#fff}" +
      ".a a{color:#1F5E63;text-decoration:underline}.v a{color:#fff;text-decoration:underline}" +
      ".bk{align-self:flex-start;background:" + gold + ";color:" + navy + ";font-weight:600;text-decoration:none;padding:9px 14px;border-radius:999px}" +
      ".t{align-self:flex-start;color:#5a6472;font-size:13px}.t span{display:inline-block;width:6px;height:6px;margin:0 2px;border-radius:50%;background:#5a6472;animation:d 1s infinite}" +
      ".t span:nth-child(2){animation-delay:.2s}.t span:nth-child(3){animation-delay:.4s}@keyframes d{0%,80%,100%{opacity:.3}40%{opacity:1}}" +
      ".f{display:flex;gap:8px;padding:10px;border-top:1px solid #e3ddd2;background:#fff}" +
      "textarea{flex:1;resize:none;border:1px solid #c9c2b5;border-radius:10px;padding:9px 10px;font-size:15px;color:#1a1a1a;background:#fff;height:44px;max-height:120px}" +
      ".s{background:" + main + ";color:#fff;border:0;border-radius:10px;padding:0 16px;font-weight:600;cursor:pointer}.s:disabled{opacity:.5;cursor:default}" +
      ".pw{font-size:11px;color:#5a6472;text-align:center;padding:0 0 8px;background:#fff}" +
      ".hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}" +
      ".sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}" +
      "@media (max-width:480px){.p{right:0;left:0;bottom:0;width:100%;max-width:100%;height:100%;max-height:100%;border-radius:0}}" +
      "@media (prefers-reduced-motion:reduce){.b{transition:none}.b:hover{transform:none}.t span{animation:none;opacity:.7}}" +
      "</style>" +
      '<button class="b" type="button" aria-label="Chat with ' + name + '" aria-expanded="false" aria-controls="lcsp">' +
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 1 1 21 11.5z"/></svg></button>' +
      '<div class="p" id="lcsp" role="dialog" aria-label="Chat with ' + name + '" hidden>' +
      '<div class="h"><strong>' + name + '</strong><button class="x" type="button" aria-label="Close chat">&times;</button></div>' +
      '<div class="l" role="log" aria-live="polite" aria-relevant="additions"></div>' +
      '<form class="f"><label class="sr" for="lcsp-in">Your message</label><textarea id="lcsp-in" rows="1" maxlength="1000" placeholder="Type your message…"></textarea>' +
      '<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<button class="s" type="submit">Send</button></form>' +
      '<div class="pw">Powered by LC Spark · AI assistant</div></div>';

    var q = function (s) { return root.querySelector(s); };
    var btn = q(".b"), panel = q(".p"), list = q(".l"), form = q(".f"), input = q("textarea"), send = q(".s"), hp = q(".hp");
    var busy = false, greeted = false;

    function add(cls, html) {
      var d = document.createElement(cls === "bk" ? "a" : "div");
      d.className = cls === "bk" ? "bk" : "m " + cls;
      d.innerHTML = html;
      list.appendChild(d);
      list.scrollTop = list.scrollHeight;
      return d;
    }
    function open() {
      panel.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      if (!greeted) { greeted = true; add("a", linkify(cfg.greeting || "Hi! How can I help?")); }
      setTimeout(function () { input.focus(); }, 30);
    }
    function close() {
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      btn.focus();
    }
    btn.addEventListener("click", function () { if (panel.hidden) open(); else close(); });
    q(".x").addEventListener("click", close);
    panel.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (form.requestSubmit) form.requestSubmit(); else submit(e); }
    });
    form.addEventListener("submit", submit);

    function submit(e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text || busy) return;
      busy = true;
      send.disabled = true;
      input.value = "";
      add("v", linkify(text));
      var typing = document.createElement("div");
      typing.className = "t";
      typing.setAttribute("aria-label", cfg.name + " is typing");
      typing.innerHTML = "<span></span><span></span><span></span>";
      list.appendChild(typing);
      list.scrollTop = list.scrollHeight;
      fetch(API, {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ k: KEY, visitorKey: visitorKey(), text: text.slice(0, 1000), page: location.href.split("#")[0].slice(0, 500), _hp: hp.value })
      })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (j) {
          typing.remove();
          add("a", linkify(j.reply || j.error || "Sorry, something went wrong. Please try again."));
          if (j.bookingUrl && /^https:\/\//.test(j.bookingUrl)) {
            var a = add("bk", "Book a time");
            a.href = j.bookingUrl;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
          }
        })
        .catch(function () {
          typing.remove();
          add("a", "Sorry, I couldn't connect. Please try again in a moment.");
        })
        .then(function () {
          busy = false;
          send.disabled = false;
          input.focus();
        });
    }
  }
})();
