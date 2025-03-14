/**
 * Utility functions for the Bear MCP server
 */
/**
 * Converts a JavaScript object to a comma-separated list of tags
 * @param tags Array of tags or comma-separated string
 * @returns Comma-separated string of tags
 */
export function formatTags(tags) {
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
export function validateNonEmptyString(value, name) {
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
export function validateAndFormatBoolean(value, name) {
    if (typeof value === 'boolean') {
        return value ? 'yes' : 'no';
    }
    if (value === 'yes' || value === 'no') {
        return value;
    }
    throw new Error(`${name} must be a boolean or 'yes'/'no'`);
}
//# sourceMappingURL=utils.js.map