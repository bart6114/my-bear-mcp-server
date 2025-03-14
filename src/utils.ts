/**
 * Utility functions for the Bear MCP server
 */

/**
 * Formats a Bear timestamp (seconds since January 1, 2001) to a human-readable date string
 * @param timestamp Bear timestamp (seconds since January 1, 2001)
 * @returns Formatted date string
 */
export function formatBearDate(timestamp: number): string {
  // Bear uses Core Data timestamps, which are seconds since January 1, 2001
  const referenceDate = new Date('2001-01-01T00:00:00Z');
  const date = new Date(referenceDate.getTime() + (timestamp * 1000));
  
  // Format the date as a human-readable string
  return date.toLocaleString();
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
