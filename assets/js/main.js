/* ============================================================
   Valentine Mohaugen — Portfolio JS
   Scroll reveal, hamburger menu
   ============================================================ */

(function () {
  'use strict';

  /* ---------------------------------------------------------
     Scroll Reveal (IntersectionObserver)
     --------------------------------------------------------- */
  function initScrollReveal() {
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var reveals = document.querySelectorAll('.reveal');

    if (prefersReduced) {
      reveals.forEach(function (el) {
        el.classList.add('reveal--visible');
      });
      return;
    }

    if (!('IntersectionObserver' in window)) {
      reveals.forEach(function (el) {
        el.classList.add('reveal--visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------------------------------------------------------
     Hamburger Menu
     --------------------------------------------------------- */
  function initHamburger() {
    var btn = document.querySelector('.nav-toggle');
    var menu = document.querySelector('.nav-links');
    if (!btn || !menu) return;

    btn.removeAttribute('onclick');

    btn.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (menu.classList.contains('open') && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    menu.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------------------------------------------------
     Expandable Cards (skill cards + research cards)
     --------------------------------------------------------- */
  function initExpandableCards() {
    var selectors = '.skill-category[role="button"], .research-card[role="button"]';
    var cards = document.querySelectorAll(selectors);
    cards.forEach(function (card) {
      var header = card.querySelector('.research-card__header') || card;
      header.addEventListener('click', function (e) {
        // Don't toggle if user clicked a link inside the header
        if (e.target.closest('a')) return;
        var expanded = card.getAttribute('aria-expanded') === 'true';
        card.setAttribute('aria-expanded', String(!expanded));
      });
      header.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          header.click();
        }
      });
    });
  }

  /* ---------------------------------------------------------
     Research Entry Toggle (h3 triggers details)
     --------------------------------------------------------- */
  function initResearchEntryToggle() {
    var entries = document.querySelectorAll('.research-entry');
    entries.forEach(function (entry) {
      var heading = entry.querySelector('.research-entry__header-row h3');
      var details = entry.querySelector(':scope > .research-entry__details');
      if (!heading || !details) return;

      heading.addEventListener('click', function () {
        var isOpen = details.hasAttribute('open');
        if (isOpen) {
          details.removeAttribute('open');
          entry.classList.remove('entry--expanded');
        } else {
          details.setAttribute('open', '');
          entry.classList.add('entry--expanded');
        }
      });
    });
  }

  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    initScrollReveal();
    initHamburger();
    initExpandableCards();
    initResearchEntryToggle();
  });
})();
