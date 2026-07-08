# Prime Constellation
### A GPU-rendered flight through the primes — and the hidden music of the Riemann zeros that conducts them

## Vision

`Prime Constellation` is an interactive, GPU-rendered 3D atlas of the prime numbers. It begins where 3Blue1Brown's *"Why do prime numbers make these spirals?"* leaves off — the polar plot of primes at (p, p), the Archimedean spiral arms that are secretly rational approximations of 2π, the residue-class structure modulo 6, 44, and 210 — and lifts that flat picture into a navigable helix that recedes toward infinity. But the spirals are the overture, not the symphony. The heart of the project is to *show*, in real time and with mathematical honesty, the single deepest fact in analytic number theory: that the nontrivial zeros of the Riemann zeta function ζ(s) act as the Fourier spectrum of the primes, conducting the staircase of π(x) note by note.

This is a portfolio flagship built on two convictions held in tension: **depth over spectacle**, and **spectacle in service of depth**. Every visual is a faithful rendering of a real theorem or a clearly labeled conjecture — nothing is decorative hand-waving — but the rendering itself is cinematic, premium, and precise: a dark-space instrument panel through which real mathematics is flown.

---

## Aesthetic direction — "cinematic instrument panel"

The look is **deep-space sci-fi meets Palantir Gotham HUD**: a true-black void, a luminous galaxy of primes as the single hero object, and a restrained gold instrumentation layer floating over it. Restraint is the aesthetic — most of the screen is empty black, and that emptiness is what makes the galaxy read as luminous.

**Palette.**
- Void: true-black / deep-navy (`#000108`), fading to indigo only in the faint nebula haze.
- Accent: gold / amber (`#e0b93d`) as the **sole** UI accent, used for primes and active instrumentation. No second accent color. Residue-class coloring stays *within the amber-to-white family* (cool gold → warm gold → white-hot core) rather than introducing a rainbow — the hue variation encodes the mathematics without breaking the monochrome discipline.
- Text/HUD: monospace throughout, low-opacity cool-gray for passive data, amber for active/critical values.

**The environment (the space the galaxy lives in).**
- **Multi-layer starfield** — three depth layers of tiny points with **parallax**: distant stars drift slower than near ones as the camera moves, giving true depth to the void.
- **Volumetric nebula haze** — a very-low-opacity navy/indigo fog in the deep background, giving the void dimension without ever competing with the primes for attention.
- **The galaxy is the light source** — a soft amber glow emanates from the dense helix core, as if the primes themselves illuminate the scene.

**HUD / instrumentation language.**
- **Angular corner-bracket frames** (not boxed panels) marking the viewport and active regions — the Gotham signature.
- **Circular hover reticles** that lock onto a prime, not boxy tooltips — a targeting ring that scales in with a slight spring, with a thin leader line to a callout.
- **Thin hairline borders** (1px, low-opacity), generous negative space, sentence-case labels, no rounded "friendly" UI — every element reads as instrument-panel precision.

**Glass UI panels (minimal, restrained, performance-conscious).**
- Frosted-glass HUD panels via `backdrop-filter` blur (**8–16px only**, low saturation), a translucent navy tint, and a **single bright amber hairline on the top/left edge** to catch "light" — suggesting a bevel without a full refraction simulation.
- **Hard cap of 3 concurrent glass panels on screen.** Frosted `backdrop-filter` forces the GPU to copy-blur-repaste the framebuffer every frame; stacked with a 1M-point cloud and bloom it will drop frames. Off-screen or inactive panels fall back to flat translucent fills.
- **No full WebGL liquid-glass refraction.** Real screen-texture refraction (UV-displacement fragment shaders) is deliberately *out of scope* — it is too heavy combined with the point cloud and bloom, and the frosted-CSS approach reads as premium at a fraction of the cost. This is a considered engineering decision, not an omission.

---

## Animation & motion language

Premium feel here comes from **easing and continuity, not flashiness**. The rule: nothing linear, nothing snappy, nothing that cuts.

