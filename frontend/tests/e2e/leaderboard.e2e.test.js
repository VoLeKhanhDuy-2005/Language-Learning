import { Builder, By, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

describe('Bảng xếp hạng - E2E Test bằng Selenium', () => {
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

  it('đăng nhập thành công và xem được bảng xếp hạng', async () => {
    await login()
    
    // Tìm liên kết Leaderboard trong navigation bar của Header và click
    const leaderboardLink = await driver.wait(
      until.elementLocated(By.css('a[href="/leaderboard"]')),
      10000
    )
    await leaderboardLink.click()

    // Chờ chuyển hướng sang trang leaderboard
    await driver.wait(until.urlContains('/leaderboard'), 10000)
    const currentUrl = await driver.getCurrentUrl()
    expect(currentUrl).toContain('/leaderboard')

    // Xác minh sự tồn tại của tiêu đề Bảng xếp hạng hoặc Leaderboard
    const titleElement = await driver.wait(
      until.elementLocated(By.className('leaderboard-title')),
      10000
    )
    const titleText = await titleElement.getText()
    expect(titleText).toBeTruthy()

    // Xác minh card hiển thị thứ hạng của chính người dùng đăng nhập
    const myRankCard = await driver.wait(
      until.elementLocated(By.className('my-rank-card')),
      15000
    )
    expect(myRankCard).toBeTruthy()

    // Kiểm tra xem tên của Test E2E User có hiển thị trong my-rank-card hay không (qua avatar alt hoặc text)
    const avatarImg = await myRankCard.findElement(By.className('my-rank-avatar-placeholder'))
    const avatarText = await avatarImg.getText()
    // Tên 'Test E2E User' -> initials là 'T'
    expect(avatarText).toBe('T')
  })
})
