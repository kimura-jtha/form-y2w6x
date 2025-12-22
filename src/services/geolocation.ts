/**
 * IP Geolocation service
 * Detects user's country code based on IP address
 */

interface CloudflareGeolocation {
  country?: string;
}

interface GeolocationResponse {
  countryCode: string | null;
}

/**
 * Get country code from Cloudflare headers (if available)
 * Cloudflare automatically adds CF-IPCountry header
 */
async function getCountryFromCloudflare(): Promise<string | null> {
  try {
    // Cloudflare Pages/Workers automatically inject country code
    // We can access it via a special endpoint or headers
    const response = await fetch('/api/geo', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data: CloudflareGeolocation = await response.json();
      return data.country || null;
    }
  } catch (error) {
    console.warn('Failed to get country from Cloudflare:', error);
  }

  return null;
}

/**
 * Fallback: Get country code from external geolocation API
 * Using ipapi.co as fallback (free tier: 1000 requests/day)
 */
async function getCountryFromIPAPI(): Promise<string | null> {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      return data.country_code || null;
    }
  } catch (error) {
    console.warn('Failed to get country from ipapi.co:', error);
  }

  return null;
}

/**
 * Get user's country code with fallback strategy:
 * 1. Try Cloudflare headers (if on Cloudflare Pages/Workers)
 * 2. Fallback to ipapi.co
 * 3. Return null if all methods fail
 */
export async function getUserCountryCode(): Promise<GeolocationResponse> {
  // Try Cloudflare first
  let countryCode = await getCountryFromCloudflare();

  // Fallback to ipapi.co
  if (!countryCode) {
    countryCode = await getCountryFromIPAPI();
  }

  return { countryCode };
}

/**
 * Cache key for geolocation result
 */
const GEO_CACHE_KEY = 'geo_country_code';
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached country code if available and not expired
 */
export function getCachedCountryCode(): string | null {
  try {
    const cached = localStorage.getItem(GEO_CACHE_KEY);
    if (cached) {
      const { countryCode, timestamp } = JSON.parse(cached);
      const now = Date.now();
      if (now - timestamp < GEO_CACHE_TTL) {
        return countryCode;
      }
    }
  } catch (error) {
    console.warn('Failed to read cached country code:', error);
  }
  return null;
}

/**
 * Cache country code with timestamp
 */
export function cacheCountryCode(countryCode: string): void {
  try {
    const data = {
      countryCode,
      timestamp: Date.now(),
    };
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to cache country code:', error);
  }
}

/**
 * Get country code with caching
 */
export async function getCountryCodeWithCache(): Promise<string | null> {
  // Check cache first
  const cached = getCachedCountryCode();
  if (cached) {
    return cached;
  }

  // Fetch from API
  const { countryCode } = await getUserCountryCode();
  if (countryCode) {
    cacheCountryCode(countryCode);
  }

  return countryCode;
}
