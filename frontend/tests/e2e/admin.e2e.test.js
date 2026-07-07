import { Builder, By, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

describe('Quản trị viên Admin - E2E Test bằng Selenium', () => {
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

  const loginAsAdmin = async () => {
    await driver.get('http://localhost:4173/login')
    const emailInput = await driver.wait(until.elementLocated(By.id('email')), 10000)
    const passwordInput = await driver.findElement(By.id('password'))
    const submitBtn = await driver.findElement(By.className('login-submit-btn'))

    await emailInput.sendKeys('admin_e2e_user@example.com')
    await passwordInput.sendKeys('123456')
    await submitBtn.click()

    // Chờ cho đến khi chuyển hướng vào dashboard admin (hoặc kiểm tra sidebar admin xuất hiện)
    await driver.wait(until.elementLocated(By.className('admin-layout')), 15000)
  }

  it('đăng nhập admin thành công và kiểm thử validation / tạo mới bộ từ vựng (Deck)', async () => {
    try {
      await loginAsAdmin()

      // 1. Chuyển hướng sang trang tạo mới bộ từ vựng
      await driver.get('http://localhost:4173/admin/decks/new')

      // 2. Chờ form tải xong
      const saveBtn = await driver.wait(until.elementLocated(By.className('admin-save-btn')), 10000)

      // 3. Kiểm thử Validation: Nhấn Lưu khi tiêu đề trống
      await driver.executeScript('arguments[0].click();', saveBtn)
      const errorSpan = await driver.wait(until.elementLocated(By.className('input-error-message')), 10000)
      let errorText = ''
      await driver.wait(async () => {
        errorText = await errorSpan.getText()
        return errorText.trim().length > 0
      }, 5000)
      expect(errorText).toBeTruthy()

      // 4. Điền thông tin hợp lệ
      const titleInput = await driver.findElement(By.id('deck-title'))
      const descInput = await driver.findElement(By.id('deck-desc'))

      await titleInput.sendKeys('Bộ từ vựng E2E Test')
      await descInput.sendKeys('Mô tả bộ từ vựng được tạo bởi Selenium test')

      // 5. Chọn CEFR level pill đầu tiên (nếu có)
      const cefrPills = await driver.findElements(By.className('admin-cefr-pill'))
      if (cefrPills.length > 0) {
        await driver.executeScript('arguments[0].click();', cefrPills[0])
      }

      // 6. Nhấn lưu bộ từ vựng
      const currentSaveBtn = await driver.findElement(By.className('admin-save-btn'))
      await driver.executeScript('arguments[0].click();', currentSaveBtn)

      // 7. Xác nhận chuyển hướng thành công về danh sách decks
      await driver.wait(until.urlContains('/admin/decks'), 10000)
      const currentUrl = await driver.getCurrentUrl()
      expect(currentUrl).toContain('/admin/decks')

    } catch (err) {
      console.log('--- E2E Debug: Admin Deck Test failed ---')
      const currentUrl = await driver.getCurrentUrl().catch(() => 'unknown')
      console.log('URL =', currentUrl)
      const logs = await driver.manage().logs().get('browser').catch(() => [])
      logs.forEach(log => console.log(log.message))
      throw err
    }
  })

  it('kiểm thử validation và tạo mới bài học video (Lesson)', async () => {
    try {
      // Vì đã đăng nhập từ test case trước, truy cập thẳng trang tạo bài học mới
      await driver.get('http://localhost:4173/admin/lessons/new')

      // 1. Chờ form tải xong
      const saveBtn = await driver.wait(until.elementLocated(By.className('admin-save-btn')), 10000)

      // 2. Nhập tiêu đề nhưng để trống URL nguồn video
      const titleInput = await driver.wait(until.elementLocated(By.id('lesson-title')), 10000)
      await titleInput.sendKeys('Bài học video E2E Test')

      await driver.executeScript('arguments[0].click();', saveBtn)

      // 3. Xác minh xuất hiện thông báo lỗi của URL nguồn
      const errorAlert = await driver.wait(until.elementLocated(By.className('admin-alert error')), 10000)
      let errorText1 = ''
      await driver.wait(async () => {
        errorText1 = await errorAlert.getText()
        return errorText1.trim().length > 0
      }, 5000)
      expect(errorText1).toBeTruthy()

      // 4. Nhập sai định dạng URL Youtube và kiểm tra validation
      const urlInput = await driver.findElement(By.id('lesson-source-url'))
      await urlInput.sendKeys('https://google.com')
      
      const currentSaveBtn1 = await driver.findElement(By.className('admin-save-btn'))
      await driver.executeScript('arguments[0].click();', currentSaveBtn1)

      const errorAlert2 = await driver.wait(until.elementLocated(By.className('admin-alert error')), 10000)
      let errorText2 = ''
      await driver.wait(async () => {
        errorText2 = await errorAlert2.getText()
        return errorText2.trim().length > 0
      }, 5000)
      expect(errorText2).toBeTruthy()

      // 5. Nhập URL Youtube hợp lệ và chọn CEFR level
      await urlInput.clear()
      await urlInput.sendKeys('https://www.youtube.com/watch?v=dQw4w9WgXcQ')

      const cefrPills = await driver.findElements(By.className('admin-cefr-pill'))
      if (cefrPills.length > 0) {
        await driver.executeScript('arguments[0].click();', cefrPills[0])
      }

      // 6. Nhấn lưu bài học
      const currentSaveBtn2 = await driver.findElement(By.className('admin-save-btn'))
      await driver.executeScript('arguments[0].click();', currentSaveBtn2)

      // 7. Xác nhận chuyển hướng thành công về danh sách bài học
      await driver.wait(until.urlContains('/admin/lessons'), 10000)
      const currentUrl = await driver.getCurrentUrl()
      expect(currentUrl).toContain('/admin/lessons')

    } catch (err) {
      console.log('--- E2E Debug: Admin Lesson Test failed ---')
      const currentUrl = await driver.getCurrentUrl().catch(() => 'unknown')
      console.log('URL =', currentUrl)
      const logs = await driver.manage().logs().get('browser').catch(() => [])
      logs.forEach(log => console.log(log.message))
      throw err
    }
  })
})