- **Eased everything.** All UI and camera tweens run on smooth cubic curves (GSAP for orchestration). Panels fade/slide in with a slight overshoot; the hover reticle scales in with a spring; values in the HUD count up rather than snapping.
- **Continuous zoom-tier transitions.** FAR → MID → NEAR is a single cinematic camera move — the camera *dives into* the galaxy, the helix pitch stretching around it — never a hard cut between discrete scenes.
- **A living galaxy.** Subtle per-point twinkle (slow, low-amplitude opacity noise) keeps the field alive rather than static; the core shimmers faintly as if breathing.
- **Cinematic lensing.** Very subtle chromatic aberration at the screen edges only, and additive-blended glow so dense prime regions bloom brighter — the core reads as white-hot.
- **Accessibility.** Respect `prefers-reduced-motion`: disable twinkle, idle drift, chromatic aberration, and overshoot; keep transitions instant and legible.
- **Performance is a feature.** Target a locked 60 fps. If point density threatens the frame budget, reduce visible points at far zoom via **LOD** *before* sacrificing the bloom/glow/twinkle that sell the look — the aesthetic survives fewer points, not a dimmer galaxy.

---

## The core object: a helix, not a spiral

Primes p₁ = 2, p₂ = 3, p₃ = 5, … are placed on a three-dimensional helix. The angular coordinate carries the arithmetic (θ = p in radians, reproducing the 3B1B polar plot and its residue-class arms); the z-axis is the prime *index* n on a logarithmic scale, so that the helix is "a thread connecting its own tail to infinity" — the density thinning as 1/log x exactly as the Prime Number Theorem demands. The camera flies along the axis. Because the mean gap between primes near x is ~log x, the visible pitch of the helix stretches as you ascend, and that stretching *is* the PNT made kinetic.

## Three-tier zoom architecture

**FAR — the galaxy.** Up to ~1,000,000 primes rendered as a single GPU point cloud (instanced `BufferGeometry`), colored by reduced residue class (within the amber family). Additive blending makes overlapping primes bloom brighter, so the dense core reads as luminous. At this scale the eye sees Dirichlet's theorem directly: the φ(q) reduced residue classes mod q each carry an equal share of the primes (equidistribution), while the *arms* the viewer sees are the totient-counted spokes of the 3B1B picture — 6 arms for the coprime residues mod 6, then 44 (from 44/7 ≈ 2π), then 210 = 2·3·5·7. The galaxy is a living Ulam/Sacks-style plot with correct asymptotic density.

**MID — the arms resolve.** As you descend, the spiral arms sharpen and annotations light up in the glass panels: which residue classes are "lit," why there are exactly φ(q) of them, and the Chebyshev-bias asymmetry between quadratic residues and non-residues. This is the tier where the prime-race and Hardy–Littlewood overlays live (below).

**NEAR — the constellation.** A few hundred primes rendered Obsidian-graph style: nodes for primes, glowing thread edges connecting twin (gap 2), cousin (gap 4), and sexy (gap 6) pairs. Hovering a node fires the reticle and reveals the number's properties — its residue classes, its gaps to neighbors, its membership in any k-tuple. The local texture of the primes becomes tangible.

---

## The flagship layer: the Riemann explicit formula

The intellectual center of `Prime Constellation` is a live rendering of the **Riemann–von Mangoldt explicit formula**. Define the second Chebyshev function

$$\psi(x) = \sum_{p^k \le x} \log p = \sum_{n \le x} \Lambda(n),$$

a staircase that jumps by log p at every prime power. Von Mangoldt (1895) proved Riemann's assertion rigorously:

$$\psi_0(x) = x - \sum_{\rho} \frac{x^{\rho}}{\rho} - \log(2\pi) - \tfrac{1}{2}\log(1 - x^{-2}),$$

where ψ₀ is the normalized value (average of left and right limits at jumps), and the sum runs over the nontrivial zeros ρ = β + iγ of ζ(s), taken as a symmetric limit over |γ| ≤ T. The sum is conditionally, not absolutely, convergent.

The magic is in the pairing. Under the Riemann Hypothesis every ρ = ½ + iγ, and each zero pairs with its conjugate ρ̄ = ½ − iγ to give a **real** oscillatory term:

