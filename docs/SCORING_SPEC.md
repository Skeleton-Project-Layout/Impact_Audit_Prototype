# Scoring Engine & ACS Specification — Abhisaran Platform

## 1. Mathematical Principles & Pure Function Architecture

The **Abhisaran Continuity Score (ACS)** is calculated by a pure, deterministic Java class (`ScoringEngine`).
- **Purity Guarantee**: `ScoringEngine.evaluate(AssessmentInput)` contains zero references to Spring beans, database connections, system clocks, randomness, or network calls. Given identical inputs, it produces bit-for-bit identical outputs 1,000 out of 1,000 times.
- **Scale**: Continuous score between $0.00$ and $100.00$.
- **Precision**: Stored to 2 decimal places; displayed as round-half-up integer for headlines (e.g., 85), and 1 decimal place in drill-downs (e.g., 84.6).

---

## 2. Rubric Evaluators (Raw Point Calculation)

Each scored question maps field answers to raw points: $\text{earned} \in [0, \text{max}]$.

| Rubric Type | Input Parameters | Formula & Evaluation Logic | Worked Example |
|-------------|------------------|----------------------------|----------------|
| `GRID_AFU` | Rows $R$, `score_used: boolean` | For each row $r \in R$:<br>• Available: $+1$ pt.<br>• Functional: $+1$ pt (**only if Available is true**).<br>• Used: $+1$ pt (**only if `score_used = true`**).<br>Row max is 2 (or 3 if `score_used = true`). | Water row: Available = true, Functional = false.<br>Earned = 1, Max = 2 ($50\%$). |
| `CHECKLIST_YNP` | Items $I$ | For each item $i \in I$:<br>• Yes: $1.0$ pt, max $1.0$.<br>• Partial: $0.5$ pt, max $1.0$.<br>• No: $0.0$ pt, max $1.0$.<br>• N/A: Excluded (earned $0$, max $0$). | 4 items: 2 Yes, 1 Partial, 1 No.<br>Earned = $1 + 1 + 0.5 + 0 = 2.5$, Max = 4.0 ($62.5\%$). |
| `YESNO` / `YESNO_WITH_COUNT` | `polarity: POSITIVE\|NEGATIVE`, `count: int` | Positive polarity:<br>• Yes: $1.0$ pt (or $0.5$ if count exists and count $= 0$).<br>• No: $0.0$ pt.<br>Max $= 1.0$. | Counselling available (Yes) but 0 students served.<br>Earned = 0.5, Max = 1.0 ($50\%$). |
| `RATING_1_5` | `rating: 1..5`, `max_pts: float` | $$\text{earned} = \left(\frac{\text{rating} - 1}{4}\right) \times \text{max\_pts}$$<br>Rating 1 = 0%, Rating 2 = 25%, Rating 3 = 50%, Rating 4 = 75%, Rating 5 = 100%. | Observation rating = 2, max = 4.0.<br>Earned = $\frac{1}{4} \times 4.0 = 1.0$ ($25\%$, flagged Red). |
| `PERCENT_THRESHOLD(T)` | Threshold $T$, `partial_margin` (default 10), `inverted: boolean` | Standard (attendance $\ge T$):<br>• $v \ge T \implies 1.0 \times \text{max}$<br>• $T - \text{margin} \le v < T \implies 0.5 \times \text{max}$<br>• $v < T - \text{margin} \implies 0.0$<br>Inverted (mismatch $\le T$):<br>• $v \le T \implies 1.0 \times \text{max}$<br>• $T < v \le T + \text{margin} \implies 0.5 \times \text{max}$<br>• $v > T + \text{margin} \implies 0.0$ | Average attendance $= 68\%$, $T = 75\%$, margin $= 10\%$.<br>Since $65 \le 68 < 75$, Earned = $0.5 \times \text{max}$. |
| `RATIO` | `num: float`, `denom: float`, `max_pts: float` | • If $\text{denom} \le 0 \implies \text{Not Assessed}$.<br>• $\text{earned} = \text{max\_pts} \times \min\left(1.0, \frac{\text{num}}{\text{denom}}\right)$ | Teachers: 8 working, 10 sanctioned, max = 5.0.<br>Earned = $5.0 \times \frac{8}{10} = 4.0$. |
| `NONE` | None | Informational question. Not scored. Excluded from calculation. | General context question (C01). Earned = 0, Max = 0. |

---

## 3. Severity Weighting & Multi-Page Pooling

Each question version defines a severity tier mapping to an immutable weight:
$$\text{Weight}(\text{Critical}) = 3, \quad \text{Weight}(\text{High}) = 2, \quad \text{Weight}(\text{Medium}) = 1$$

For each question instance $i$ evaluated on audit page $p$:
$$\text{earned\_w}_{p,i} = \text{raw\_earned}_{p,i} \times \text{weight}_i$$
$$\text{max\_w}_{p,i} = \text{raw\_max}_{p,i} \times \text{weight}_i$$

### Pooling Formula
Across all submitted audit pages $P$ belonging to the location, pooling all applicable and assessed question instances:
$$\text{ACS} = \left(\frac{\sum_{p \in P} \sum_{i} \text{earned\_w}_{p,i}}{\sum_{p \in P} \sum_{i} \text{max\_w}_{p,i}}\right) \times 100$$

---

## 4. The Deduction Ledger (Mathematical Proof)

For every evaluated instance $(p, i)$, the weighted point loss is:
$$\text{lost\_w}_{p,i} = \text{max\_w}_{p,i} - \text{earned\_w}_{p,i}$$

