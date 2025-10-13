import { RateMyProfessor } from "rate-my-professor-api-ts"


let lastRequestTime = 0;
let requestQueue: Promise<any> = Promise.resolve();

const DELAY = 100;
const CACHE_SIZE_LIMIT = 100;
const professorCache = new Map<string, any>();
const professorTimestamps = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 mins * 60 secs * 1000 ms

function maintainCacheSize() {
  if (professorCache.size >= CACHE_SIZE_LIMIT) {
        const entries = Array.from(professorTimestamps.entries())
          .sort(([,a], [,b]) => a - b)
          .slice(0, 50);
        
        entries.forEach(([key]) => {
          professorCache.delete(key);
          professorTimestamps.delete(key);
        })
      }
}


async function getRateMyProfessorData(professorName: string) {
  // Check the cache first
  const cacheKey = professorName.toLowerCase().trim();
  const cachedData = professorCache.get(cacheKey);
  const cachedTime = professorTimestamps.get(cacheKey);

  if (cachedData && cachedTime && (Date.now() - cachedTime) < CACHE_DURATION) {
    console.log('Cache hit for:', professorName);
    return cachedData;
  }

  return requestQueue = requestQueue.then(async () => {
    const freshCachedData = professorCache.get(cacheKey);
    const freshCachedTime = professorTimestamps.get(cacheKey);

    if (freshCachedData && freshCachedTime && (Date.now() - freshCachedTime) < CACHE_DURATION) {
      console.log('Cache hit after queue for:', professorName);
      return freshCachedData;
    }

    const currentTime = Date.now();
    const timeSinceLastRequest = currentTime - lastRequestTime;

    if (timeSinceLastRequest < DELAY) {
      await new Promise(resolve => setTimeout(resolve, DELAY - timeSinceLastRequest));
    }

    try {
      // Fetch data from API
      console.debug('Fetching from API for:', professorName);
      const rmp_instance = new RateMyProfessor("Arizona State University", professorName);
      const result = await rmp_instance.get_professor_info();

      // Maintain the cache size
      maintainCacheSize();

      
      
      // Cache the result
      professorCache.set(cacheKey, result);
      professorTimestamps.set(cacheKey, Date.now());
      lastRequestTime = Date.now();

      return result;
    } catch (error) {
      lastRequestTime = Date.now();
      throw error;
    }
  });
}

chrome.runtime.onMessage.addListener(
  function (request, _sender, sendResponse) {

    if (request.professorName) {
      (async () => {
        try {
          const professor_info = await getRateMyProfessorData(request.professorName);
          sendResponse({ success: true, data: professor_info });
        } catch (error) {
          console.error("Error fetching professor info:", error);
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();

      return true; // Keep the message channel open for async response
    }
  }
);