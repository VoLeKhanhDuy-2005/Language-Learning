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

describe('Đăng ký & Xác thực OTP - E2E Test bằng Selenium', () => {
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

  it('đăng ký tài khoản mới và xác thực OTP qua Redis thành công', async () => {
    const uniqueEmail = `e2e_user_${Date.now()}@example.com`
    const password = 'Password123'

    // 1. Truy cập trang đăng ký
    await driver.get('http://localhost:4173/signup')

    const nameInput = await driver.wait(until.elementLocated(By.id('fullName')), 10000)
    const emailInput = await driver.findElement(By.id('email'))
    const passwordInput = await driver.findElement(By.id('password'))
    const confirmPasswordInput = await driver.findElement(By.id('confirmPassword'))
    const submitBtn = await driver.findElement(By.className('signup-submit-btn'))

    // 2. Nhập thông tin đăng ký
    await nameInput.sendKeys('Test E2E Register')
    await emailInput.sendKeys(uniqueEmail)
    await passwordInput.sendKeys(password)
    await confirmPasswordInput.sendKeys(password)
    await submitBtn.click()

    // 3. Chờ chuyển hướng đến trang verify-email
    await driver.wait(until.urlContains('/verify-email'), 10000)

    // 4. Lấy mã OTP từ Redis (thực hiện truy vấn lặp tối đa 5 giây cho đến khi nhận được giá trị)
    let otpCode = null
    for (let attempt = 0; attempt < 10; attempt++) {
      otpCode = await getOtpFromRedis(uniqueEmail)
      if (otpCode) break
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
    expect(otpCode).toBeTruthy()
    expect(otpCode.length).toBe(6)

    // 5. Điền OTP vào 6 ô input
    for (let i = 0; i < 6; i++) {
      const otpInput = await driver.findElement(By.id(`otp-${i}`))
      await otpInput.sendKeys(otpCode[i])
    }

    // 6. Nhấn nút xác thực
    const verifySubmitBtn = await driver.findElement(By.className('verify-submit-btn'))
    await verifySubmitBtn.click()

    // 7. Chờ thông báo thành công xuất hiện và chuyển hướng về trang đăng nhập
    await driver.wait(until.elementLocated(By.className('verify-success-message')), 10000)
    await driver.wait(until.urlContains('/login'), 10000)
    const currentUrl = await driver.getCurrentUrl()
    expect(currentUrl).toContain('/login')

    // 8. Đăng nhập thử bằng tài khoản vừa đăng ký thành công
    const loginEmailInput = await driver.wait(until.elementLocated(By.id('email')), 10000)
    const loginPasswordInput = await driver.findElement(By.id('password'))
    const loginSubmitBtn = await driver.findElement(By.className('login-submit-btn'))

    await loginEmailInput.sendKeys(uniqueEmail)
    await loginPasswordInput.sendKeys(password)
    await loginSubmitBtn.click()

    // 9. Xác minh đăng nhập thành công và menu user hiển thị
    await driver.wait(until.elementLocated(By.className('header-user-btn')), 15000)
    const isLogged = await driver.findElement(By.className('header-user-btn')).isDisplayed()
    expect(isLogged).toBe(true)
  })
})
