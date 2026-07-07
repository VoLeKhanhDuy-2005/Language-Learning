import { Builder, By, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

describe('Từ vựng & Học thẻ - E2E Test bằng Selenium', () => {
  let driver

  beforeAll(async () => {
    const options = new chrome.Options()
    options.addArguments('--headless=new')
    options.addArguments('--no-sandbox')
    options.addArguments('--disable-dev-shm-usage')
    options.addArguments('--window-size=1280,800')

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build()
  })

  afterAll(async () => {
    if (driver) {
      await driver.quit()
    }
  })

  const login = async () => {
    await driver.get('http://localhost:4173/login')
    const emailInput = await driver.wait(until.elementLocated(By.id('email')), 10000)
    const passwordInput = await driver.findElement(By.id('password'))
    const submitBtn = await driver.findElement(By.className('login-submit-btn'))

    await emailInput.sendKeys('test_e2e_user@example.com')
    await passwordInput.sendKeys('123456')
    await submitBtn.click()

    // Chờ cho đến khi đăng nhập thành công và hiển thị menu user trên header
    await driver.wait(until.elementLocated(By.className('header-user-btn')), 15000)
  }

  it('đăng nhập thành công và có thể truy cập kho từ vựng', async () => {
    await login()
    
    // Tìm liên kết Vocabulary trong navigation bar của Header và click
    const vocabLink = await driver.wait(
      until.elementLocated(By.css('a[href="/decks"]')),
      10000
    )
    await vocabLink.click()

    // Chờ chuyển hướng sang trang decks
    await driver.wait(until.urlContains('/decks'), 10000)
    const currentUrl = await driver.getCurrentUrl()
    expect(currentUrl).toContain('/decks')

    // Xác minh danh sách bộ từ vựng hiển thị
    const decksTabs = await driver.wait(
      until.elementLocated(By.className('decks-tabs-wrapper')),
      10000
    )
    expect(decksTabs).toBeTruthy()
  })
})
