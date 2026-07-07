import { Builder, By, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

describe('Học chép chính tả Dictation - E2E Test bằng Selenium', () => {
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

    await driver.wait(until.elementLocated(By.className('header-user-btn')), 15000)
  }

  it('đăng nhập, truy cập danh sách bài học và hoàn thành bài học chính tả bằng gợi ý', async () => {
    try {
      await login()

      // 1. Chuyển hướng sang trang danh sách bài học bằng cách click link trên Header
      const lessonsLink = await driver.wait(
        until.elementLocated(By.css('a[href="/lessons"]')),
        10000
      )
      await lessonsLink.click()

      // 2. Chờ danh sách bài học xuất hiện và click vào bài học đầu tiên
      const lessonCard = await driver.wait(
        until.elementLocated(By.className('lesson-card')),
        10000
      )
      await lessonCard.click()

      // 3. Chờ modal chọn chế độ xuất hiện và click vào chế độ Dictation
      const dictationModeBtn = await driver.wait(
        until.elementLocated(
          By.xpath("//button[contains(@class, 'mode-select-card') and .//h4[contains(text(), 'Dictation')]]")
        ),
        10000
      )
      await dictationModeBtn.click()

      // 4. Chờ chuyển hướng sang trang học chính tả
      await driver.wait(until.urlContains('/lessons/dictation/'), 10000)

      // 5. Duyệt qua toàn bộ các segment và hoàn thành chép chính tả
      let completed = false
      const maxSegments = 25 // Tăng giới hạn an toàn để tránh vòng lặp vô hạn

      for (let step = 0; step < maxSegments; step++) {
        // Chờ cho loading zone biến mất (nếu có)
        try {
          await driver.wait(async () => {
            const spinners = await driver.findElements(By.className('dictation-spinner'))
            return spinners.length === 0
          }, 8000)
        } catch (e) {
          // Bỏ qua nếu chờ bị lỗi
        }

        // Kiểm tra xem màn hình hoàn thành đã hiển thị chưa
        const completionScreens = await driver.findElements(By.className('dictation-completion-screen'))
        if (completionScreens.length > 0) {
          completed = true
          break
        }

        // Click nút "Hiển thị tất cả" (Show All) để tiết lộ transcript
        const showAllBtn = await driver.wait(
          until.elementLocated(By.className('btn-outline-showall')),
          5000
        )
        await driver.executeScript('arguments[0].click();', showAllBtn)

        // Chờ nút "Tiếp tục" (Next) chuyển sang trạng thái sẵn sàng (active)
        const nextBtn = await driver.wait(
          until.elementLocated(By.className('btn-primary-next')),
          5000
        )
        await driver.wait(async () => {
          const cls = await nextBtn.getAttribute('class')
          return cls.includes('active')
        }, 5000)

        // Click nút "Tiếp tục" để chuyển sang segment tiếp theo
        await driver.executeScript('arguments[0].click();', nextBtn)
        
        // Chờ cho đến khi chuyển sang segment mới (nút Next mất class active) hoặc xuất hiện màn hình hoàn thành
        await driver.wait(async () => {
          const screens = await driver.findElements(By.className('dictation-completion-screen'))
          if (screens.length > 0) return true

          // Lấy lại phần tử nextBtn mới (tránh StaleElementReferenceException nếu React hủy phần tử cũ)
          try {
            const currentNextBtn = await driver.findElement(By.className('btn-primary-next'))
            const cls = await currentNextBtn.getAttribute('class')
            return !cls.includes('active')
          } catch (e) {
            // Nếu không tìm thấy nút Next hoặc phần tử bị stale, có thể trang đang render lại hoặc đã hoàn thành
            return true
          }
        }, 10000)
      }

      expect(completed).toBe(true)
    } catch (err) {
      const currentUrl = await driver.getCurrentUrl()
      console.log('--- E2E Debug: Dictation failed at URL =', currentUrl)
      try {
        const pageSource = await driver.getPageSource()
        console.log('--- PAGE SOURCE HTML ---')
        console.log(pageSource)
        console.log('------------------------')
      } catch (e) {
        console.log('Không thể lấy page source:', e.message)
      }
      const logs = await driver.manage().logs().get('browser')
      console.log('--- BROWSER CONSOLE LOGS ---')
      logs.forEach(log => console.log(log.message))
      console.log('----------------------------')
      throw err
    }
  })
})
