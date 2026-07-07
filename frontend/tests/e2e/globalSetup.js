import { spawn, exec } from 'child_process'
import http from 'http'

let previewProcess
let backendProcess

const waitPort = (port, timeout = 20000) => {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const check = () => {
      const req = http.request({ host: 'localhost', port, method: 'GET' }, () => {
        resolve()
      })
      req.on('error', () => {
        if (Date.now() - start > timeout) {
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

  await waitPort(5000)
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
  
  await waitPort(4173)
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
