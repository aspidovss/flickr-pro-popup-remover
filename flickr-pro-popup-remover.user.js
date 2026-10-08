// ==UserScript==
// @name         Flickr Pro Popup Remover
// @name:ru      Удаление окна Flickr Pro
// @namespace    https://github.com/aspdiovss/flickr-pro-popup-remover
// @version      1.5.0
// @description  Removes the "Upgrade to Pro" popup and its dark backdrop on flickr.com, without flicker.
// @description:ru  Убирает всплывающее окно «Upgrade to Pro» и затемнение на flickr.com без морганий.
// @author       aspidovss
// @license      MIT
// @homepageURL  https://github.com/aspdiovss/flickr-pro-popup-remover
// @supportURL   https://github.com/aspdiovss/flickr-pro-popup-remover/issues
// @match        https://www.flickr.com/*
// @match        https://flickr.com/*
// @run-at       document-start
// @noframes
// @grant        none
// ==/UserScript==

/*
 * Flickr Pro Popup Remover
 * ------------------------
 * EN: Flickr periodically shows a full-screen "Upgrade to Pro" modal. This script hides it
 *     (and its backdrop) before the browser paints it, restores page scrolling, and does
 *     not touch any other Flickr dialog (share, edit, etc.).
 * RU: Flickr периодически показывает полноэкранное окно «Upgrade to Pro». Скрипт прячет его
 *     (и затемнение) до отрисовки браузером, возвращает прокрутку страницы и не трогает
 *     остальные окна Flickr (поделиться, редактирование и т.д.).
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
  //     3) the ad cannot lock page scrolling (it sets overflow:hidden on <body>).
  // RU: Подключается на document-start, поэтому правила действуют до первой отрисовки:
  //     1) рекламное окно всегда скрыто;
  //     2) любое затемнение невидимо, пока не подтверждено, что рядом нет рекламы;
  //     3) реклама не блокирует прокрутку (она ставит overflow:hidden на <body>).
  const css = document.createElement('style');
  css.textContent = `
    .fluid-modal-view:has(${AD}) { display: none !important; }
    .fluid-modal-overlay:not([${OK}]) { visibility: hidden !important; }
    html:has(.fluid-modal-view:has(${AD})),
    html:has(.fluid-modal-view:has(${AD})) body { overflow: auto !important; }
  `;
  (document.head || document.documentElement).appendChild(css);

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
  log('v1.5.0 started');
})();
