#!/usr/bin/env node
/**
 * Bear MCP Server
 * 
 * A Model Context Protocol server for interacting with the Bear note-taking app's SQLite database.
 * This server provides read-only access to Bear notes and tags.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { Command } from 'commander';
import { BearDB } from './bear-db.js';

// Define the command-line interface
const program = new Command();
program
  .name('bear-mcp-server')
  .description('MCP server for read-only access to the Bear note-taking app database')
  .version('1.0.0')
  .option('--db-path <path>', 'Path to Bear SQLite database (defaults to standard location)')
  .parse(process.argv);

const options = program.opts();

// Create the Bear DB client
const bearDb = new BearDB({
  databasePath: options.dbPath,
});

// Define tool schemas
const openNoteSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'Note unique identifier' },
    title: { type: 'string', description: 'Note title' },
    header: { type: 'string', description: 'An header inside the note' },
    exclude_trashed: { type: 'boolean', description: 'If true, exclude trashed notes' },
  },
};

const searchNotesSchema = {
  type: 'object',
  properties: {
    term: { type: 'string', description: 'String to search' },
    tag: { type: 'string', description: 'Tag to search into' },
    max_notes: { type: 'number', description: 'Maximum number of notes to return (default: 25)' },
  },
};

const getTagsSchema = {
  type: 'object',
  properties: {
    max_tags: { type: 'number', description: 'Maximum number of tags to return (default: 100)' },
  },
};

const openTagSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Tag name' },
    max_notes: { type: 'number', description: 'Maximum number of notes to return (default: 25)' },
  },
  required: ['name'],
};

/**
 * Bear MCP Server
 */
class BearMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'bear-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      bearDb.close();
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Sets up the tool handlers for the server
   */
  private setupToolHandlers() {
    // List available tools - all read-only
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'open_note',
          description: 'Open a note identified by its title or id and return its content',
          inputSchema: openNoteSchema,
        },
        {
          name: 'search_notes',
          description: 'Search for notes by term or tag',
          inputSchema: searchNotesSchema,
        },
        {
          name: 'get_tags',
          description: 'Return all the tags currently in Bear',
          inputSchema: getTagsSchema,
        },
        {
          name: 'open_tag',
          description: 'Show all the notes which have a selected tag',
          inputSchema: openTagSchema,
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        switch (name) {
          case 'open_note':
            return await this.handleOpenNote(args);
          case 'search_notes':
            return await this.handleSearchNotes(args);
          case 'get_tags':
            return await this.handleGetTags(args);
          case 'open_tag':
            return await this.handleOpenTag(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        console.error(`Error handling tool ${name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Handles the open_note tool
   * @param args Tool arguments
   * @returns Tool result
   */
  private async handleOpenNote(args: any) {
    try {
      const result = bearDb.getNoteByIdOrTitle(args);
      
      if (!result) {
        return {
          content: [
            {
              type: 'text',
              text: `Note not found.`,
            },
          ],
          isError: true,
        };
      }
      
      let content = result.note;
      
      return {
        content: [
          {
            type: 'text',
            text: `Note opened successfully.

Title: ${result.title}
ID: ${result.id}

Note content:
${content}`,
          },
        ],
      };
    } catch (error) {
      console.error('Error handling open_note:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error opening note: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handles the search_notes tool
   * @param args Tool arguments
   * @returns Tool result
   */
  private async handleSearchNotes(args: any) {
    try {
      const notes = bearDb.searchNotes(args);
      
      if (!notes || notes.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No notes found matching the search criteria.
              
Search parameters:
${args.term ? `- Search term: ${args.term}` : ''}
${args.tag ? `- Tag filter: ${args.tag}` : ''}`,
            },
          ],
        };
      }
      
      // Apply max_notes limit if specified (default: 25)
      const maxNotes = args.max_notes !== undefined ? args.max_notes : 25;
      const limitedNotes = notes.slice(0, maxNotes);
      const hasMoreNotes = notes.length > maxNotes;
      
      // Get the full content of each note
      const fullNotes = [];
      for (const note of limitedNotes) {
        try {
          // Get the full content of each note
          const noteResult = bearDb.getNoteByIdOrTitle({
            id: note.identifier
          });
          
          if (noteResult) {
            const tagsList = note.tags && Array.isArray(note.tags) ? `Tags: ${note.tags.join(', ')}` : '';
            
            let content = noteResult.note || 'Content not available';
            
            fullNotes.push({
              title: note.title,
              id: note.identifier,
              tags: tagsList,
              content: content
            });
          }
        } catch (e) {
          console.error(`Error getting content for note ${note.identifier}:`, e);
          fullNotes.push({
            title: note.title,
            id: note.identifier,
            tags: note.tags && Array.isArray(note.tags) ? `Tags: ${note.tags.join(', ')}` : '',
            content: 'Error retrieving content',
            truncated: false
          });
        }
      }
      
      // Format the search results with full content
      const formattedNotes = fullNotes.map(note => {
        return `## ${note.title} (ID: ${note.id})
${note.tags ? `${note.tags}\n` : ''}
${note.content}
---`;
      }).join('\n\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `Search performed successfully.

Search parameters:
${args.term ? `- Search term: ${args.term}` : ''}
${args.tag ? `- Tag filter: ${args.tag}` : ''}

Found ${notes.length} matching notes${hasMoreNotes ? ` (showing ${limitedNotes.length})` : ''}:
${hasMoreNotes ? `\n(Note: Results limited to ${maxNotes} notes. Use max_notes parameter to adjust this limit.)\n` : ''}

${formattedNotes}`,
          },
        ],
      };
    } catch (error) {
      console.error('Error handling search_notes:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error performing search: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handles the get_tags tool
   * @returns Tool result
   */
  private async handleGetTags(args: any = {}) {
    try {
      const tags = bearDb.getTags();
      
      if (!tags || tags.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No tags found in Bear.`,
            },
          ],
        };
      }
      
      // Apply max_tags limit if specified (default: 100)
      const maxTags = args.max_tags !== undefined ? args.max_tags : 100;
      const limitedTags = tags.slice(0, maxTags);
      const hasMoreTags = tags.length > maxTags;
      
      // Format the tags
      const formattedTags = limitedTags.map(tag => `- ${tag.name}`).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `Tags retrieved successfully from Bear:
${hasMoreTags ? `\nFound ${tags.length} tags (showing ${limitedTags.length})` : ''}
${hasMoreTags ? `\n(Note: Results limited to ${maxTags} tags. Use max_tags parameter to adjust this limit.)\n` : ''}

${formattedTags}`,
          },
        ],
      };
    } catch (error) {
      console.error('Error handling get_tags:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving tags: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handles the open_tag tool
   * @param args Tool arguments
   * @returns Tool result
   */
  private async handleOpenTag(args: any) {
    try {
      const notes = bearDb.getNotesByTag(args.name);
      
      if (!notes || notes.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No notes found with tag: ${args.name}`,
            },
          ],
        };
      }
      
      // Apply max_notes limit if specified (default: 25)
      const maxNotes = args.max_notes !== undefined ? args.max_notes : 25;
      const limitedNotes = notes.slice(0, maxNotes);
      const hasMoreNotes = notes.length > maxNotes;
      
      // Format the notes
      const formattedNotes = limitedNotes.map(note => {
        const tagsList = note.tags && Array.isArray(note.tags) ? ` (Tags: ${note.tags.join(', ')})` : '';
        return `- ${note.title} (ID: ${note.identifier})${tagsList}`;
      }).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${notes.length} matching notes${hasMoreNotes ? ` (showing ${limitedNotes.length})` : ''} with tag: ${args.name}
${hasMoreNotes ? `\n(Note: Results limited to ${maxNotes} notes. Use max_notes parameter to adjust this limit.)\n` : ''}

${formattedNotes}`,
          },
        ],
      };
    } catch (error) {
      console.error('Error handling open_tag:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error opening tag: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Runs the server
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🐻 \x1b[32mBear MCP server running on stdio\x1b[0m');
  }
}

// Create and run the server
const server = new BearMCPServer();
server.run().catch(console.error);
