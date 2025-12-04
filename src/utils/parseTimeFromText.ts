export interface ParsedTime {
  value: number;
  unit: 'minutes' | 'hours' | 'seconds';
  originalText: string;
}

/**
 * Parses time durations from instruction text using regex patterns
 * Handles formats like "10 minutes", "30 mins", "1 hour", "45 min", "2.5 hrs", etc.
 */
export const parseTimeFromText = (text: string): ParsedTime[] => {
  const patterns = [
    // Match "X minutes", "X mins", "X min" with optional spaces and decimals
    /(\d+(?:\.\d+|½)?)\s*(?:minutes?|mins?|min)\b/gi,
    // Match "X hours", "X hrs", "X hr" with optional spaces and decimals  
    /(\d+(?:\.\d+|½)?)\s*(?:hours?|hrs?|hr)\b/gi,
    // Match "X seconds", "X secs", "X sec" with optional spaces and decimals
    /(\d+(?:\.\d+|½)?)\s*(?:seconds?|secs?|sec)\b/gi,
  ];

  const matches: ParsedTime[] = [];

  patterns.forEach((pattern, patternIndex) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const valueStr = match[1];
      const originalText = match[0];
      
      // Convert fractional and decimal values to numbers
      let value: number;
      if (valueStr.includes('½')) {
        value = parseInt(valueStr.replace('½', '')) + 0.5;
      } else {
        value = parseFloat(valueStr);
      }

      // Determine unit based on pattern
      let unit: 'minutes' | 'hours' | 'seconds';
      if (patternIndex === 0) {
        unit = 'minutes';
      } else if (patternIndex === 1) {
        unit = 'hours';
      } else {
        unit = 'seconds';
      }

      matches.push({
        value,
        unit,
        originalText: originalText.trim(),
      });
    }
  });

  return matches;
};

/**
 * Converts parsed time to seconds for timer calculations
 */
export const timeToSeconds = (parsedTime: ParsedTime): number => {
  switch (parsedTime.unit) {
    case 'hours':
      return Math.round(parsedTime.value * 60 * 60);
    case 'minutes':
      return Math.round(parsedTime.value * 60);
    case 'seconds':
      return Math.round(parsedTime.value);
    default:
      return 0;
  }
};

/**
 * Formats seconds back to human-readable string
 */
export const formatSeconds = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${remainingSeconds}s`;
  }
};

/**
 * Gets the first time duration found in text, or null if none found
 */
export const getFirstTimeFromText = (text: string): ParsedTime | null => {
  const times = parseTimeFromText(text);
  return times.length > 0 ? times[0] : null;
};
