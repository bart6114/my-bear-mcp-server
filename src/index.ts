#!/usr/bin/env node
/**
 * Bear MCP Server
 * 
 * A Model Context Protocol server for interacting with the Bear note-taking app.
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
import { BearAPI } from './bear-api.js';

// Define the command-line interface
const program = new Command();
program
  .name('bear-mcp-server')
  .description('MCP server for interacting with the Bear note-taking app')
  .version('1.0.0')
  .option('--token <token>', 'Bear API token')
  .parse(process.argv);

const options = program.opts();

// Create the Bear API client
const bearApi = new BearAPI({
  token: options.token,
});

// Define tool schemas
const openNoteSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'Note unique identifier' },
    title: { type: 'string', description: 'Note title' },
    header: { type: 'string', description: 'An header inside the note' },
    exclude_trashed: { type: 'boolean', description: 'If true, exclude trashed notes' },
    new_window: { type: 'boolean', description: 'If true, open the note in an external window (MacOS only)' },
    float: { type: 'boolean', description: 'If true, makes the external window float on top (MacOS only)' },
    show_window: { type: 'boolean', description: 'If false, the call doesn\'t force the opening of bear main window (MacOS only)' },
    open_note: { type: 'boolean', description: 'If false, do not display the new note in Bear\'s main or external window' },
    selected: { type: 'boolean', description: 'If true, return the note currently selected in Bear (token required)' },
    pin: { type: 'boolean', description: 'If true, pin the note to the top of the list' },
    edit: { type: 'boolean', description: 'If true, place the cursor inside the note editor' },
    search: { type: 'string', description: 'Opens the in-note find&replace panel with the specified text' },
  },
};

const createNoteSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Note title' },
    text: { type: 'string', description: 'Note body' },
    clipboard: { type: 'boolean', description: 'If true, use the text currently available in the clipboard' },
    tags: {
      oneOf: [
        { type: 'string', description: 'Comma-separated list of tags' },
        { type: 'array', items: { type: 'string' }, description: 'Array of tags' },
      ],
      description: 'Tags to add to the note',
    },
    open_note: { type: 'boolean', description: 'If false, do not display the new note in Bear\'s main or external window' },
    new_window: { type: 'boolean', description: 'If true, open the note in an external window (MacOS only)' },
    float: { type: 'boolean', description: 'If true, make the external window float on top (MacOS only)' },
    show_window: { type: 'boolean', description: 'If false, the call doesn\'t force the opening of bear main window (MacOS only)' },
    pin: { type: 'boolean', description: 'If true, pin the note to the top of the list' },
    edit: { type: 'boolean', description: 'If true, place the cursor inside the note editor' },
    timestamp: { type: 'boolean', description: 'If true, prepend the current date and time to the text' },
  },
  required: ['title', 'text'],
};

const addTextSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'Note unique identifier' },
    title: { type: 'string', description: 'Title of the note' },
    selected: { type: 'boolean', description: 'If true, use the note currently selected in Bear (token required)' },
    text: { type: 'string', description: 'Text to add' },
    clipboard: { type: 'boolean', description: 'If true, use the text currently available in the clipboard' },
    header: { type: 'string', description: 'If specified, add the text to the corresponding header inside the note' },
    mode: {
      type: 'string',
      enum: ['prepend', 'append', 'replace_all', 'replace'],
      description: 'How to add the text to the note',
    },
    new_line: { type: 'boolean', description: 'If true and mode is append, force the text to appear on a new line inside the note' },
    tags: {
      oneOf: [
        { type: 'string', description: 'Comma-separated list of tags' },
        { type: 'array', items: { type: 'string' }, description: 'Array of tags' },
      ],
      description: 'Tags to add to the note',
    },
    exclude_trashed: { type: 'boolean', description: 'If true, exclude trashed notes' },
    open_note: { type: 'boolean', description: 'If false, do not display the new note in Bear\'s main or external window' },
    new_window: { type: 'boolean', description: 'If true, open the note in an external window (MacOS only)' },
    show_window: { type: 'boolean', description: 'If false, the call doesn\'t force the opening of bear main window (MacOS only)' },
    edit: { type: 'boolean', description: 'If true, place the cursor inside the note editor' },
    timestamp: { type: 'boolean', description: 'If true, prepend the current date and time to the text' },
  },
};

const searchNotesSchema = {
  type: 'object',
  properties: {
    term: { type: 'string', description: 'String to search' },
    tag: { type: 'string', description: 'Tag to search into' },
    show_window: { type: 'boolean', description: 'If false, the call doesn\'t force the opening of bear main window (MacOS only)' },
  },
};

const grabUrlSchema = {
  type: 'object',
  properties: {
    url: { type: 'string', description: 'URL to grab' },
    tags: {
      oneOf: [
        { type: 'string', description: 'Comma-separated list of tags' },
        { type: 'array', items: { type: 'string' }, description: 'Array of tags' },
      ],
      description: 'Tags to add to the note',
    },
    pin: { type: 'boolean', description: 'If true, pin the note to the top of the list' },
    wait: { type: 'boolean', description: 'If false, x-success is immediately called without identifier and title' },
  },
  required: ['url'],
};

const getTagsSchema = {
  type: 'object',
  properties: {},
};

const openTagSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Tag name or a list of tags divided by comma' },
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
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Sets up the tool handlers for the server
   */
  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'open_note',
          description: 'Open a note identified by its title or id and return its content',
          inputSchema: openNoteSchema,
        },
        {
          name: 'create_note',
          description: 'Create a new note and return its unique identifier',
          inputSchema: createNoteSchema,
        },
        {
          name: 'add_text',
          description: 'Append or prepend text to a note identified by its title or id',
          inputSchema: addTextSchema,
        },
        {
          name: 'search_notes',
          description: 'Show search results in Bear for all notes or for a specific tag',
          inputSchema: searchNotesSchema,
        },
        {
          name: 'grab_url',
          description: 'Create a new note with the content of a web page',
          inputSchema: grabUrlSchema,
        },
        {
          name: 'get_tags',
          description: 'Return all the tags currently displayed in Bear\'s sidebar',
          inputSchema: getTagsSchema,
        },
        {
          name: 'open_tag',
          description: 'Show all the notes which have a selected tag in bear',
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
          case 'create_note':
            return await this.handleCreateNote(args);
          case 'add_text':
            return await this.handleAddText(args);
          case 'search_notes':
            return await this.handleSearchNotes(args);
          case 'grab_url':
            return await this.handleGrabUrl(args);
          case 'get_tags':
            return await this.handleGetTags();
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
      const result = await bearApi.openNote(args);
      
      // Check if note content is available in the result
      if (result && typeof result === 'object' && 'note' in result) {
        // Limit content size to avoid 431 errors
        let content = result.note;
        const MAX_CONTENT_LENGTH = 10000;
        let contentTruncated = false;
        
        if (content && content.length > MAX_CONTENT_LENGTH) {
          content = content.substring(0, MAX_CONTENT_LENGTH) + '... [Content truncated due to size]';
          contentTruncated = true;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `Note opened successfully.

Note content:
${content}${contentTruncated ? '\n\n[Note content was truncated to prevent 431 errors]' : ''}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `Note opened successfully.`,
            },
          ],
        };
      }
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
   * Handles the create_note tool
   * @param args Tool arguments
   * @returns Tool result
   */
  private async handleCreateNote(args: any) {
    try {
      const result = await bearApi.createNote(args);
      
      // Check if identifier is available in the result
      if (result && typeof result === 'object' && 'identifier' in result) {
        return {
          content: [
            {
              type: 'text',
              text: `Note created successfully with title: "${args.title}"
              
Note ID: ${result.identifier}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `Note created successfully with title: "${args.title}"`,
            },
          ],
        };
      }
    } catch (error) {
      console.error('Error handling create_note:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error creating note: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handles the add_text tool
   * @param args Tool arguments
   * @returns Tool result
   */
  private async handleAddText(args: any) {
    try {
      const result = await bearApi.addText(args);
      
      // Check if note content is available in the result
      if (result && typeof result === 'object' && 'note' in result) {
        // Limit content size to avoid 431 errors
        let content = result.note;
        const MAX_CONTENT_LENGTH = 10000;
        let contentTruncated = false;
        
        if (content && content.length > MAX_CONTENT_LENGTH) {
          content = content.substring(0, MAX_CONTENT_LENGTH) + '... [Content truncated due to size]';
          contentTruncated = true;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `Text added successfully to note.
              
Updated note content:
${content}${contentTruncated ? '\n\n[Note content was truncated to prevent 431 errors]' : ''}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `Text added successfully to note.`,
            },
          ],
        };
      }
    } catch (error) {
      console.error('Error handling add_text:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error adding text to note: ${error instanceof Error ? error.message : String(error)}`,
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
      const result = await bearApi.searchNotes(args);
      
      // Check if notes array is available in the result
      if (result && typeof result === 'object' && 'notes' in result) {
        let notes;
        try {
          // Try to parse the notes if it's a string
          notes = typeof result.notes === 'string' ? JSON.parse(result.notes) : result.notes;
        } catch (e) {
          notes = result.notes;
        }
        
        if (!Array.isArray(notes) || notes.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `Search performed successfully in the Bear app, but no results were found.
                
Search parameters:
${args.term ? `- Search term: ${args.term}` : ''}
${args.tag ? `- Tag filter: ${args.tag}` : ''}`,
              },
            ],
          };
        }
        
        // Limit the number of notes to process to avoid 431 errors
        const MAX_NOTES = 10;
        const notesToProcess = notes.slice(0, MAX_NOTES);
        const hasMoreNotes = notes.length > MAX_NOTES;
        
        // Get the full content of each note
        const fullNotes = [];
        for (const note of notesToProcess) {
          try {
            // Open each note to get its full content
            const noteResult = await bearApi.openNote({
              id: note.identifier,
              show_window: false, // Don't open the note in Bear UI
              open_note: false    // Don't display the note
            });
            
            const tagsList = note.tags && Array.isArray(note.tags) ? `Tags: ${note.tags.join(', ')}` : '';
            
            // Limit content size to avoid 431 errors
            let content = noteResult.note || 'Content not available';
            const MAX_CONTENT_LENGTH = 5000;
            if (content.length > MAX_CONTENT_LENGTH) {
              content = content.substring(0, MAX_CONTENT_LENGTH) + '... [Content truncated due to size]';
            }
            
            fullNotes.push({
              title: note.title,
              id: note.identifier,
              tags: tagsList,
              content: content
            });
          } catch (e) {
            console.error(`Error getting content for note ${note.identifier}:`, e);
            fullNotes.push({
              title: note.title,
              id: note.identifier,
              tags: note.tags && Array.isArray(note.tags) ? `Tags: ${note.tags.join(', ')}` : '',
              content: 'Error retrieving content'
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
              text: `Search performed successfully in the Bear app.

Search parameters:
${args.term ? `- Search term: ${args.term}` : ''}
${args.tag ? `- Tag filter: ${args.tag}` : ''}

Found ${notes.length} matching notes${hasMoreNotes ? ` (showing first ${MAX_NOTES})` : ''}:

${formattedNotes}${hasMoreNotes ? '\n\n[Additional notes were found but not displayed to prevent 431 errors]' : ''}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `Search performed successfully in the Bear app, but no results were returned.
              
Search parameters:
${args.term ? `- Search term: ${args.term}` : ''}
${args.tag ? `- Tag filter: ${args.tag}` : ''}`,
            },
          ],
        };
      }
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
   * Handles the grab_url tool
   * @param args Tool arguments
   * @returns Tool result
   */
  private async handleGrabUrl(args: any) {
    try {
      const result = await bearApi.grabURL(args);
      
      // Check if identifier is available in the result
      if (result && typeof result === 'object' && 'identifier' in result) {
        return {
          content: [
            {
              type: 'text',
              text: `URL grabbed successfully: ${args.url}
              
Note ID: ${result.identifier}
Title: ${result.title || 'N/A'}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `URL grabbed successfully: ${args.url}`,
            },
          ],
        };
      }
    } catch (error) {
      console.error('Error handling grab_url:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error grabbing URL: ${error instanceof Error ? error.message : String(error)}`,
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
  private async handleGetTags() {
    try {
      const result = await bearApi.getTags();
      
      // Check if tags array is available in the result
      if (result && typeof result === 'object' && 'tags' in result) {
        let tags;
        try {
          // Try to parse the tags if it's a string
          tags = typeof result.tags === 'string' ? JSON.parse(result.tags) : result.tags;
        } catch (e) {
          tags = result.tags;
        }
        
        // Format the tags
        const formattedTags = Array.isArray(tags) 
          ? tags.map((tag: any) => `- ${tag.name}`).join('\n')
          : 'No tags found or invalid response format.';
        
        return {
          content: [
            {
              type: 'text',
              text: `Tags retrieved successfully from Bear:

${formattedTags}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `Tags retrieved successfully, but no tags were returned.`,
            },
          ],
        };
      }
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
      const result = await bearApi.openTag(args);
      
      // Check if notes array is available in the result
      if (result && typeof result === 'object' && 'notes' in result) {
        let notes;
        try {
          // Try to parse the notes if it's a string
          notes = typeof result.notes === 'string' ? JSON.parse(result.notes) : result.notes;
        } catch (e) {
          notes = result.notes;
        }
        
        if (!Array.isArray(notes) || notes.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `Tag opened successfully: ${args.name}, but no notes were found with this tag.`,
              },
            ],
          };
        }
        
        // Limit the number of notes to process to avoid 431 errors
        const MAX_NOTES = 50;
        const notesToProcess = notes.slice(0, MAX_NOTES);
        const hasMoreNotes = notes.length > MAX_NOTES;
        
        // Format the notes
        const formattedNotes = notesToProcess.map((note: any) => {
          const tagsList = note.tags && Array.isArray(note.tags) ? ` (Tags: ${note.tags.join(', ')})` : '';
          return `- ${note.title} (ID: ${note.identifier})${tagsList}`;
        }).join('\n');
        
        return {
          content: [
            {
              type: 'text',
              text: `Tag opened successfully: ${args.name}

Found ${notes.length} notes with this tag${hasMoreNotes ? ` (showing first ${MAX_NOTES})` : ''}:

${formattedNotes}${hasMoreNotes ? '\n\n[Additional notes were found but not displayed to prevent 431 errors]' : ''}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `Tag opened successfully: ${args.name}
              
No notes were returned for this tag.`,
            },
          ],
        };
      }
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
    // Check if token is provided
    if (!options.token) {
      console.warn('Warning: No Bear API token provided. Some functionality may be limited.');
      console.warn('To provide a token, use the --token option.');
    }
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Bear MCP server running on stdio');
  }
}

// Create and run the server
const server = new BearMCPServer();
server.run().catch(console.error);
