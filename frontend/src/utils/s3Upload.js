import apiClient from '../services/apiClient'

/**
 * Lấy URL ký trước để upload tệp lên S3
 * @param {Object} payload 
 * @param {string} payload.contentType Ví dụ: 'audio/wav'
 * @param {string} payload.purpose Ví dụ: 'shadowing-audio'
 * @param {number} payload.fileSize Kích thước tệp (bytes)
 */
export const getPresignedUrl = async (payload) => {
  const response = await apiClient.post('/s3/presigned-url', payload)
  return response.data
}

/**
 * Tải trực tiếp tệp lên S3 thông qua URL ký trước
 * @param {string} uploadUrl URL ký trước từ S3
 * @param {Blob} blob File Blob âm thanh hoặc ảnh
 * @param {string} contentType Loại nội dung, mặc định là 'audio/wav'
 */
export const uploadAudioToS3 = async (uploadUrl, blob, contentType = 'audio/wav') => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': contentType,
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to upload file to S3')
  }
  
  return true
}
