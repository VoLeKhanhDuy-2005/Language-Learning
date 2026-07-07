import { spawn, exec } from 'child_process'
import http from 'http'

let previewProcess
let backendProcess

/**
 * Chờ cho đến khi một cổng TCP sẵn sàng nhận kết nối.
 * Nếu tiến trình được theo dõi thoát sớm, promise sẽ reject ngay lập tức.
 *
 * @param {number} port - Cổng cần chờ
 * @param {number} timeout - Thời gian tối đa chờ (ms), mặc định 60s
 * @param {import('child_process').ChildProcess|null} watchProcess - Tiến trình cần giám sát
 */
const waitPort = (port, timeout = 60000, watchProcess = null) => {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    let settled = false

    // Nếu tiến trình được theo dõi thoát ra sớm thì reject ngay
    if (watchProcess) {
      watchProcess.on('exit', (code) => {
        if (!settled) {
          settled = true
          reject(new Error(`Tiến trình server thoát sớm với mã ${code} trước khi cổng ${port} sẵn sàng`))
        }
      })
    }

    const check = () => {
      if (settled) return
      const req = http.request({ host: 'localhost', port, method: 'GET' }, () => {
        if (!settled) {
          settled = true
          resolve()
        }
      })
      req.on('error', () => {
        if (settled) return
        if (Date.now() - start > timeout) {
          settled = true
          reject(new Error(`Cổng ${port} không sẵn sàng sau ${timeout}ms`))
        } else {
          setTimeout(check, 500)
        }
      })
      req.end()
    }
    check()
  })
}

export async function setup() {
  console.log('--- E2E Test Global Setup: Khởi chạy backend test server tại cổng 5000 ---')
  backendProcess = spawn('node', ['server.js'], {
    cwd: '../backend',
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' }
  })

  backendProcess.on('error', (err) => {
    console.error('Lỗi khi khởi động backend process:', err)
  })

  // Tăng timeout lên 60s và giám sát process để phát hiện crash sớm
  await waitPort(5000, 60000, backendProcess)
  console.log('--- E2E Test Global Setup: Backend test server đã online tại http://localhost:5000 ---')

  console.log('--- E2E Test Global Setup: Đang chạy build ứng dụng ---')
  const build = spawn('npm', ['run', 'build'], { shell: true, stdio: 'inherit' })
  await new Promise((resolve, reject) => {
    build.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error('Build ứng dụng thất bại!'))
    })
  })

  console.log('--- E2E Test Global Setup: Khởi chạy server vite preview tại cổng 4173 ---')
  previewProcess = spawn('npm', ['run', 'preview', '--', '--port', '4173'], { shell: true })

  await waitPort(4173, 30000, previewProcess)
  console.log('--- E2E Test Global Setup: Server preview đã online sẵn sàng tại http://localhost:4173 ---')
}

export async function teardown() {
  console.log('--- E2E Test Global Teardown: Đang tắt server preview và backend test server ---')
  if (previewProcess) {
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${previewProcess.pid} /f /t`)
    } else {
      previewProcess.kill()
    }
  }
  if (backendProcess) {
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${backendProcess.pid} /f /t`)
    } else {
      backendProcess.kill()
    }
  }
}
