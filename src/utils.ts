/**
 * Utility functions for the Bear MCP server
 */

/**
 * Encodes a string for use in a URL
 * @param str The string to encode
 * @returns The encoded string
 */
export function encodeURIComponentSafe(str: string): string {
  return encodeURIComponent(str)
    .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

/**
 * Encodes a base64 string for use in a URL
 * @param base64 The base64 string to encode
 * @returns The encoded string
 */
export function encodeBase64ForURL(base64: string): string {
  return encodeURIComponentSafe(base64);
}

/**
 * Parses a JSON string safely, returning null if parsing fails
 * @param jsonString The JSON string to parse
 * @returns The parsed object or null if parsing fails
 */
export function safeJSONParse(jsonString: string): any {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return null;
  }
}

/**
 * Converts a JavaScript object to a comma-separated list of tags
 * @param tags Array of tags or comma-separated string
 * @returns Comma-separated string of tags
 */
export function formatTags(tags: string | string[]): string {
  if (Array.isArray(tags)) {
    return tags.join(',');
  }
  return tags;
}

/**
 * Validates that a value is a non-empty string
 * @param value The value to validate
 * @param name The name of the parameter (for error messages)
 * @throws Error if the value is not a non-empty string
 */
export function validateNonEmptyString(value: any, name: string): void {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} must be a non-empty string`);
  }
}

/**
 * Validates that a value is a boolean or a string 'yes' or 'no'
 * @param value The value to validate
 * @param name The name of the parameter (for error messages)
 * @returns 'yes' or 'no'
 * @throws Error if the value is not a boolean or 'yes'/'no'
 */
export function validateAndFormatBoolean(value: any, name: string): 'yes' | 'no' {
  if (typeof value === 'boolean') {
    return value ? 'yes' : 'no';
  }
  
  if (value === 'yes' || value === 'no') {
    return value;
  }
  
  throw new Error(`${name} must be a boolean or 'yes'/'no'`);
}
