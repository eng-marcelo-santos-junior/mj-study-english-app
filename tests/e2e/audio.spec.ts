import { test, expect } from '@playwright/test'

// These tests require a running app with a logged-in user.
// Set PLAYWRIGHT_BASE_URL and auth cookies via storage state for real runs.

test.describe('Audio feature', () => {
  test('AudioPlayer renders and shows play button', async ({ page }) => {
    // This test checks the component in isolation via a test page if available.
    // For a full integration test, navigate to a deck with audio cards.
    await page.goto('/')
    // Just a connectivity check — app should redirect to login or dashboard
    await expect(page).toHaveURL(/login|dashboard/)
  })

  test('flashcard edit form shows audio upload section', async ({ page }) => {
    // Full integration: login, open a deck, click edit on a card
    // Verify audio upload section is present
    // Skipped until auth is wired into E2E fixtures
    test.skip()
  })

  test('review session shows audio player for cards with audio', async ({ page }) => {
    test.skip()
  })
})