$$\frac{x^{\rho}}{\rho} + \frac{x^{\bar\rho}}{\bar\rho} = \frac{2x^{1/2}}{|\rho|}\cos\!\big(\gamma \log x - \arg\rho\big).$$

So each zero contributes a cosine wave in the variable log x, of amplitude 2√x/|ρ| and frequency γ. **The zeros are the harmonics of the primes.** The leading term x is the PNT; the zeros supply every fluctuation around it. Low zeros (γ₁ = 14.1347…, γ₂ = 21.0220…, γ₃ = 25.0109…) paint the broad swells; high zeros carve the sharp steps at individual prime powers.

**What the user does.** A slider adds zeros one at a time, N = 1, 2, 5, 20, 100, 1000, …, and watches the smooth curve x sprout oscillations that snap, wave by wave, into the true staircase of ψ(x). The curve renders as a glowing amber trace in a glass panel over the galaxy; each added zero animates in with an eased sweep. This is the "music of the primes" made literally visible — the same demonstration Riemann could only imagine.

**Convergence, honestly.** Truncating at |γ| ≤ T leaves an error of order (x/T)·(log xT)² (plus a small term near prime powers). Practically: a few dozen zeros already capture the gross shape at small x; ~100 zeros give a visually convincing staircase up to x ≈ 100; and to resolve steps up to x ≈ 10⁴ one wants on the order of several hundred to a few thousand zeros. Because the partial sums exhibit Gibbs-like overshoot at the jumps, the animation offers **smoothed variants** — Riesz/Cesàro means and Gaussian smoothing of the counting function — that damp the ringing and make the frame-to-frame convergence monotone and beautiful rather than jittery. The equivalent π(x) reconstruction via Riemann's R-function, π₀(x) = R(x) − Σ_ρ R(x^ρ) with R(x) = Σ_{n≥1} (μ(n)/n) li(x^{1/n}) (Gram series), is offered as a second mode; here Li(x^ρ) must be evaluated as Ei(ρ log x) to respect the branch cut.

**Data.** The zeros ship precomputed. Odlyzko's public tables provide the first 100,000 zeros to ~9-digit accuracy (and 2,001,052 zeros in the extended set); the LMFDB carries zeros far higher. For arbitrary or higher-precision zeros, `mpmath.zetazero(n)` (Riemann–Siegel with Arias de Reyna's algorithm) computes any zero on demand. Shipping the first 10,000–100,000 zeros as a compact binary is ample for every animation the project needs.

---

## Secondary layer: the prime race (Chebyshev bias)

Define π(x; q, a) = #{p ≤ x : p ≡ a (mod q)}. Dirichlet guarantees the classes are asymptotically equal, but the *approach* is biased. In the mod-4 race between π(x; 4, 3) and π(x; 4, 1), the class 3 (the quadratic non-residues) leads almost always: π(x;4,3) < π(x;4,1) first occurs at x = 26861 (Leech, 1957) — the two are level again at the very next prime, 26863, with class 3 pulling ahead again until 616841.

The honest subtleties, all annotated:
- **Littlewood (1914):** π(x;4,3) − π(x;4,1) changes sign *infinitely often* — the bias is a tendency, never a theorem about eventual dominance.
- **Rubinstein–Sarnak (1994):** in "Chebyshev's Bias" (*Experimental Mathematics* 3(3):173–197), under GRH and the Grand Simplicity Hypothesis / Linear Independence (the ordinates γ of the relevant Dirichlet L-function zeros are linearly independent over ℚ), the logarithmic density of the set where class 3 leads is **δ(4;3,1) = 0.9959…** — the precise quantification of "almost always." (They also compute the mod-3 race density δ(3;2,1) = 0.9990…)
- The bias itself flows from the same explicit-formula machinery: the L-function zeros of χ mod q supply the oscillations, and the bias term traces to the prime *squares* (the difference between π and the prime-power count ψ).

**Visualization.** Two glowing runners racing along the number line, their lead Δ(x) = π(x;4,3) − π(x;4,1) plotted live, the crossing at 26861 flagged as a landmark reticle, and a density readout counting toward 0.9959. A toggle generalizes to other moduli (the mod-3 race, converging to 0.9990, and beyond).

---

