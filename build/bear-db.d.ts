/**
 * BearDB client for interacting with the Bear app's SQLite database
 */
/**
 * Options for the BearDB client
 */
export interface BearDBOptions {
    databasePath?: string;
}
/**
 * Parameters for opening a note
 */
export interface OpenNoteParams {
    id?: string;
    title?: string;
    header?: string;
    exclude_trashed?: boolean;
    selected?: boolean;
}
/**
 * Parameters for searching notes
 */
export interface SearchParams {
    term?: string;
    tag?: string;
}
/**
 * Client for interacting with the Bear app's SQLite database
 */
export declare class BearDB {
    private db;
    private readonly defaultDbPath;
    /**
     * Creates a new BearDB client
     * @param options Options for the client
     */
    constructor(options?: BearDBOptions);
    /**
     * Closes the database connection
     */
    close(): void;
    /**
     * Gets a note by its ID or title
     * @param params Parameters for opening the note
     * @returns The note data
     */
    getNoteByIdOrTitle(params: OpenNoteParams): {
        note: string;
        title: string;
        id: string;
    } | null;
    /**
     * Searches for notes
     * @param params Parameters for searching
     * @returns Array of matching notes
     */
    searchNotes(params: SearchParams): Array<{
        identifier: string;
        title: string;
        tags: string[];
    }>;
    /**
     * Gets all tags
     * @returns Array of tags
     */
    getTags(): Array<{
        name: string;
    }>;
    /**
     * Gets notes with a specific tag
     * @param tagName The tag name
     * @returns Array of notes with the tag
     */
    getNotesByTag(tagName: string): Array<{
        identifier: string;
        title: string;
        tags: string[];
    }>;
    /**
     * Gets tags for a note
     * @param noteId The note ID
     * @returns Array of tag names
     */
    private getTagsForNote;
}
