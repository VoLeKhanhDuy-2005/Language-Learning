import { Builder, By, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import net from 'net'

const getOtpFromRedis = (email) => {
  return new Promise((resolve, reject) => {
    const client = net.createConnection({ port: 6379, host: '127.0.0.1' }, () => {
      client.write(`*2\r\n$3\r\nGET\r\n$${`otp:verify_email:${email}`.length}\r\n${`otp:verify_email:${email}`}\r\n`)
    })
    client.on('data', (data) => {
      const response = data.toString()
      if (response.startsWith('$-1')) {
        resolve(null)
      } else {
        const parts = response.split('\r\n')
        resolve(parts[1])
      }
      client.end()
    })
    client.on('error', (err) => {
      reject(err)
    })
  })
}

describe('Đối kháng từ vựng Battle - E2E Test bằng Selenium', () => {
  let driverA
  let driverB

  beforeAll(async () => {
    const options = new chrome.Options()
    options.addArguments('--headless=new')
    options.addArguments('--no-sandbox')
    options.addArguments('--disable-dev-shm-usage')
    options.addArguments('--window-size=1280,800')

    // Khởi tạo 2 driver song song
    driverA = await new Builder().forBrowser('chrome').setChromeOptions(options).build()
    driverB = await new Builder().forBrowser('chrome').setChromeOptions(options).build()
  })

  afterAll(async () => {
    // Tắt cả hai driver
    await Promise.all([
      driverA ? driverA.quit() : Promise.resolve(),
      driverB ? driverB.quit() : Promise.resolve()
    ])
  })

  const login = async (driver, email, password) => {
    await driver.get('http://localhost:4173/login')
    const emailInput = await driver.wait(until.elementLocated(By.id('email')), 10000)
    const passwordInput = await driver.findElement(By.id('password'))
    const submitBtn = await driver.findElement(By.className('login-submit-btn'))

    await emailInput.sendKeys(email)
    await passwordInput.sendKeys(password)
    await submitBtn.click()

    await driver.wait(until.elementLocated(By.className('header-user-btn')), 15000)
  }

  const registerAndLogin = async (driver, email, password) => {
    await driver.get('http://localhost:4173/signup')
    const nameInput = await driver.wait(until.elementLocated(By.id('fullName')), 10000)
    const emailInput = await driver.findElement(By.id('email'))
    const passwordInput = await driver.findElement(By.id('password'))
    const confirmPasswordInput = await driver.findElement(By.id('confirmPassword'))
    const submitBtn = await driver.findElement(By.className('signup-submit-btn'))

    await nameInput.sendKeys('Test E2E Opponent')
    await emailInput.sendKeys(email)
    await passwordInput.sendKeys(password)
    await confirmPasswordInput.sendKeys(password)
    await submitBtn.click()

    await driver.wait(until.urlContains('/verify-email'), 10000)

    let otpCode = null
    for (let attempt = 0; attempt < 10; attempt++) {
      otpCode = await getOtpFromRedis(email)
      if (otpCode) break
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
    expect(otpCode).toBeTruthy()

    for (let i = 0; i < 6; i++) {
      const otpInput = await driver.findElement(By.id(`otp-${i}`))
      await otpInput.sendKeys(otpCode[i])
    }

    const verifySubmitBtn = await driver.findElement(By.className('verify-submit-btn'))
    await verifySubmitBtn.click()

    await driver.wait(until.urlContains('/login'), 10000)
    await login(driver, email, password)
  }

  it('giả lập hai người chơi kết nối, tạo phòng, tham gia đấu và hoàn thành trận đấu', async () => {
    try {
      // 1. Người chơi A đăng nhập tài khoản cố định
      await login(driverA, 'test_e2e_user@example.com', '123456')

      // 2. Người chơi B đăng ký tài khoản mới và đăng nhập
      const uniqueEmail = `e2e_battle_${Date.now()}@example.com`
      await registerAndLogin(driverB, uniqueEmail, 'Password123')

      // 3. Cả hai chuyển sang trang /battle
      const battleLinkA = await driverA.wait(until.elementLocated(By.css('a[href="/battle"]')), 10000)
      await battleLinkA.click()
      await driverA.wait(until.urlContains('/battle'), 10000)

      const battleLinkB = await driverB.wait(until.elementLocated(By.css('a[href="/battle"]')), 10000)
      await battleLinkB.click()
      await driverB.wait(until.urlContains('/battle'), 10000)

      // 4. Người chơi A bấm "Tạo phòng"
      const createRoomBtn = await driverA.wait(until.elementLocated(By.className('btn-battle-secondary')), 10000)
      await driverA.executeScript('arguments[0].click();', createRoomBtn)

      // 5. Đọc mã phòng từ RoomModal của Người chơi A
      const codeBox = await driverA.wait(until.elementLocated(By.className('battle-modal-code-box')), 10000)
      const roomCode = (await codeBox.getText()).trim()
      expect(roomCode.length).toBe(6)

      // 6. Người chơi B nhập mã phòng và click tham gia
      const inviteInput = await driverB.wait(until.elementLocated(By.className('battle-invite-code-input')), 10000)
      await inviteInput.sendKeys(roomCode)

      const joinBtn = await driverB.findElement(By.xpath("//button[@type='submit' and contains(@class, 'btn-battle-primary')]"))
      await driverB.executeScript('arguments[0].click();', joinBtn)

      // 7. Cả hai cùng chuyển sang trang đấu /battle/play tự động
      await Promise.all([
        driverA.wait(until.urlContains('/battle/play'), 15000),
        driverB.wait(until.urlContains('/battle/play'), 15000)
      ])

      // 8. Tự động click chọn đáp án cho cả hai trình duyệt cho đến khi hiện bảng kết quả
      let gameFinished = false
      const maxWaitSec = 60 // Tăng giới hạn chờ lên 60 giây để đảm bảo an toàn

      for (let sec = 0; sec < maxWaitSec; sec++) {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        try {
          // Kiểm tra xem đã kết thúc game chưa
          const resultsA = await driverA.findElements(By.className('battle-result-container'))
          if (resultsA.length > 0) {
            console.log(`--- E2E Debug: Game kết thúc ở giây thứ ${sec}`)
            gameFinished = true
            break
          }

          // 8.1. Trả lời câu hỏi trắc nghiệm (MCQ) nếu xuất hiện
          const optionsA = await driverA.findElements(By.className('battle-option-button'))
          const optionsB = await driverB.findElements(By.className('battle-option-button'))

          if (optionsA.length > 0) {
            const isDisabled = await optionsA[0].getAttribute('disabled')
            if (!isDisabled) {
              console.log(`--- E2E Debug: Người chơi A click MCQ option ở giây thứ ${sec}`)
              await driverA.executeScript('arguments[0].click();', optionsA[0])
            }
          }

          if (optionsB.length > 0) {
            const isDisabled = await optionsB[0].getAttribute('disabled')
            if (!isDisabled) {
              console.log(`--- E2E Debug: Người chơi B click MCQ option ở giây thứ ${sec}`)
              await driverB.executeScript('arguments[0].click();', optionsB[0])
            }
          }

          // 8.2. Trả lời câu hỏi gõ từ (Typing) nếu xuất hiện
          const typingInputsA = await driverA.findElements(By.className('battle-typing-input'))
          const typingInputsB = await driverB.findElements(By.className('battle-typing-input'))

          if (typingInputsA.length > 0) {
            const isDisabled = await typingInputsA[0].getAttribute('disabled')
            if (!isDisabled) {
              console.log(`--- E2E Debug: Người chơi A gửi câu trả lời Typing ở giây thứ ${sec}`)
              await typingInputsA[0].sendKeys('test')
              const submitBtnA = await driverA.findElement(By.css('.battle-typing-input-wrapper button[type="submit"]'))
              await driverA.executeScript('arguments[0].click();', submitBtnA)
            }
          }

          if (typingInputsB.length > 0) {
            const isDisabled = await typingInputsB[0].getAttribute('disabled')
            if (!isDisabled) {
              console.log(`--- E2E Debug: Người chơi B gửi câu trả lời Typing ở giây thứ ${sec}`)
              await typingInputsB[0].sendKeys('test')
              const submitBtnB = await driverB.findElement(By.css('.battle-typing-input-wrapper button[type="submit"]'))
              await driverB.executeScript('arguments[0].click();', submitBtnB)
            }
          }
        } catch (err) {
          console.log(`--- E2E Debug: Gặp lỗi nhỏ trong vòng lặp ở giây thứ ${sec}: ${err.message}. Tiếp tục...`)
        }
      }

      expect(gameFinished).toBe(true)

      // 9. Bấm nút thoát ở cả hai bên để quay lại sảnh
      const exitBtnA = await driverA.wait(until.elementLocated(By.className('btn-battle-primary')), 10000)
      await driverA.executeScript('arguments[0].click();', exitBtnA)
      await driverA.wait(until.urlContains('/battle'), 10000)

      const exitBtnB = await driverB.wait(until.elementLocated(By.className('btn-battle-primary')), 10000)
      await driverB.executeScript('arguments[0].click();', exitBtnB)
      await driverB.wait(until.urlContains('/battle'), 10000)
    } catch (err) {
      console.log('--- E2E Debug: Battle failed ---')
      if (driverA) {
        const urlA = await driverA.getCurrentUrl().catch(() => 'unknown')
        console.log('Driver A URL =', urlA)
        const htmlA = await driverA.getPageSource().catch(() => 'unknown')
        console.log('--- DRIVER A HTML ---')
        console.log(htmlA)
        const logsA = await driverA.manage().logs().get('browser').catch(() => [])
        console.log('--- DRIVER A CONSOLE LOGS ---')
        logsA.forEach(log => console.log(log.message))
      }
      if (driverB) {
        const urlB = await driverB.getCurrentUrl().catch(() => 'unknown')
        console.log('Driver B URL =', urlB)
        const htmlB = await driverB.getPageSource().catch(() => 'unknown')
        console.log('--- DRIVER B HTML ---')
        console.log(htmlB)
        const logsB = await driverB.manage().logs().get('browser').catch(() => [])
        console.log('--- DRIVER B CONSOLE LOGS ---')
        logsB.forEach(log => console.log(log.message))
      }
      throw err
    }
  })
})