## Secondary layer: Hardy–Littlewood k-tuples, tested live

The near-zoom constellation already draws twin/cousin/sexy edges. This layer makes them *quantitative*. The first Hardy–Littlewood conjecture predicts

$$\pi_2(x) \sim 2C_2 \int_2^x \frac{dt}{(\log t)^2}, \qquad C_2 = \prod_{p>2}\left(1 - \frac{1}{(p-1)^2}\right) \approx 0.6601618,$$

for twin primes, with the general k-tuple density governed by the singular series 𝔖(d) = 2C₂ ∏_{p|d, p>2} (p−1)/(p−2) for a gap d (so cousins, d=4, share the twin constant, while sexy primes, d=6, get an extra factor of 2). As the viewer sweeps x, the visualization counts the twin pairs actually present and overlays the HL prediction — and the two track each other with startling fidelity (actual counts from OEIS A007508 / Nicely; predictions from Sebah & Gourdon):

| x | π₂(x) actual | HL prediction 2C₂·Li₂(x) | relative error |
|------|------|------|------|
| 10⁶ | 8,169 | 8,248 | +0.97% |
| 10⁹ | 3,424,506 | 3,425,308 | +0.023% |
| 10¹² | 1,870,585,220 | 1,870,559,867 | −0.0013% |
| 10¹⁵ | 1,177,209,242,304 | 1,177,208,491,861 | −0.000064% |

At 10¹⁵ the conjecture misses by roughly 750,000 pairs out of 1.177 *trillion* — a relative error of six parts in ten million. The discrepancy is empirically of order √π₂(x). It is worth stating plainly: this is a *conjecture*, unproven, even as Zhang, Maynard, and Polymath have driven the bounded-gap frontier from 70 million down to 246.

---

## The deepest hook: GUE and Montgomery pair correlation

If the explicit formula shows that zeros *control* primes, this layer shows what controls the *zeros* — and it is the same law that governs the energy levels of heavy nuclei and chaotic quantum systems.

**Montgomery (1973):** normalize the zero ordinates to unit mean spacing; then the pair correlation of the zeros tends to

$$1 - \left(\frac{\sin \pi u}{\pi u}\right)^2,$$

the exact two-point function of eigenvalues of the **Gaussian Unitary Ensemble** of random Hermitian matrices — the connection F. J. Dyson pointed out to Montgomery over tea. The numerics are overwhelming: Odlyzko (1987, *Math. Comp.* 48:273–308; and the AT&T Bell Labs study "The 10²⁰-th zero of the Riemann zeta function and 70 million of its neighbors") computed millions of zeros at height ~10²⁰ via the Odlyzko–Schönhage algorithm, giving strong evidence for the GUE conjecture.

**Two panels, side by side:**
1. *Zeros repel.* The nearest-neighbor spacing of the zeta zeros follows the Wigner surmise for the GUE, P(s) = (32/π²)s²e^{−4s²/π} — level repulsion, with P(s) → 0 as s → 0 — sharply unlike a Poisson process.
2. *Primes do the opposite.* The normalized prime gaps (gap/log p) are conjectured — via Cramér's probabilistic model — to behave like a **Poisson** process: no repulsion, exponential spacings, record maximal gaps obeying a Gumbel limit law. The extremes anchor the panel: the strongest known lower bound on large gaps is Ford, Green, Konyagin, Maynard & Tao, "Long gaps between primes" (arXiv:1412.5029, 2014), settling an ~80-year Erdős conjecture; and the record merit gap is 8350 following an 87-digit prime, merit M = 41.94, found by the Gapcoin network (Dec 2017) — the first known prime gap with merit exceeding 40.

The juxtaposition is the intellectual payoff of the whole project: the primes are "random" (Poisson gaps), but the zeros that encode them are "rigid" (GUE repulsion). Two faces of the same object, obeying opposite statistics.

---

## One earned bonus layer: Li(x) vs π(x) and Skewes

