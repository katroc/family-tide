
import { Sun, Cloud, CloudSun, CloudRain, CloudSnow, CloudLightning, Haze, CloudFog, CloudDrizzle } from 'lucide-react';
import React from 'react';

export const extractCityFromAddress = (address: string): string | null => {
    if (!address || typeof address !== 'string') return null;
    const rawParts = address.split(',');
    let parts = rawParts.map(p => p.trim()).filter(p => p.length > 0);

    if (parts.length === 0) return null;

    let cityCandidate: string;
    const nonCityTerms = [ // Kept for final validation and within the improved no-comma logic
        'ACT', 'NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT',
        'CA', 'NY', 'IL', 'TX', 'FL', 'PA', 'OH', 'GA', 'NC', 'MI',
        'ON', 'QC', 'BC', 'AB', 'MB', 'SK',
        'USA', 'AUSTRALIA', 'CANADA', 'UNITED STATES', 'UNITED KINGDOM', 'UK',
        'PO BOX'
    ];

    if (parts.length > 1) { // Comma-separated address
        if (parts.length > 2) { // Typically "Street, City, State..."
            cityCandidate = parts[1];
        } else { // parts.length === 2: "City, State" OR "Street Address, City"
            const part0 = parts[0];
            const part1 = parts[1];
            const streetIndicators = /\d/.test(part0) || /\b(street|st|road|rd|avenue|ave|lane|ln|drive|dr|court|ct|po box)\b/i.test(part0);
            if (streetIndicators && !/\d/.test(part1) && part1.length > 1) {
                cityCandidate = part1;
            } else {
                cityCandidate = part0;
            }
        }
    } else { // No commas in the input address string (parts.length === 1)
        cityCandidate = parts[0]; // The whole string is initially the candidate
        const words = cityCandidate.split(/\s+/).map(w => w.trim()).filter(w => w.length > 0);

        if (words.length > 1) { // Only if original candidate from no-comma input is multi-word
            let potentialCityFromWords = "";
            for (let i = words.length - 1; i >= 0; i--) {
                const word = words[i];
                const upperWord = word.toUpperCase();

                if (/^\d+$/.test(word)) continue; // Skip numbers/postcodes

                // Skip common state/country codes if they are among the last two words and short
                if (i >= words.length - 2 && nonCityTerms.includes(upperWord) && word.length <= 4) {
                    continue;
                }
                
                // Found a potential city word (e.g., "Taylor" from "32 Ancher St Taylor ACT")
                potentialCityFromWords = word; 
                
                // Attempt to capture multi-word cities like "New York" or "San Francisco"
                if (i > 0) {
                    const prevWord = words[i-1];
                    const upperPrevWord = prevWord.toUpperCase();
                    if (!/^\d+$/.test(prevWord) && 
                        prevWord.length > 1 && 
                        !(nonCityTerms.includes(upperPrevWord) && prevWord.length <=4) && 
                        !/\b(street|st|road|rd|avenue|ave|lane|ln|drive|dr|court|ct|po)\b/i.test(prevWord) &&
                        !/\d/.test(prevWord) 
                    ) {
                        potentialCityFromWords = prevWord + " " + potentialCityFromWords;
                        if (i > 1) {
                            const prevPrevWord = words[i-2];
                            const upperPrevPrevWord = prevPrevWord.toUpperCase();
                             if (!/^\d+$/.test(prevPrevWord) && 
                                 prevPrevWord.length > 1 &&
                                 !(nonCityTerms.includes(upperPrevPrevWord) && prevPrevWord.length <=4) &&
                                 !/\b(street|st|road|rd|avenue|ave|lane|ln|drive|dr|court|ct|po)\b/i.test(prevPrevWord) &&
                                 !/\d/.test(prevPrevWord)
                             ) {
                                potentialCityFromWords = prevPrevWord + " " + potentialCityFromWords;
                             }
                        }
                    }
                }
                break; 
            }
            if (potentialCityFromWords) {
                cityCandidate = potentialCityFromWords;
            }
        }
    }

    // Final validation for the determined cityCandidate
    if (cityCandidate && cityCandidate.length > 1 && !/^\d+$/.test(cityCandidate)) {
        const upperCandidate = cityCandidate.toUpperCase();
        
        // If the candidate itself is a state/country code and it's short
        if (nonCityTerms.includes(upperCandidate) && cityCandidate.length <= 4) {
            // If the original input had multiple parts (comma-separated) and we picked a state, that's bad.
            // Or if original input was just "ACT", this logic correctly returns null.
             if (parts.length > 1 || parts[0].toUpperCase() === upperCandidate) { // Check if the only part was this term
                return null;
            }
        }
        return cityCandidate;
    }
    return null;
};

