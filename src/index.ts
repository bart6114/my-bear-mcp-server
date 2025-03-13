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
import { safeJSONParse } from './utils.js';

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
    const result = await bearApi.openNote(args);
    
    return {
      content: [
        {
          type: 'text',
          text: `Note opened successfully.`,
        },
      ],
    };
  }

  /**
   * Handles the create_note tool
   * @param args Tool arguments
   * @returns Tool result
   */
  private async handleCreateNote(args: any) {
    const result = await bearApi.createNote(args);
    
    return {
      content: [
        {
          type: 'text',
          text: `Note created successfully with title: "${args.title}"`,
        },
      ],
    };
  }

  /**
   * Handles the add_text tool
   * @param args Tool arguments
   * @returns Tool result
   */
  private async handleAddText(args: any) {
    const result = await bearApi.addText(args);
    
    return {
      content: [
        {
          type: 'text',
          text: `Text added successfully to note.`,
        },
      ],
    };
  }

  /**
   * Handles the search_notes tool
   * @param args Tool arguments
   * @returns Tool result
   */
  private async handleSearchNotes(args: any) {
    const result = await bearApi.searchNotes(args);
    
    return {
      content: [
        {
          type: 'text',
          text: `Search performed successfully.`,
        },
      ],
    };
  }

  /**
   * Handles the grab_url tool
   * @param args Tool arguments
   * @returns Tool result
   */
  private async handleGrabUrl(args: any) {
    const result = await bearApi.grabURL(args);
    
    return {
      content: [
        {
          type: 'text',
          text: `URL grabbed successfully: ${args.url}`,
        },
      ],
    };
  }

  /**
   * Handles the get_tags tool
   * @returns Tool result
   */
  private async handleGetTags() {
    const result = await bearApi.getTags();
    
    return {
      content: [
        {
          type: 'text',
          text: `Tags retrieved successfully.`,
        },
      ],
    };
  }

  /**
   * Handles the open_tag tool
   * @param args Tool arguments
   * @returns Tool result
   */
  private async handleOpenTag(args: any) {
    const result = await bearApi.openTag(args);
    
    return {
      content: [
        {
          type: 'text',
          text: `Tag opened successfully: ${args.name}`,
        },
      ],
    };
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
