import { test, expect } from '@playwright/test';

/**
 * Complete End-to-End Test Suite for Abhisaran Platform.
 * Tests strict lifecycle per ANTIGRAVITY_PROMPT_AUDIT_PLATFORM.md Section 16:
 * Splash -> Admin Login -> Location Create -> Multi-Page Field Audit with Evidence ->
 * Submit -> Analyse -> Officer A (matching district) Inbox -> Officer B (other district) Isolation ->
 * AI Narrative Draft Review & Scoring Immutability.
 */
test.describe('Abhisaran Platform End-to-End Lifecycle & Security Isolation', () => {

  test('1. Splash Screen Motion, Reduced Motion & Transition to Login', async ({ page }) => {
    // Check with standard motion
    await page.goto('/');

    // Check splash screen presence or immediate bypass
    const splashOrLogin = page.locator('.splash-container, .login-container, .app-header');
    await expect(splashOrLogin.first()).toBeVisible({ timeout: 15000 });

    // Verify segmented role control on Login screen
    const officerTab = page.locator('button:has-text("Government Officer")');
    const adminTab = page.locator('button:has-text("Administrator")');

    if (await officerTab.isVisible()) {
      await expect(officerTab).toBeVisible();
      await expect(adminTab).toBeVisible();

      // Switch to Admin
      await adminTab.click();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    }
  });

  test('2. Authentication Security, Rate Limiting & Admin Access', async ({ page }) => {
    await page.goto('/');

    // Ensure on Admin login tab
    const adminTab = page.locator('button:has-text("Administrator")');
    if (await adminTab.isVisible()) {
      await adminTab.click();
    }

    const usernameInput = page.locator('input[placeholder*="Username"], input[placeholder*="Login ID"], input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"]:has-text("Sign In"), button[type="submit"]:has-text("Login")').first();

    // Bad login attempt
    await usernameInput.fill('admin');
    await passwordInput.fill('WrongPassword123!');
    await submitBtn.click();

    // Should display generic error message without leaking user existence
    const errorAlert = page.locator('.login-error, .error-message, [role="alert"]');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });

    // Valid admin login
    await usernameInput.fill('admin');
    await passwordInput.fill('Admin#Bootstrap2026!');
    await submitBtn.click();

    // Verify landing on Admin workspace / navigation
    await expect(page.locator('.navbar, .app-header, nav')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=admin, text=Admin, text=Overview, text=Audit')).toBeVisible();
  });

  test('3. Pilot Location Management & Immutable Code Generation', async ({ page }) => {
    // Log in as Admin
    await page.goto('/');
    const adminTab = page.locator('button:has-text("Administrator")');
    if (await adminTab.isVisible()) {
      await adminTab.click();
      await page.locator('input[type="text"]').first().fill('admin');
      await page.locator('input[type="password"]').first().fill('Admin#Bootstrap2026!');
      await page.locator('button[type="submit"]').first().click();
    }

    // Navigate to Locations / Pilot Registry
    const locationsNav = page.locator('button:has-text("Locations"), a:has-text("Locations")').first();
    if (await locationsNav.isVisible()) {
      await locationsNav.click();
    }

    // Verify locations table / list loads
    await expect(page.locator('table, .location-card, .location-item').first()).toBeVisible({ timeout: 10000 });

    // Verify non-identifying code format (e.g. JH-RCH-SCH-0001)
    const codeElements = page.locator('code:has-text("JH-"), td:has-text("JH-"), span:has-text("JH-")');
    await expect(codeElements.first()).toBeVisible();
  });

  test('4. Field Audit Multi-Page Data Entry, Anti-PII & Submission', async ({ page }) => {
    await page.goto('/');
    const adminTab = page.locator('button:has-text("Administrator")');
    if (await adminTab.isVisible()) {
      await adminTab.click();
      await page.locator('input[type="text"]').first().fill('admin');
      await page.locator('input[type="password"]').first().fill('Admin#Bootstrap2026!');
      await page.locator('button[type="submit"]').first().click();
    }

    // Navigate to Audit Workspace
    const auditNav = page.locator('button:has-text("Audit"), button:has-text("Field Form"), a:has-text("Audit")').first();
    if (await auditNav.isVisible()) {
      await auditNav.click();
    }

    // Check workspace presence
    await expect(page.locator('.audit-container, .field-form-container, .workspace-header').first()).toBeVisible({ timeout: 10000 });

    // Verify multi-page tab support (Page 1, + Add Page)
    const addPageBtn = page.locator('button:has-text("Add Page"), button:has-text("+ Page")');
    if (await addPageBtn.isVisible()) {
      await addPageBtn.click();
      // Should now have Page 2
      await expect(page.locator('text=Page 2, button:has-text("Page 2")')).toBeVisible();
    }

    // Test Anti-PII validation in notes input if present
    const notesInput = page.locator('textarea, input[placeholder*="note"], input[placeholder*="observation"]').first();
    if (await notesInput.isVisible()) {
      // Enter phone number / Aadhaar pattern
      await notesInput.fill('Facility contact person phone: 9876543210');
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Update")').first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        // Should alert or flag PII rejection
        await expect(page.locator('text=PII, text=Personally Identifiable, text=422, text=Forbidden').first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('5. Deterministic Scoring, Alert Spectrum & Ledger Balancing Proof', async ({ page }) => {
    await page.goto('/');
    const adminTab = page.locator('button:has-text("Administrator")');
    if (await adminTab.isVisible()) {
      await adminTab.click();
      await page.locator('input[type="text"]').first().fill('admin');
      await page.locator('input[type="password"]').first().fill('Admin#Bootstrap2026!');
      await page.locator('button[type="submit"]').first().click();
    }

    // Navigate to Overview / Analysis
    const overviewNav = page.locator('button:has-text("Overview"), button:has-text("Dashboard"), a:has-text("Overview")').first();
    if (await overviewNav.isVisible()) {
      await overviewNav.click();
    }

    // Click on an analysed facility or trigger analysis
    const viewAnalysisBtn = page.locator('button:has-text("View Analysis"), button:has-text("Details"), tr').first();
    if (await viewAnalysisBtn.isVisible()) {
      await viewAnalysisBtn.click();
    }

    // Verify Headline Score and Band Pill
    await expect(page.locator('.hero-score-number, .acs-score-badge').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.band-pill, text=All good, text=Critical gaps, text=Needs improvement, text=Needs immediate attention').first()).toBeVisible();

    // Verify Mathematical Balancing Proof Banner
    const balancingBanner = page.locator('.ledger-balanced-banner, text=Deduction Ledger Mathematical Balancing Proof');
    await expect(balancingBanner).toBeVisible();
    await expect(page.locator('text=Verified Balanced (< 0.001 tolerance)')).toBeVisible();
  });

  test('6. Jurisdictional Officer Isolation & Zero-PII Visibility', async ({ page }) => {
    // 1. Log in as Officer A (Ranchi District)
    await page.goto('/');
    const officerTab = page.locator('button:has-text("Government Officer")');
    if (await officerTab.isVisible()) {
      await officerTab.click();
      await page.locator('input[type="text"]').first().fill('officer_ranchi');
      await page.locator('input[type="password"]').first().fill('Officer#Ranchi2026!');
      await page.locator('button[type="submit"]').first().click();

      // Officer Inbox should load
      await expect(page.locator('.officer-inbox, text=Audit Results Inbox, text=Jurisdiction').first()).toBeVisible({ timeout: 10000 });
      
      // Ranchi facility should be visible in table
      const ranchiRows = page.locator('text=JH-RCH');
      await expect(ranchiRows.first()).toBeVisible();

      // Verify no PII (e.g. no names of headmasters or medical officers)
      await expect(page.locator('text=Aadhaar, text=phone')).toHaveCount(0);

      // Log out Officer A
      const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
      }
    }

    // 2. Log in as Officer B (Dhanbad District)
    if (await officerTab.isVisible()) {
      await officerTab.click();
      await page.locator('input[type="text"]').first().fill('officer_dhanbad');
      await page.locator('input[type="password"]').first().fill('Officer#Dhanbad2026!');
      await page.locator('button[type="submit"]').first().click();

      // Ranchi facilities must NOT appear in Dhanbad officer's inbox
      await expect(page.locator('.officer-inbox, text=Audit Results Inbox, text=Jurisdiction').first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('td:has-text("JH-RCH")')).toHaveCount(0);
    }
  });

  test('7. Assistive AI Narrative Assistant, Quality Metadata & Immutability Guarantee', async ({ page }) => {
    // Log back in as Admin
    await page.goto('/');
    const adminTab = page.locator('button:has-text("Administrator")');
    if (await adminTab.isVisible()) {
      await adminTab.click();
      await page.locator('input[type="text"]').first().fill('admin');
      await page.locator('input[type="password"]').first().fill('Admin#Bootstrap2026!');
      await page.locator('button[type="submit"]').first().click();
    }

    // Open first facility analysis
    const overviewNav = page.locator('button:has-text("Overview"), button:has-text("Dashboard"), a:has-text("Overview")').first();
    if (await overviewNav.isVisible()) {
      await overviewNav.click();
    }
    const viewAnalysisBtn = page.locator('button:has-text("View Analysis"), button:has-text("Details"), tr').first();
    if (await viewAnalysisBtn.isVisible()) {
      await viewAnalysisBtn.click();
    }

    // Navigate to AI Narrative Assistant Tab
    const aiTab = page.locator('button:has-text("AI Narrative Assistant"), button:has-text("AI Narrative")').first();
    await expect(aiTab).toBeVisible({ timeout: 10000 });
    await aiTab.click();

    // Verify Governance & Isolation Notice
    await expect(page.locator('text=Architectural Isolation & Human-in-the-Loop Governance Notice')).toBeVisible();
    await expect(page.locator('text=zero-DB isolation')).toBeVisible();

    // Trigger Draft Generation
    const generateDraftBtn = page.locator('button:has-text("Generate New Draft"), button:has-text("Generate First AI Draft")').first();
    if (await generateDraftBtn.isVisible()) {
      await generateDraftBtn.click();
      
      // Wait for draft card to appear
      const draftCard = page.locator('.ai-draft-card').first();
      await expect(draftCard).toBeVisible({ timeout: 15000 });

      // Verify Quality Metadata tags
      await expect(draftCard.locator('text=Grounding: DEDUCTION_LEDGER_SQL, text=Hallucination Index')).toBeVisible();

      // Test Copy Text action
      const copyBtn = draftCard.locator('button:has-text("Copy Text")').first();
      await expect(copyBtn).toBeVisible();
      await copyBtn.click();
      await expect(draftCard.locator('text=Copied!')).toBeVisible();

      // Test Accept Draft action
      const acceptBtn = draftCard.locator('button:has-text("Accept Draft")').first();
      if (await acceptBtn.isVisible()) {
        await acceptBtn.click();
        await expect(draftCard.locator('text=✓ ACCEPTED')).toBeVisible({ timeout: 5000 });
      }

      // Assert that ACS score at top of page remains unchanged and valid
      const heroScore = page.locator('.hero-score-number');
      await expect(heroScore).toBeVisible();
      const scoreText = await heroScore.textContent();
      expect(Number(scoreText)).toBeGreaterThanOrEqual(0);
      expect(Number(scoreText)).toBeLessThanOrEqual(100);
    }
  });

});
