// ==UserScript==
// @name         Flickr Pro Popup Remover
// @name:ru      Удаление окна Flickr Pro
// @namespace    https://github.com/aspidovss/flickr-pro-popup-remover
// @version      1.7.1
// @description  Removes the "Upgrade to Pro" popup, the "Upgrade to Flickr Pro to hide these ads" banner and the ad blocks on flickr.com, without flicker.
// @description:ru  Убирает окно «Upgrade to Pro», баннер «Upgrade to Flickr Pro to hide these ads» и рекламные блоки на flickr.com без морганий.
// @author       aspidovss
// @license      MIT
// @homepageURL  https://github.com/aspidovss/flickr-pro-popup-remover
// @supportURL   https://github.com/aspidovss/flickr-pro-popup-remover/issues
// @match        https://www.flickr.com/*
// @match        https://flickr.com/*
// @run-at       document-start
// @noframes
// @grant        none
// ==/UserScript==

/*
 * Flickr Pro Popup Remover
 * ------------------------
 * EN: Flickr periodically shows a full-screen "Upgrade to Pro" modal, an inline
 *     "Upgrade to Flickr Pro to hide these ads" banner and ad blocks. This script hides all
 *     of them (and the modal's backdrop) before the browser paints them, restores page
 *     scrolling, and does not touch any other Flickr dialog (share, edit, etc.).
 *     Note: it only hides elements; it does not block the ad network requests.
 * RU: Flickr периодически показывает полноэкранное окно «Upgrade to Pro», баннер
 *     «Upgrade to Flickr Pro to hide these ads» и рекламные блоки. Скрипт прячет всё это
 *     (и затемнение окна) до отрисовки браузером, возвращает прокрутку страницы и не трогает
 *     остальные окна Flickr (поделиться, редактирование и т.д.).
 *     Важно: скрипт только прячет элементы, запросы к рекламным сетям он не блокирует.
 *
 * Requires CSS :has() — Firefox 121+, Chrome/Edge 105+, Safari 15.4+.
 * Требуется CSS :has() — Firefox 121+, Chrome/Edge 105+, Safari 15.4+.
 */

