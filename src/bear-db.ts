/**
 * BearDB client for interacting with the Bear app's SQLite database
 */

import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';

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
 * Note structure from database
 */
interface NoteRecord {
  id: string;
  title: string;
  text: string;
  trashed: number;
}

/**
 * Tag structure from database
 */
interface TagRecord {
  name: string;
}

/**
 * Client for interacting with the Bear app's SQLite database
 */
export class BearDB {
  private db: Database.Database;
  private readonly defaultDbPath: string;

  /**
   * Creates a new BearDB client
   * @param options Options for the client
   */
  constructor(options: BearDBOptions = {}) {
    this.defaultDbPath = join(
      homedir(),
      'Library/Group Containers/9K33E3U3T4.net.shinyfrog.bear/Application Data/database.sqlite'
    );
    
    const dbPath = options.databasePath || this.defaultDbPath;
    
    try {
      // Open the database in read-only mode
      this.db = new Database(dbPath, { readonly: true });
      console.log(`🗃️  \x1b[36mConnected to Bear database at\x1b[0m
\x1b[33m${dbPath}\x1b[0m
\x1b[36min read-only mode\x1b[0m`);
    } catch (error) {
      console.error(`Failed to connect to Bear database at ${dbPath}:`, error);
      throw new Error(`Failed to connect to Bear database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Closes the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
    }
  }

  /**
   * Gets a note by its ID or title
   * @param params Parameters for opening the note
   * @returns The note data
   */
  getNoteByIdOrTitle(params: OpenNoteParams): { note: string; title: string; id: string } | null {
    try {
      let note: NoteRecord | undefined;
      
      if (params.id) {
        // Get note by ID
        note = this.db.prepare(`
          SELECT ZUNIQUEIDENTIFIER as id, ZTITLE as title, ZTEXT as text, ZTRASHED as trashed
          FROM ZSFNOTE
          WHERE ZUNIQUEIDENTIFIER = ?
        `).get(params.id) as NoteRecord | undefined;
      } else if (params.title) {
        // Get note by title
        note = this.db.prepare(`
          SELECT ZUNIQUEIDENTIFIER as id, ZTITLE as title, ZTEXT as text, ZTRASHED as trashed
          FROM ZSFNOTE
          WHERE ZTITLE = ?
        `).get(params.title) as NoteRecord | undefined;
      } else {
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
        } else {
          // Header not found
          return null;
        }
      }
      
      return {
        note: noteText,
        title: note.title,
        id: note.id
      };
    } catch (error) {
      console.error('Error getting note:', error);
      throw new Error(`Failed to get note: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Searches for notes
   * @param params Parameters for searching
   * @returns Array of matching notes
   */
  searchNotes(params: SearchParams): Array<{ identifier: string; title: string; tags: string[] }> {
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
      
      const queryParams: any[] = [];
      
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
      const notes = this.db.prepare(query).all(...queryParams) as Array<{ identifier: string; title: string }>;
      
      // Get tags for each note
      return notes.map((note) => {
        const tags = this.getTagsForNote(note.identifier);
        return {
          identifier: note.identifier,
          title: note.title,
          tags
        };
      });
    } catch (error) {
      console.error('Error searching notes:', error);
      throw new Error(`Failed to search notes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets all tags
   * @returns Array of tags
   */
  getTags(): Array<{ name: string }> {
    try {
      const tags = this.db.prepare(`
        SELECT ZTITLE as name
        FROM ZSFNOTETAG
        ORDER BY name
      `).all() as Array<TagRecord>;
      
      return tags;
    } catch (error) {
      console.error('Error getting tags:', error);
      throw new Error(`Failed to get tags: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets notes with a specific tag
   * @param tagName The tag name
   * @returns Array of notes with the tag
   */
  getNotesByTag(tagName: string): Array<{ identifier: string; title: string; tags: string[] }> {
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
      `).all(tagName) as Array<{ identifier: string; title: string }>;
      
      // Get tags for each note
      return notes.map((note) => {
        const tags = this.getTagsForNote(note.identifier);
        return {
          identifier: note.identifier,
          title: note.title,
          tags
        };
      });
    } catch (error) {
      console.error('Error getting notes by tag:', error);
      throw new Error(`Failed to get notes by tag: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets tags for a note
   * @param noteId The note ID
   * @returns Array of tag names
   */
  private getTagsForNote(noteId: string): string[] {
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
      `).all(noteId) as Array<TagRecord>;
      
      return tags.map((tag) => tag.name);
    } catch (error) {
      console.error(`Error getting tags for note ${noteId}:`, error);
      return [];
    }
  }
}
