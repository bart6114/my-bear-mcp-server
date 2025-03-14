/**
 * BearDB client for interacting with the Bear app's SQLite database
 */
import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';
/**
 * Client for interacting with the Bear app's SQLite database
 */
export class BearDB {
    /**
     * Creates a new BearDB client
     * @param options Options for the client
     */
    constructor(options = {}) {
        this.defaultDbPath = join(homedir(), 'Library/Group Containers/9K33E3U3T4.net.shinyfrog.bear/Application Data/database.sqlite');
        const dbPath = options.databasePath || this.defaultDbPath;
        try {
            // Open the database in read-only mode
            this.db = new Database(dbPath, { readonly: true });
            console.error(`Connected to Bear database at ${dbPath} in read-only mode`);
        }
        catch (error) {
            console.error(`Failed to connect to Bear database at ${dbPath}:`, error);
            throw new Error(`Failed to connect to Bear database: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Closes the database connection
     */
    close() {
        if (this.db) {
            this.db.close();
        }
    }
    /**
     * Gets a note by its ID or title
     * @param params Parameters for opening the note
     * @returns The note data
     */
    getNoteByIdOrTitle(params) {
        try {
            let note;
            if (params.id) {
                // Get note by ID
                note = this.db.prepare(`
          SELECT ZUNIQUEIDENTIFIER as id, ZTITLE as title, ZTEXT as text, ZTRASHED as trashed
          FROM ZSFNOTE
          WHERE ZUNIQUEIDENTIFIER = ?
        `).get(params.id);
            }
            else if (params.title) {
                // Get note by title
                note = this.db.prepare(`
          SELECT ZUNIQUEIDENTIFIER as id, ZTITLE as title, ZTEXT as text, ZTRASHED as trashed
          FROM ZSFNOTE
          WHERE ZTITLE = ?
        `).get(params.title);
            }
            else {
                throw new Error('Either id or title must be provided');
            }
            if (!note) {
                return null;
            }
            // Check if note is trashed and should be excluded
            if (params.exclude_trashed && note.trashed) {
                return null;
            }
            // If header is specified, try to extract that section
            let noteText = note.text;
            if (params.header && noteText) {
                const headerPattern = new RegExp(`## ${params.header}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'i');
                const match = headerPattern.exec(noteText);
                if (match && match[1]) {
                    noteText = match[1].trim();
                }
                else {
                    // Header not found
                    return null;
                }
            }
            return {
                note: noteText,
                title: note.title,
                id: note.id
            };
        }
        catch (error) {
            console.error('Error getting note:', error);
            throw new Error(`Failed to get note: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Searches for notes
     * @param params Parameters for searching
     * @returns Array of matching notes
     */
    searchNotes(params) {
        try {
            let query = `
        SELECT 
          n.ZUNIQUEIDENTIFIER as identifier, 
          n.ZTITLE as title
        FROM 
          ZSFNOTE n
        WHERE 
          n.ZTRASHED = 0
      `;
            const queryParams = [];
            // Add search term condition if provided
            if (params.term) {
                query += ` AND (n.ZTITLE LIKE ? OR n.ZTEXT LIKE ?)`;
                const searchTerm = `%${params.term}%`;
                queryParams.push(searchTerm, searchTerm);
            }
            // Add tag condition if provided
            if (params.tag) {
                query += `
          AND n.Z_PK IN (
            SELECT nt.Z_5NOTES FROM Z_5TAGS nt
            JOIN ZSFNOTETAG t ON t.Z_PK = nt.Z_13TAGS
            WHERE t.ZTITLE = ?
          )
        `;
                queryParams.push(params.tag);
            }
            // Execute the query
            const notes = this.db.prepare(query).all(...queryParams);
            // Get tags for each note
            return notes.map((note) => {
                const tags = this.getTagsForNote(note.identifier);
                return {
                    identifier: note.identifier,
                    title: note.title,
                    tags
                };
            });
        }
        catch (error) {
            console.error('Error searching notes:', error);
            throw new Error(`Failed to search notes: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Gets all tags
     * @returns Array of tags
     */
    getTags() {
        try {
            const tags = this.db.prepare(`
        SELECT ZTITLE as name
        FROM ZSFNOTETAG
        ORDER BY name
      `).all();
            return tags;
        }
        catch (error) {
            console.error('Error getting tags:', error);
            throw new Error(`Failed to get tags: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Gets notes with a specific tag
     * @param tagName The tag name
     * @returns Array of notes with the tag
     */
    getNotesByTag(tagName) {
        try {
            const notes = this.db.prepare(`
        SELECT 
          n.ZUNIQUEIDENTIFIER as identifier, 
          n.ZTITLE as title
        FROM 
          ZSFNOTE n
        JOIN 
          Z_5TAGS nt ON n.Z_PK = nt.Z_5NOTES
        JOIN 
          ZSFNOTETAG t ON t.Z_PK = nt.Z_13TAGS
        WHERE 
          t.ZTITLE = ?
          AND n.ZTRASHED = 0
        ORDER BY 
          n.ZCREATIONDATE DESC
      `).all(tagName);
            // Get tags for each note
            return notes.map((note) => {
                const tags = this.getTagsForNote(note.identifier);
                return {
                    identifier: note.identifier,
                    title: note.title,
                    tags
                };
            });
        }
        catch (error) {
            console.error('Error getting notes by tag:', error);
            throw new Error(`Failed to get notes by tag: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Gets tags for a note
     * @param noteId The note ID
     * @returns Array of tag names
     */
    getTagsForNote(noteId) {
        try {
            const tags = this.db.prepare(`
        SELECT 
          t.ZTITLE as name
        FROM 
          ZSFNOTETAG t
        JOIN 
          Z_5TAGS nt ON t.Z_PK = nt.Z_13TAGS
        JOIN 
          ZSFNOTE n ON n.Z_PK = nt.Z_5NOTES
        WHERE 
          n.ZUNIQUEIDENTIFIER = ?
        ORDER BY 
          name
      `).all(noteId);
            return tags.map((tag) => tag.name);
        }
        catch (error) {
            console.error(`Error getting tags for note ${noteId}:`, error);
            return [];
        }
    }
}
//# sourceMappingURL=bear-db.js.map