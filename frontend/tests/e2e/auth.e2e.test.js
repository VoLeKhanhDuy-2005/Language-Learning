import { Builder, By, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

describe('Đăng nhập - E2E Test bằng Selenium', () => {
  let driver

  beforeAll(async () => {
    const options = new chrome.Options()
    options.addArguments('--headless=new') // Chạy ẩn danh không mở cửa sổ GUI
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

  it('hiển thị thông báo lỗi khi nhập thông tin đăng nhập không chính xác', async () => {
    await driver.get('http://localhost:4173/login')

    // Chờ ô input email hiển thị
    const emailInput = await driver.wait(
      until.elementLocated(By.id('email')),
      10000
    )
    const passwordInput = await driver.findElement(By.id('password'))
    const submitBtn = await driver.findElement(By.className('login-submit-btn'))

    // Nhập thông tin tài khoản sai
    await emailInput.sendKeys('invalid-user@example.com')
    await passwordInput.sendKeys('wrongpassword')
    await submitBtn.click()

    // Chờ thông báo lỗi hiển thị
    const errorBanner = await driver.wait(
      until.elementLocated(By.className('login-error-message')),
      10000
    )
    const errorText = await errorBanner.getText()

    // Xác nhận có thông báo lỗi hiển thị
    expect(errorText).toBeTruthy()
    expect(errorText.length).toBeGreaterThan(0)
  })

  it('đăng nhập thành công với tài khoản test', async () => {
    await driver.get('http://localhost:4173/login')

    const emailInput = await driver.wait(
      until.elementLocated(By.id('email')),
      10000
    )
    const passwordInput = await driver.findElement(By.id('password'))
    const submitBtn = await driver.findElement(By.className('login-submit-btn'))

    await emailInput.sendKeys('test_e2e_user@example.com')
    await passwordInput.sendKeys('123456')
    await submitBtn.click()

    try {
      await driver.wait(until.elementLocated(By.className('header-user-btn')), 15000)
      const isLogged = await driver.findElement(By.className('header-user-btn')).isDisplayed()
      expect(isLogged).toBe(true)
    } catch (err) {
      const logs = await driver.manage().logs().get('browser')
      console.log('--- BROWSER CONSOLE LOGS ---')
      logs.forEach(log => console.log(log.message))
      console.log('----------------------------')
      throw err
    }
  })

  it('chuyển hướng sang trang đăng ký khi nhấp vào liên kết Đăng ký ngay', async () => {
    await driver.get('http://localhost:4173/login')

    const registerLink = await driver.wait(
      until.elementLocated(By.className('register-link')),
      10000
    )
    await registerLink.click()

    // Chờ URL thay đổi sang trang signup
    await driver.wait(until.urlContains('/signup'), 10000)
    const currentUrl = await driver.getCurrentUrl()
    expect(currentUrl).toContain('/signup')
  })
})
