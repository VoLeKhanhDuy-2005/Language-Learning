import { ADMIN } from '../constants/codes/index.js';

/**
 * Lấy duration (ms) của 1 video YouTube dùng YouTube Data API v3.
 * Trả về Number (ms) hoặc null nếu thất bại.
 */
export const getDurationMsFromYoutube = async (sourceUrl) => {
  if (!/youtube\.com|youtu\.be/.test(sourceUrl)) {
    return null;
  }

  // Parse video ID from url
  let videoId = null;
  try {
    const urlObj = new URL(sourceUrl);
    if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v');
    } else if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.substring(1);
    }
  } catch (err) {
    //console.error(`[YouTube API error] Invalid URL: ${sourceUrl}`);
    return null;
  }
  if (!videoId) {
    return null;
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error(ADMIN.LESSON_SOURCE_URL_DISABLED_PLAYBACK);
  }

  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails,status&key=${apiKey}`);
    const data = await res.json();
    if (data.error) {
      //console.error(`[YouTube API error] ${data.error.message}`);
      return null;
    }
    if (!data.items || data.items.length === 0) {
      throw new Error(ADMIN.LESSON_SOURCE_URL_DISABLED_PLAYBACK);
    }

    const item = data.items[0];
    
    // Check if embeddable
    if (!item.status.embeddable) {
      throw new Error(ADMIN.LESSON_SOURCE_URL_DISABLED_PLAYBACK);
    }

    const durationIso = item.contentDetails.duration;
    if (!durationIso) {
      return null;
    }
    return parseIsoDurationToMs(durationIso);
  } catch (error) {
    if (error.message === ADMIN.LESSON_SOURCE_URL_DISABLED_PLAYBACK) {
      throw error;
    }
    //console.error(`[YouTube API error] Fetch failed: ${error.message}`);
    return null;
  }
};

const parseIsoDurationToMs = (duration) => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return null;
  const hours = (parseInt(match[1]) || 0);
  const minutes = (parseInt(match[2]) || 0);
  const seconds = (parseInt(match[3]) || 0);
  return (hours * 3600 + minutes * 60 + seconds) * 1000;
};