Among the candidate extras (Ulam spiral, Sato–Tate, prime-number-theorem error term), one genuinely earns its place: the **Li(x) − π(x) race**. Gauss believed Li(x) > π(x) always; Littlewood (1914) proved the difference changes sign infinitely often, though the first crossover — the **Skewes number** — is astronomically large. It is unconditionally proven *not* to occur below 10¹⁴ (Kotnik, 2008); the best known upper bound is x < 1.39822×10³¹⁶ (≈ e^{727.95}), from Bays & Hudson (2000). Rendered as a slow race that *appears* forever won by Li(x), with a HUD annotation that it must eventually lose, it teaches the single most important lesson in the subject: **numerical evidence is not proof.** It also closes the loop with the explicit formula, since Li(x^ρ) is exactly the oscillatory correction that will, eventually, overturn the lead. The Ulam spiral is offered only as an optional FAR-zoom skin (it is visually redundant with the residue-class galaxy); Sato–Tate and others are deliberately excluded as feature bloat.

---

## How the mathematics maps onto the architecture

| Mathematical layer | Zoom tier | Rendering |
|------|------|------|
| Helix + PNT density | all | instanced points on log-z helix, additive glow |
| Residue classes, Dirichlet equidistribution, totient spokes | FAR / MID | amber-family per-class color, arm annotations |
| Explicit formula ψ(x) / π(x) from zeros | dedicated glass overlay | animated glowing curve, zero-count slider, smoothing toggle |
| Chebyshev prime race | MID | dual runners + live Δ(x) plot |
| Hardy–Littlewood twin/k-tuple | NEAR | glowing graph edges + live count-vs-conjecture chart |
| GUE pair correlation vs Poisson gaps | dedicated glass overlay | dual histogram panels |
| Li(x) − π(x) / Skewes | overlay | slow race with HUD caveat |

## Technology

**Data layer (Python):** NumPy segmented sieve for ~10⁶ primes; SymPy for totients/primality checks; pandas for residue and k-tuple tables; Numba JIT for the explicit-formula partial sums; mpmath + Odlyzko/LMFDB tables for zeta zeros; orjson for compact export to the browser.

**Render layer (Three.js + WebGL):**
- Instanced `BufferGeometry` point clouds; custom GLSL shaders for residue coloring, per-point glow falloff, and twinkle.
- `EffectComposer` post-processing: **selective bloom** on the primes only (a layers-based pass, so HUD text stays crisp and un-bloomed), plus subtle edge-only chromatic aberration.
- **GSAP** for all camera and UI motion (eased fly-through, zoom-tier dives, panel transitions, reticle springs).
- Frosted-glass HUD via CSS `backdrop-filter` (capped at 3 concurrent panels), corner-bracket frames, monospace instrumentation.
- LOD system for far-zoom point reduction; `prefers-reduced-motion` honored throughout.

**Delivery.** Built with Vite; deployed as a standalone web app (Vercel/Netlify) at its own URL — a shareable flagship, not a sandboxed embed. Public GitHub repo with the mathematics documented as first-class.

**Aesthetic (one line):** dark-space void, gold primes, luminous galaxy core, restrained Palantir-HUD instrumentation — cinematic, minimal, precise.

## Scope and targets

- **~1,000,000 primes** in the FAR galaxy, locked **60 fps** with selective bloom and glow.
- **First 10,000–100,000 zeta zeros** shipped; explicit-formula animation targeting convincing convergence for x up to ~10⁴.
- **≤ 3 concurrent glass panels**; no full WebGL refraction; LOD before dimming.
- Every claim labeled **theorem**, **conjecture**, or **heuristic**. The Riemann Hypothesis, the twin-prime and k-tuple conjectures, GRH+GSH, Montgomery/GUE, and Cramér's model are all conjectural scaffolding — and the project says so, on screen.

## Why it matters

Most prime visualizations stop at the pretty spiral. `Prime Constellation` uses the spiral as a doorway into the explicit formula — the place where the discrete primes and the continuous zeros become two descriptions of one object — and lets a viewer *fly through* that duality: watch the zeros build the staircase, watch the primes race, watch the twin-prime conjecture hold to a millionth of a percent, and watch the zeros repel like quantum energy levels while the primes scatter like Poisson noise. It is a love letter to analytic number theory, rendered at sixty frames per second — in a dark, luminous, cinematic space that treats both the mathematics and the eye with respect.
