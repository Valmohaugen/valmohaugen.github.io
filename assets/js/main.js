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
     Research Highlights — Ranked Projects
     Edit this list to reorder highlights on the homepage.
     The top 3 entries are displayed. Impact ranking:
       - Active research with papers in prep = highest
       - Competition wins / novel methods = high
       - Hackathon projects = medium
       - Web / education = lower
     --------------------------------------------------------- */
  var RANKED_PROJECTS = [
    {
      title: 'Topological Materials via VQE',
      description: 'Variational quantum eigensolver framework for screening topological superconductor candidates via the Kitaev chain. Studies Majorana zero modes, winding numbers, and topological phase transitions with classical benchmarking and Materials Project integration.',
      details: [
        'Topological superconductors host Majorana zero modes\u2014exotic quasiparticles with potential applications in fault-tolerant quantum computing. This project develops a systematic VQE-based framework for identifying topological superconductor candidates by combining quantum simulation with model-aware physics diagnostics.',
        'The pipeline constructs real-space Bogoliubov\u2013de Gennes (BdG) Hamiltonians for the Kitaev chain model with configurable chemical potential (\u03bc), hopping amplitude (t), and superconducting gap (\u0394), including optional on-site disorder. These are mapped to qubit operators via Jordan-Wigner transformation using Qiskit\u2019s SparsePauliOp, then optimized with VQE using hardware-efficient ans\u00e4tze and BackendEstimatorV2.',
        'Topological characterization includes momentum-space winding number computation (W = 1 in the topological phase |\u03bc| < 2t, W = 0 in the trivial phase), entanglement entropy across bipartitions, and finite-size scaling analysis near the phase boundary. Classical exact diagonalization benchmarks validate all quantum results.',
        'The project integrates with the Materials Project API for candidate screening and includes an active learning module for efficient material discovery. All runs log reproducibility artifacts: git hash, random seeds, package versions, and full parameter sets in HDF5 format.',
        'Key tools: Qiskit 2.x, PennyLane, NumPy, SciPy, Matplotlib, Materials Project API, SLURM/HPC'
      ]
    },
    {
      title: 'MZM Visibility',
      description: 'End-to-end deep learning pipeline predicting Majorana zero mode phase diagrams from nanowire conductance data. Modified ResNet-18 trained on 900M synthetic measurements with Monte Carlo dropout uncertainty quantification.',
      details: [
        'Identifying Majorana zero modes (MZMs) in nanowire experiments remains challenging due to the similarity between topological signatures and disorder-induced trivial states. This project applies convolutional neural networks to automate the classification of MZM visibility from simulated conductance data, bridging the gap between theoretical predictions and experimental observables.',
        'Data generation uses Kwant-based quantum transport simulations on a 6-dimensional parameter grid (disorder strength, Zeeman field, chemical potential, superconducting gap, bias voltage, and spin-orbit coupling), producing 300\u2013900 million conductance measurements across three disorder correlation lengths. Each sample is labeled with topological invariants: the winding number and a periodic disorder invariant (PDI).',
        'The CNN architecture extends ResNet-18 with a 4-channel encoder, label embedding decoder, CoordConv layers, and gated attention multiple-instance learning (MIL) pooling. Training uses a composite loss function combining binary cross-entropy, Dice, focal, and total variation terms, optimized with AdamW and cosine annealing warm restarts.',
        'Inference supports single-slice and multi-slice modes with Monte Carlo dropout uncertainty quantification. Evaluation metrics include Hausdorff distance, Dice/IoU coefficients, boundary-aware F1, and \u03bc-informativeness analysis identifying the most diagnostic parameter slices.',
        'The pipeline runs on Clemson\u2019s Palmetto HPC cluster with A100 GPUs, using mixed-precision training (torch.amp) and torch.compile for performance.',
        'Key tools: PyTorch 2.x, Kwant, NumPy, SciPy, h5py, Matplotlib, SLURM/HPC'
      ]
    },
    {
      title: 'iQuHACK 2026 — Circuit Optimization',
      description: 'Reed-Muller decoding-based Clifford+T circuit optimizer minimizing T-gate count and circuit depth for fault-tolerant quantum compilation. Multi-strategy synthesis with pattern recognition and phase-polynomial optimization.',
      details: [
        'Fault-tolerant quantum computing requires decomposing arbitrary unitaries into the Clifford+T gate set (H, T, T\u2020, S, S\u2020, CX), where T-gates are the dominant cost due to magic state distillation overhead. This project builds a complete synthesis and optimization pipeline that converts arbitrary unitary matrices into resource-efficient Clifford+T circuits.',
        'The optimizer employs a multi-strategy approach: pattern recognition identifies common 2-qubit structures (QFT blocks, Heisenberg/XX+YY interactions) and maps them to known optimal decompositions; brute-force search explores low-T circuit structures for small unitaries; and phase-polynomial optimization via the rmsynth C++ toolkit applies Reed-Muller decoding (Dumer, RPA, and OSD backends) to minimize T-count in larger circuits.',
        'For single-qubit rotations, the pipeline uses pygridsynth for grid-operator-based Rz angle approximation, achieving near-optimal T-counts at configurable precision. The system supports multiple effort levels that trade compilation time for circuit quality, and outputs standard QASM with full resource metrics (T-count, CX-count, total depth).',
        'All 11 challenge unitaries were successfully optimized, with results benchmarked across effort levels. The project provides both a CLI and Python API for integration into larger compilation workflows.',
        'Key tools: Python, Qiskit 2.x, rmsynth (C++), pygridsynth, NumPy, SciPy'
      ]
    },
    {
      title: 'SC Quantathon v2 — Tornado Prediction',
      description: 'Multi-framework quantum ML for tornado prediction benchmarking QSVM, QNN, and quantum feature extraction against classical baselines across Qiskit, Cirq, and PennyLane.'
    },
    {
      title: 'NeurotiQ — EEG Quantum ML',
      description: 'Full-stack quantum ML application for EEG-based mental health diagnosis with QSVM, QCNN, and a GPT-4-powered Streamlit interface. Achieved 79% AUC on anxiety detection.'
    },
    {
      title: 'SC Quantathon v1 — QRNG',
      description: 'Award-winning quantum random number generation on IBM quantum processors. Five-stage pipeline spanning circuit design, ML discrimination, noise characterization, and entropy extraction.'
    },
    {
      title: 'iQuHACK 2025 — Cat Qubits',
      description: 'Cat qubit simulation and optimal control for open quantum systems. Two-photon dissipative stabilization, JAX-based gradient optimization, and Wigner function phase space analysis.'
    },
    {
      title: 'Clemson Quantum Website',
      description: 'Official Clemson Quantum Group website built with Next.js 15, React 19, and TypeScript. Markdown-driven content architecture with static export and GitHub Actions CI/CD.'
    },
    {
      title: 'Qoffee Maker Activity',
      description: 'Educational quantum circuit activity using a coffee-making metaphor to teach single-qubit gates, measurement, superposition, and entanglement to newcomers.'
    }
  ];

  function initResearchHighlights() {
    var container = document.getElementById('research-highlights');
    if (!container) return;

    var top3 = RANKED_PROJECTS.slice(0, 3);
    var delays = ['', ' reveal-delay-1', ' reveal-delay-2'];

    top3.forEach(function (project, i) {
      var div = document.createElement('div');
      div.className = 'highlight-item reveal' + delays[i];

      var summaryWrap = document.createElement('div');
      summaryWrap.className = 'highlight-summary';

      var h3 = document.createElement('h3');
      h3.textContent = project.title;
      summaryWrap.appendChild(h3);

      var p = document.createElement('p');
      p.textContent = project.description;
      summaryWrap.appendChild(p);

      div.appendChild(summaryWrap);

      // Expandable details section
      if (project.details && project.details.length > 0) {
        var detailsEl = document.createElement('details');
        detailsEl.className = 'highlight-details';

        var summary = document.createElement('summary');
        summary.style.display = 'none';
        detailsEl.appendChild(summary);

        var body = document.createElement('div');
        body.className = 'highlight-details-body';

        project.details.forEach(function (text) {
          var dp = document.createElement('p');
          dp.textContent = text;
          body.appendChild(dp);
        });

        detailsEl.appendChild(body);
        div.appendChild(detailsEl);

        // Click h3 to toggle
        h3.style.cursor = 'pointer';
        h3.addEventListener('click', function () {
          if (detailsEl.hasAttribute('open')) {
            detailsEl.removeAttribute('open');
          } else {
            detailsEl.setAttribute('open', '');
          }
        });
      }

      container.appendChild(div);
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
      var heading = entry.querySelector('.research-entry__content h3');
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
    initResearchHighlights();
    initScrollReveal();
    initHamburger();
    initExpandableCards();
    initResearchEntryToggle();
  });
})();
