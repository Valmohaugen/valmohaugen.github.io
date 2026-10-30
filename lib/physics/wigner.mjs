// @ts-check
/**
 * Exact Wigner function of a Schrödinger cat state of light under photon loss.
 * The ground truth that the general engine (states.mjs) and the GPU shader are
 * tested against.
 *
 * Conventions: ħ = 1, a = (x + ip)/√2, z = (x + ip)/√2, so the vacuum is
 * W₀(x, p) = e^{−x²−p²}/π and ∫∫W dx dp = 1.
 *
 * Derivation (Gerry & Knight, Introductory Quantum Optics (2005) §3.7, §7).
 * 1. Coherent overlap: ⟨γ|β⟩ = exp(−|γ|²/2 − |β|²/2 + γ*β).
 * 2. The Wigner function of the operator |a⟩⟨b| is
 *      W_ab(z) = (1/π) ⟨b|a⟩ exp[−2(z − a)(z* − b*)];
 *    for a = b this is the coherent-state Gaussian centered at a.
 * 3. Cat state |ψ_s⟩ = N_s(|α⟩ + s|−α⟩), α > 0 real, s = ±1. Normalization:
 *      1 = N_s²(2 + 2s·⟨−α|α⟩) = 2N_s²(1 + s e^{−2α²}),  N_s² = 1/[2(1 + s e^{−2α²})].
 * 4. Summing the four W_ab terms with x₀ = √2·α:
 *      W_s = (N_s²/π)[e^{−(x−x₀)²−p²} + e^{−(x+x₀)²−p²} + 2s e^{−x²−p²} cos(2x₀p)].
 * 5. Photon loss (Lindblad L = √κ a, surviving fraction η = e^{−κt}) maps
 *      |β⟩⟨γ| → ⟨γ|β⟩^{1−η} |√η β⟩⟨√η γ|,
 *    so the peaks move to ±x_η with x_η = √(2η)·α. For the cross term
 *    |α⟩⟨−α|, expanding step 2 at a = √ηα, b = −√ηα gives
 *    ⟨b|a⟩·exp(+2ηα²)·e^{−x²−p²}·e^{−2i x_η p} with ⟨b|a⟩ = e^{−2ηα²} (its
 *    conjugate partner |−α⟩⟨α| supplies e^{+2i x_η p}, giving 2cos(2x_η p)), so
 *    only the channel's prefactor ⟨−α|α⟩^{1−η} = e^{−2α²(1−η)} survives: the
 *    interference term is scaled by the fringe visibility V = exp(−2α²(1 − η)):
 *      W_s(x, p; η) = (N_s²/π)[e^{−(x−x_η)²−p²} + e^{−(x+x_η)²−p²}
 *                               + 2s·V·e^{−x²−p²} cos(2x_η p)].
 *    N_s is unchanged: the channel preserves the trace.
 * Checks (scripts/verify-wigner.mjs): ∫∫W = 1 for every η; W_s(0,0) = s/π at
 * η = 1 (W(0,0) = ⟨(−1)ⁿ⟩/π and cat states are parity eigenstates); α → 0
 * gives the vacuum (s = +1) and Fock |1⟩ (s = −1) with O(α²) corrections;
 * |W| ≤ 1/π.
 */

/**
 * Fringe visibility of a cat state after photon loss: V = exp(−2α²(1 − η)).
 * Fringes decay at rate 2α²κ while the peaks drift at κ/2, so bigger cats
 * lose their quantum signature faster.
 *
 * @param {number} alpha Cat amplitude α > 0 (real).
 * @param {number} eta Surviving fraction of the light, 0 ≤ η ≤ 1.
 * @returns {number} V in (0, 1]; V = 1 when η = 1.
 */
export function fringeVisibility(alpha, eta) {
  return Math.exp(-2 * alpha * alpha * (1 - eta));
}

/**
 * Wigner function W_s(x, p; η) of the cat state N_s(|α⟩ + s|−α⟩) after photon
 * loss η (derivation steps 4–5 above).
 *
 * @param {number} x Position quadrature x = (a + a†)/√2.
 * @param {number} p Momentum quadrature p = (a − a†)/(i√2).
 * @param {number} alpha Cat amplitude α > 0 (real).
 * @param {number} [eta=1] Surviving fraction of the light, 0 ≤ η ≤ 1 (1 = no loss).
 * @param {number} [s=1] Parity: +1 for the even cat, −1 for the odd cat.
 * @returns {number} W(x, p), bounded by |W| ≤ 1/π, integrating to 1.
 * @throws {RangeError} When s is not ±1, η is outside [0, 1], or the odd cat
 *   has α = 0 (the state |α⟩ − |−α⟩ vanishes there).
 */
export function catWigner(x, p, alpha, eta = 1, s = 1) {
  if (s !== 1 && s !== -1) throw new RangeError(`catWigner: parity s = ${s}; need ±1`);
  if (!(eta >= 0 && eta <= 1)) throw new RangeError(`catWigner: η = ${eta}; need 0 ≤ η ≤ 1`);
  if (s === -1 && !(alpha > 0)) throw new RangeError('catWigner: the odd cat needs α > 0');
  const a2 = alpha * alpha;
  // N_s² = 1/[2(1 + s e^{−2α²})]; for s = −1, 1 − e^{−2α²} = −expm1(−2α²) avoids cancellation.
  const n2 = 1 / (2 * (s === 1 ? 1 + Math.exp(-2 * a2) : -Math.expm1(-2 * a2)));
  const xEta = Math.sqrt(2 * eta) * alpha;
  const lobes = Math.exp(-((x - xEta) ** 2) - p * p) + Math.exp(-((x + xEta) ** 2) - p * p);
  const fringes = 2 * s * fringeVisibility(alpha, eta) * Math.exp(-x * x - p * p) * Math.cos(2 * xEta * p);
  return (n2 / Math.PI) * (lobes + fringes);
}
