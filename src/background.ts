import { RateMyProfessor } from "rate-my-professor-api-ts"

let lastRequestTime = 0;
let requestQueue: Promise<any> = Promise.resolve();

const DELAY = 100;
const CACHE_SIZE_LIMIT = 100;
const professorCache = new Map<string, any>();
const professorTimestamps = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 mins * 60 secs * 1000 ms

const ASU_CAMPUSES = [
  "Arizona State University",
  "Arizona State University - Polytechnic Campus",
  "Arizona State University - West Campus"
]

const ASU_PROFESSOR_NAME_REPLACEMENTS: { [key: string]: string} = {
  "Steven Baer": "Steve Baer",
  "Shyla Gonzalez Dogan": "Shyla Dogan",
  "Carla van de Sande": "Carla Van De Sande",
  "Christopher Felix Gozo": "Christopher Gozo",
  "Josh Klein": "Joshua Klein",
  "Fabio Suzart de Albuquerque": "Fabio Albuquerque",
  "Lynn Robert Carter": "Lynn Carter",
  "Zahra Sadri Moshkenani": "Zahra Sadri-Moshekenani"
}

async function testApiCall() {
  try {
  const rmp_instance = new RateMyProfessor("Arizona State University", "Yang Kuang");
  const result = await rmp_instance.get_professor_info();
  console.debug(result);
  } catch (error) {
    console.error("Test API call error:", error);
  }
}

testApiCall();

function applyNameReplacements(professorName: string): string {
  // Direct replacement
  if (ASU_PROFESSOR_NAME_REPLACEMENTS[professorName]) {
    console.debug(`Name replacement: "${professorName}" → "${ASU_PROFESSOR_NAME_REPLACEMENTS[professorName]}"`);
    return ASU_PROFESSOR_NAME_REPLACEMENTS[professorName];
  }
  
  // Partial replacement (for first names)
  let modifiedName = professorName;
  for (const [original, replacement] of Object.entries(ASU_PROFESSOR_NAME_REPLACEMENTS)) {
    if (professorName.includes(original)) {
      modifiedName = professorName.replace(original, replacement);
      console.debug(`Partial name replacement: "${professorName}" → "${modifiedName}"`);
      break;
    }
  }
  
  return modifiedName;
}


async function searchAsuCampuses(professorName: string) {
  const errors: string[] = [];
  
  // Try original name first
  const namesToTry = [professorName];
  
  // Add replacement name if it exists
  const replacementName = applyNameReplacements(professorName);
  if (replacementName !== professorName) {
    namesToTry.push(replacementName);
  }
  
  // Try each name variation across all campuses
  for (const nameToSearch of namesToTry) {
    console.debug(`Trying name variation: "${nameToSearch}"`);
    
    for (const campus of ASU_CAMPUSES) {
      try {
        console.debug(`Searching ${campus} for: ${nameToSearch}`);
        const rmp_instance = new RateMyProfessor(campus, nameToSearch);
        const result = await rmp_instance.get_professor_info();
        
        if (validateProfessor(professorName, result, nameToSearch)) {
          console.debug(`Found match at ${campus}: ${result.firstName} ${result.lastName}`);
          return result;
        } else {
          console.debug(`Name mismatch at ${campus}: expected "${nameToSearch}", got "${result.firstName} ${result.lastName}"`);
          continue;
        }
      } catch (error) {
        const errorMsg = `${campus} (${nameToSearch}): ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.debug(`Error message: ${errorMsg}`);
        continue; // Try next campus instead of throwing
      }
    }
  }
  
  // If we get here, no campus had a valid match for any name variation
  throw new Error(`Professor "${professorName}" not found at any ASU campus with any name variation. Tried: ${errors.join(', ')}`);
}

function validateProfessor(originalName: string, professorData: any, searchedName?: string): boolean {
  if (!professorData || !professorData.firstName || !professorData.lastName) {
    return false;
  }

  // Normalize both names consistently - remove extra spaces and trim
  const fetchedFullName = `${professorData.firstName} ${professorData.lastName}`
    .trim()
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
  
  const nameToValidate = (searchedName || originalName)
    .trim()
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space


  if (nameToValidate !== fetchedFullName) {
    return false;
  } else {
    return true;
  }
}

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
      const result = await searchAsuCampuses(professorName);

      // Maintain the cache size
      maintainCacheSize();
      
      // Cache the result
      professorCache.set(cacheKey, result);
      professorTimestamps.set(cacheKey, Date.now());
      lastRequestTime = Date.now();

      return result;
    } catch (error) {
      lastRequestTime = Date.now();
      
      // Log the error but don't crash the extension
      console.warn(`IMPORTANT: Could not find professor "${professorName}":`, error instanceof Error ? error.message : error);
      
      // Cache the failure to avoid repeated failed requests
      const failureResult = {
        error: true,
        message: `Professor "${professorName}" not found`,
        searchedName: professorName,
        timestamp: Date.now()
      };
      
      professorCache.set(cacheKey, failureResult);
      professorTimestamps.set(cacheKey, Date.now());
      
      // Return the failure result instead of throwing
      return failureResult;
    }
  });
}

chrome.runtime.onMessage.addListener(
  function (request, _sender, sendResponse) {
    if (request.professorName) {
      (async () => {
        try {
          const professor_info = await getRateMyProfessorData(request.professorName);
          
          // Check if it's a cached failure
          if (professor_info.error) {
            sendResponse({ 
              success: false, 
              error: professor_info.message,
              cached: true 
            });
          } else {
            sendResponse({ success: true, data: professor_info });
          }
        } catch (error) {
          console.error("Unexpected error fetching professor info:", error);
          sendResponse({ 
            success: false, 
            error: "An unexpected error occurred",
            details: (error as Error).message 
          });
        }
      })();

      return true; // Keep the message channel open for async response
    }
  }
);