(function () {
  'use strict';

  // EN: Set to true to print what the script does to the browser console (filter by "FPR").
  // RU: Поставьте true, чтобы видеть действия скрипта в консоли браузера (фильтр "FPR").
  const DEBUG = false;
  const log = (...args) => DEBUG && console.log('[FPR]', ...args);

  // EN: Anything inside a modal that matches this selector marks it as the Pro advertisement.
  // RU: Если внутри окна есть элемент по этому селектору — это рекламное окно Pro.
  const AD = '.upsell-modal-view, .upsell-modal, a[href*="/account/upgrade"]';

  // EN: Attribute set on a backdrop once we know it belongs to a regular (non-ad) modal.
  // RU: Атрибут для затемнения, которое относится к обычному (не рекламному) окну.
  const OK = 'data-fpr-ok';

  // EN: Injected at document-start, so the rules apply before the first paint:
  //     1) the ad modal is always hidden;
  //     2) every backdrop is invisible until we confirm it is not paired with an ad;
  //     3) the ad cannot lock page scrolling (it sets overflow:hidden on <body>);
  //     4) the "Upgrade to Flickr Pro to hide these ads" banner is hidden;
  //     5) ad containers are hidden (.photo-page-i-m-container wraps the ad slot, the
  //        banner and the timer; .moola-wrapper / [data-aaad] are the ad slots themselves);
  //     6) on /photos/ pages the empty ad strip above the header (.nav-ad-container) is hidden.
  // RU: Подключается на document-start, поэтому правила действуют до первой отрисовки:
  //     1) рекламное окно всегда скрыто;
  //     2) любое затемнение невидимо, пока не подтверждено, что рядом нет рекламы;
  //     3) реклама не блокирует прокрутку (она ставит overflow:hidden на <body>);
  //     4) баннер «Upgrade to Flickr Pro to hide these ads» скрыт;
  //     5) рекламные контейнеры скрыты (.photo-page-i-m-container — обёртка рекламного слота,
  //        баннера и таймера; .moola-wrapper / [data-aaad] — сами рекламные слоты);
  //     6) на страницах /photos/ скрыта пустая рекламная полоса над шапкой (.nav-ad-container).
  const css = document.createElement('style');
  css.textContent = `
    .fluid-modal-view:has(${AD}) { display: none !important; }
    .fluid-modal-overlay:not([${OK}]) { visibility: hidden !important; }
    html:has(.fluid-modal-view:has(${AD})),
    html:has(.fluid-modal-view:has(${AD})) body { overflow: auto !important; }
    .upgrade-to-pro-cta { display: none !important; }
    .photo-page-i-m-container,
    .moola-wrapper,
    [data-aaad],
    .navad-timer-container { display: none !important; }
    html.fpr-photos .nav-ad-container,
    html.fpr-photos .desktop-nav-ad { display: none !important; }
  `;
  (document.head || document.documentElement).appendChild(css);

  // EN: Page scope for rule 6. Flickr is a single-page app (the URL changes without a reload),
  //     so the scope is re-evaluated on every DOM change and on back/forward navigation.
  // RU: Область действия правила 6. Flickr — одностраничное приложение (адрес меняется без
  //     перезагрузки), поэтому область пересчитывается при каждом изменении DOM и навигации.
  const root = document.documentElement;
  function updateScope() {
    root.classList.toggle('fpr-photos', location.pathname.startsWith('/photos/'));
  }
  updateScope();
  window.addEventListener('popstate', updateScope);

  const closed = new WeakSet();

  // EN: Finds the modal that follows a backdrop in the DOM.
  // RU: Находит окно, которое в DOM идёт после затемнения.
  function modalFor(overlay) {
    let el = overlay.nextElementSibling;
    while (el && !el.classList.contains('fluid-modal-view')) el = el.nextElementSibling;
    return el;
  }

  // EN: Runs synchronously from MutationObserver, i.e. before the browser draws the frame.
  // RU: Выполняется синхронно из MutationObserver, то есть раньше, чем браузер нарисует кадр.
  function check() {
    updateScope();
    document.querySelectorAll('.fluid-modal-overlay').forEach((overlay) => {
      const modal = modalFor(overlay);

      if (modal && modal.querySelector(AD)) {
        // EN: Advertisement — keep the backdrop hidden and press the close button once,
        //     so Flickr tears the modal down itself.
        // RU: Реклама — затемнение остаётся скрытым, один раз нажимаем крестик,
        //     чтобы Flickr сам убрал окно.
        overlay.removeAttribute(OK);
        if (!closed.has(modal)) {
          closed.add(modal);
          log('Pro modal hidden', modal.id);
          const closeBtn = modal.querySelector('.close-x');
          if (closeBtn) setTimeout(() => { try { closeBtn.click(); } catch (e) { /* ignore */ } }, 0);
        }
      } else if (modal && modal.querySelector('.body')?.children.length) {
        // EN: Regular Flickr dialog — show its backdrop normally.
        // RU: Обычное окно Flickr — показываем его затемнение как обычно.
        overlay.setAttribute(OK, '1');
      }
    });
  }

  // EN: Safety net: a backdrop that never gets a modal is revealed after a while,
  //     so we can never leave an invisible backdrop that Flickr expects to be visible.
  // RU: Страховка: затемнение, у которого так и не появилось окно, показываем через время,
  //     чтобы не оставить невидимым то, что Flickr ожидает увидеть.
  setInterval(() => {
    document.querySelectorAll(`.fluid-modal-overlay:not([${OK}])`).forEach((overlay) => {
      if (!modalFor(overlay)) overlay.setAttribute(OK, '1');
    });
  }, 1500);

  new MutationObserver(check).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', check);
  log('v1.7.1 started');
})();
