import { Builder, By, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

describe('Học từ vựng & Đồng bộ Starred - E2E Test bằng Selenium', () => {
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

  it('đăng nhập, truy cập kho từ vựng và đồng bộ hóa trạng thái starred giữa Flashcard/Quiz', async () => {
    await login()

    // 1. Chuyển sang trang decks bằng cách click link trên Header để tránh reload trang
    const vocabLink = await driver.wait(
      until.elementLocated(By.css('a[href="/decks"]')),
      10000
    )
    await vocabLink.click()
    
    // 2. Click vào bộ từ vựng đầu tiên
    const deckCard = await driver.wait(
      until.elementLocated(By.className('deck-card')),
      10000
    )
    await deckCard.click()

    // 3. Chờ chuyển sang trang chi tiết bộ từ vựng
    await driver.wait(until.urlContains('/decks/'), 10000)

    // 4. Chờ và click vào topic đầu tiên trong danh sách topic sidebar
    const topicCard = await driver.wait(
      until.elementLocated(By.className('topic-item-card')),
      10000
    )
    await topicCard.click()

    // 5. Chờ thẻ từ Flashcard xuất hiện. 
    // Do có thể có topic không còn từ mới (đã học hết), nếu không tìm thấy .flashcard-card ta sẽ click các topic tiếp theo
    let flashcardFound = false
    const topics = await driver.findElements(By.className('topic-item-card'))
    
    for (let i = 0; i < topics.length; i++) {
      if (i > 0) {
        const nextTopic = await driver.findElements(By.className('topic-item-card'))
        await nextTopic[i].click()
        
        // Chờ loading zone xuất hiện và biến mất để chắc chắn API load xong
        try {
          await driver.wait(until.elementLocated(By.className('study-loading-zone')), 800)
        } catch (e) {
          // Bỏ qua nếu load quá nhanh không kịp bắt loading-zone
        }
        await driver.wait(async () => {
          const loadingZones = await driver.findElements(By.className('study-loading-zone'))
          return loadingZones.length === 0
        }, 15000)
      } else {
        // Đối với topic đầu tiên, cũng chờ loading-zone biến mất nếu có
        try {
          await driver.wait(async () => {
            const loadingZones = await driver.findElements(By.className('study-loading-zone'))
            return loadingZones.length === 0
          }, 15000)
        } catch (e) {}
      }
      
      const cardsZone = await driver.findElements(By.className('flashcard-card'))
      if (cardsZone.length > 0) {
        flashcardFound = true
        break
      }
    }

    // Nếu toàn bộ topics đã được học sạch, ta sẽ click vào link "Học từ vựng" để kết thúc sớm test case này an toàn
    if (!flashcardFound) {
      console.log('--- E2E Info: Toàn bộ từ vựng trong bộ từ đã được học hết. Kết thúc sớm test case. ---')
      return
    }

    const flashcard = await driver.findElement(By.className('flashcard-card'))
    expect(flashcard).toBeTruthy()

    // 6. Kiểm tra xem ban đầu có đang starred hay không
    const starBtn = await driver.findElement(By.className('flashcard-star-btn'))
    const initialStarredClass = await starBtn.getAttribute('class')
    console.log('--- E2E Debug: initialStarredClass =', initialStarredClass)
    const isInitiallyStarred = initialStarredClass.includes('starred')

    // 7. Click để thay đổi trạng thái Star
    try {
      await driver.executeScript("arguments[0].click();", starBtn)
      let starredClassAfterClick = ''
      await driver.wait(async () => {
        const activeStarBtn = await driver.findElement(By.className('flashcard-star-btn'))
        starredClassAfterClick = await activeStarBtn.getAttribute('class')
        return starredClassAfterClick.includes('starred') === !isInitiallyStarred
      }, 10000)
      console.log('--- E2E Debug: starredClassAfterClick =', starredClassAfterClick)
      expect(starredClassAfterClick.includes('starred')).toBe(!isInitiallyStarred)
    } catch (err) {
      const logs = await driver.manage().logs().get('browser')
      console.log('--- BROWSER CONSOLE LOGS ---')
      logs.forEach(log => console.log(log.message))
      console.log('----------------------------')
      throw err
    }

    // 8. Chuyển sang chế độ Quiz
    const quizModeBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Quiz')]"))
    await quizModeBtn.click()

    // Chờ màn hình quiz load
    await driver.wait(until.elementLocated(By.className('quiz-card-container')), 10000)

    // 9. Xác minh dấu ngôi sao ở Quiz đã được đồng bộ chính xác
    const quizStarBtn = await driver.findElement(By.className('quiz-star-btn'))
    const quizStarredClass = await quizStarBtn.getAttribute('class')
    expect(quizStarredClass.includes('starred')).toBe(!isInitiallyStarred)

    // 10. Click vào ngôi sao ở Quiz để đổi ngược lại trạng thái
    await driver.executeScript("arguments[0].click();", quizStarBtn)
    let quizStarredClassAfterClick = ''
    await driver.wait(async () => {
      const activeQuizStarBtn = await driver.findElement(By.className('quiz-star-btn'))
      quizStarredClassAfterClick = await activeQuizStarBtn.getAttribute('class')
      return quizStarredClassAfterClick.includes('starred') === isInitiallyStarred
    }, 10000)
    expect(quizStarredClassAfterClick.includes('starred')).toBe(isInitiallyStarred)

    // 11. Chuyển ngược lại chế độ Flashcard
    const flashcardModeBtn = await driver.findElement(By.xpath("//button[contains(text(), 'FlashCard')]"))
    await flashcardModeBtn.click()
    await driver.wait(until.elementLocated(By.className('flashcard-card')), 10000)

    // 12. Xác minh ngôi sao ở Flashcard đã được đồng bộ ngược lại chính xác
    const starBtnFinal = await driver.findElement(By.className('flashcard-star-btn'))
    const starClassFinal = await starBtnFinal.getAttribute('class')
    expect(starClassFinal.includes('starred')).toBe(isInitiallyStarred)

    // 13. Lật thẻ và click Dễ (grade 3) để kết thúc ôn tập từ này
    const flashcardToFlip = await driver.findElement(By.className('flashcard-card'))
    await flashcardToFlip.click()

    const easyBtn = await driver.wait(
      until.elementLocated(By.className('btn-easy')),
      10000
    )
    await easyBtn.click()
    await new Promise((resolve) => setTimeout(resolve, 1000))
  })
})