export interface WeatherDisplayInfo {
  description: string;
  icon: React.ElementType;
}

export const mapWeatherCodeToDescriptionAndIcon = (code: number): WeatherDisplayInfo => {
  // WMO Weather interpretation codes (WW)
  // Grouped by categories for simplicity. Details: https://open-meteo.com/en/docs
  switch (code) {
    case 0: return { description: 'Clear sky', icon: Sun };
    case 1: return { description: 'Mainly clear', icon: Sun };
    case 2: return { description: 'Partly cloudy', icon: CloudSun };
    case 3: return { description: 'Overcast', icon: Cloud };
    case 45: return { description: 'Fog', icon: CloudFog };
    case 48: return { description: 'Depositing rime fog', icon: CloudFog };
    case 51: return { description: 'Light drizzle', icon: CloudDrizzle };
    case 53: return { description: 'Moderate drizzle', icon: CloudDrizzle };
    case 55: return { description: 'Dense drizzle', icon: CloudDrizzle };
    case 56: return { description: 'Light freezing drizzle', icon: CloudDrizzle }; // Could use Snow icon
    case 57: return { description: 'Dense freezing drizzle', icon: CloudDrizzle }; // Could use Snow icon
    case 61: return { description: 'Slight rain', icon: CloudRain };
    case 63: return { description: 'Moderate rain', icon: CloudRain };
    case 65: return { description: 'Heavy rain', icon: CloudRain };
    case 66: return { description: 'Light freezing rain', icon: CloudRain }; // Could use Snow icon
    case 67: return { description: 'Heavy freezing rain', icon: CloudRain }; // Could use Snow icon
    case 71: return { description: 'Slight snow fall', icon: CloudSnow };
    case 73: return { description: 'Moderate snow fall', icon: CloudSnow };
    case 75: return { description: 'Heavy snow fall', icon: CloudSnow };
    case 77: return { description: 'Snow grains', icon: CloudSnow };
    case 80: return { description: 'Slight rain showers', icon: CloudRain };
    case 81: return { description: 'Moderate rain showers', icon: CloudRain };
    case 82: return { description: 'Violent rain showers', icon: CloudRain };
    case 85: return { description: 'Slight snow showers', icon: CloudSnow };
    case 86: return { description: 'Heavy snow showers', icon: CloudSnow };
    case 95: // Fallback for thunderstorm without precipitation code (96, 99 more specific)
    case 96:
    case 99:
      return { description: 'Thunderstorm', icon: CloudLightning };
    default: return { description: 'Weather unavailable', icon: Haze }; // Haze as a generic unknown
  }
};

// FIX: Added getAbbreviatedState function and export to resolve import error in FamilyTab.tsx
export const getAbbreviatedState = (stateName: string, countryCode: string): string => {
  const upperCountryCode = countryCode.toUpperCase();
  const normalizedStateName = stateName.toLowerCase().trim();

  const stateMappings: Record<string, Record<string, string>> = {
    US: {
      'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
      'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
      'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
      'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
      'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
      'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
      'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
      'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
      'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
      'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
      'district of columbia': 'DC', 'american samoa': 'AS', 'guam': 'GU', 'northern mariana islands': 'MP',
      'puerto rico': 'PR', 'u.s. virgin islands': 'VI', 'virgin islands': 'VI', 
    },
    AU: {
      'new south wales': 'NSW', 'victoria': 'VIC', 'queensland': 'QLD',
      'western australia': 'WA', 'south australia': 'SA', 'tasmania': 'TAS',
      'australian capital territory': 'ACT', 'northern territory': 'NT',
    },
    CA: {
      'alberta': 'AB', 'british columbia': 'BC', 'manitoba': 'MB', 'new brunswick': 'NB',
      'newfoundland and labrador': 'NL', 'nova scotia': 'NS', 'ontario': 'ON',
      'prince edward island': 'PE', 'quebec': 'QC', 'saskatchewan': 'SK',
      'northwest territories': 'NT', 'nunavut': 'NU', 'yukon': 'YT',
    }
    // Add more country codes and their state/province abbreviations as needed
  };

  if (stateMappings[upperCountryCode] && stateMappings[upperCountryCode][normalizedStateName]) {
    return stateMappings[upperCountryCode][normalizedStateName];
  }

  return stateName; // Default to full state name if no abbreviation found or country code not supported
};
