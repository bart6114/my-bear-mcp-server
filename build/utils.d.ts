/**
 * Utility functions for the Bear MCP server
 */
/**
 * Formats a Bear timestamp (seconds since January 1, 2001) to a human-readable date string
 * @param timestamp Bear timestamp (seconds since January 1, 2001)
 * @returns Formatted date string
 */
export declare function formatBearDate(timestamp: number): string;
/**
 * Converts a JavaScript object to a comma-separated list of tags
 * @param tags Array of tags or comma-separated string
 * @returns Comma-separated string of tags
 */
export declare function formatTags(tags: string | string[]): string;
/**
 * Validates that a value is a non-empty string
 * @param value The value to validate
 * @param name The name of the parameter (for error messages)
 * @throws Error if the value is not a non-empty string
 */
export declare function validateNonEmptyString(value: any, name: string): void;
/**
 * Validates that a value is a boolean or a string 'yes' or 'no'
 * @param value The value to validate
 * @param name The name of the parameter (for error messages)
 * @returns 'yes' or 'no'
 * @throws Error if the value is not a boolean or 'yes'/'no'
 */
export declare function validateAndFormatBoolean(value: any, name: string): 'yes' | 'no';