Its exact contribution to the total points deducted from 100 is:
$$\text{loss\_contribution}_{p,i} = \left(\frac{\text{lost\_w}_{p,i}}{\sum_{p,i} \text{max\_w}_{p,i}}\right) \times 100$$

### Proof of Balancing
$$\sum_{p,i} \text{loss\_contribution}_{p,i} = \sum_{p,i} \left(\frac{\text{max\_w}_{p,i} - \text{earned\_w}_{p,i}}{\sum_{p,i} \text{max\_w}_{p,i}} \times 100\right)$$
$$= \frac{\sum \text{max\_w} - \sum \text{earned\_w}}{\sum \text{max\_w}} \times 100 = \left(1 - \frac{\sum \text{earned\_w}}{\sum \text{max\_w}}\right) \times 100 = 100 - \text{ACS}$$

$$\therefore \sum \text{Ledger Contributions} \equiv 100 - \text{ACS}$$

**Mandatory Assertion**: Every test suite execution asserts that the sum of all rows in `analysis_ledger` equals `100.00 - ACS` within a floating point tolerance of $< 0.001$.

---

## 5. Coverage & Special Conditions

### 5.1 Question Exclusion Rules
1. **Not Applicable (N/A)**:
   - Question is marked N/A with a mandatory reason.
   - Removed from both numerator ($\sum \text{earned\_w}$) and denominator ($\sum \text{max\_w}$).
   - Does **not** lower the coverage percentage.
2. **Could Not Be Assessed (CNA)** / **Unanswered**:
   - Question could not be verified in the field (mandatory reason).
   - Removed from numerator and denominator of the score.
   - **Lowers coverage percentage**.

### 5.2 Coverage Calculation
$$\text{Coverage} = \left(\frac{\text{Count of Assessed Scored Questions}}{\text{Count of Applicable Scored Questions}}\right) \times 100$$

- If $\text{Coverage} < 70.0\%$ (`min_coverage`), the resulting ACS is prominently badged as **PROVISIONAL**.
- If zero scored questions are assessed, $\text{ACS} = \text{null}$, rendered as `"Not calculable"`. The system never outputs a synthetic 0.

---

## 6. Alert Spectrum & Critical Rules

### 6.1 Cut-off Bands
Both the overall location ACS and individual question instance scores ($\frac{\text{earned}}{\text{max}}$) map to alert bands:

| Band Identifier | Score Range | Visual Display | Standard Interpretation |
|-----------------|-------------|----------------|-------------------------|
| `RED` | $0.00 - 39.99$ | Crimson (`#b3261e`) | Needs immediate attention |
| `ORANGE` | $40.00 - 54.99$ | Deep Amber (`#e65100`) | Critical gaps |
| `AMBER` | $55.00 - 69.99$ | Warm Yellow (`#f57f17`) | Needs improvement |
| `LIGHT_GREEN` | $70.00 - 89.99$ | Sage Green (`#43a047`) | Good — a few things are off |
| `DARK_GREEN` | $90.00 - 100.00$ | Deep Emerald (`#17703f`) | All good |

### 6.2 The Critical Severity Override
**Rule**: If any question has $\text{Severity} = \text{CRITICAL}$ and its ratio satisfies:
$$\frac{\text{earned}}{\text{max}} < 0.50$$
Then that individual question instance is **unconditionally classified as RED**, regardless of standard band thresholds.

---

## 7. Canonical Worked Example (Unit Test Baseline)

### Location Scenario: 4-Page Pooled Audit
- Total possible weighted points across all 4 pages: $\sum \text{max\_w} = 100.0$
- Weighted deductions across instances:
  - Page 1, Question S11 (Critical, weight 3): Drinking water non-functional ($1/2$ points). Lost weighted points $= 0.5 \times 2 \times 3 = 3.0$
  - Page 2, Question S04 (High, weight 2): Attendance $68\%$ ($50\%$ points). Lost weighted points $= 0.5 \times 1 \times 2 = 1.0$
  - Page 3, Question S06 (Critical, weight 3): FLN benchmark unmet ($0\%$ points). Lost weighted points $= 1.0 \times 1 \times 3 = 3.0$
  - Page 4, Question S12 (Critical, weight 3): Fire extinguisher inspection overdue ($0\%$ points). Lost weighted points $= 1.0 \times 1 \times 3 = 3.0$
- Total lost weighted points: $3.0 + 1.0 + 3.0 + 3.0 = 10.0$
- Total earned weighted points: $100.0 - 10.0 = 90.0$

### Results
- $\text{ACS} = \frac{90.0}{100.0} \times 100 = \mathbf{90.00}$ (Band: `DARK_GREEN`).
- Deduction Ledger:
  1. `S11` (Page 1): Lost $3.0$ weighted pts $\implies \mathbf{-3.00}$ ACS pts.
  2. `S06` (Page 3): Lost $3.0$ weighted pts $\implies \mathbf{-3.00}$ ACS pts.
  3. `S12` (Page 4): Lost $3.0$ weighted pts $\implies \mathbf{-3.00}$ ACS pts.
  4. `S04` (Page 2): Lost $1.0$ weighted pts $\implies \mathbf{-1.00}$ ACS pts.
- $\sum \text{Deduction Ledger} = 3.00 + 3.00 + 3.00 + 1.00 = \mathbf{10.00} \equiv 100.00 - 90.00$.
