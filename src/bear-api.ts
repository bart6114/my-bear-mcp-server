/**
 * Bear API client for interacting with the Bear app using x-callback-url
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { encodeURIComponentSafe, formatTags, validateAndFormatBoolean, validateNonEmptyString } from './utils.js';

const execPromise = promisify(exec);

/**
 * Options for the BearAPI client
 */
export interface BearAPIOptions {
  token?: string;
}

/**
 * Parameters for opening a note
 */
export interface OpenNoteParams {
  id?: string;
  title?: string;
  header?: string;
  exclude_trashed?: boolean | 'yes' | 'no';
  new_window?: boolean | 'yes' | 'no';
  float?: boolean | 'yes' | 'no';
  show_window?: boolean | 'yes' | 'no';
  open_note?: boolean | 'yes' | 'no';
  selected?: boolean | 'yes' | 'no';
  pin?: boolean | 'yes' | 'no';
  edit?: boolean | 'yes' | 'no';
  search?: string;
}

/**
 * Parameters for creating a note
 */
export interface CreateNoteParams {
  title?: string;
  text?: string;
  clipboard?: boolean | 'yes' | 'no';
  tags?: string | string[];
  file?: string;
  filename?: string;
  open_note?: boolean | 'yes' | 'no';
  new_window?: boolean | 'yes' | 'no';
  float?: boolean | 'yes' | 'no';
  show_window?: boolean | 'yes' | 'no';
  pin?: boolean | 'yes' | 'no';
  edit?: boolean | 'yes' | 'no';
  timestamp?: boolean | 'yes' | 'no';
  type?: 'html' | string;
  url?: string;
}

/**
 * Parameters for adding text to a note
 */
export interface AddTextParams {
  id?: string;
  title?: string;
  selected?: boolean | 'yes' | 'no';
  text?: string;
  clipboard?: boolean | 'yes' | 'no';
  header?: string;
  mode?: 'prepend' | 'append' | 'replace_all' | 'replace';
  new_line?: boolean | 'yes' | 'no';
  tags?: string | string[];
  exclude_trashed?: boolean | 'yes' | 'no';
  open_note?: boolean | 'yes' | 'no';
  new_window?: boolean | 'yes' | 'no';
  show_window?: boolean | 'yes' | 'no';
  edit?: boolean | 'yes' | 'no';
  timestamp?: boolean | 'yes' | 'no';
}

/**
 * Parameters for adding a file to a note
 */
export interface AddFileParams {
  id?: string;
  title?: string;
  selected?: boolean | 'yes' | 'no';
  file: string;
  header?: string;
  filename: string;
  mode?: 'prepend' | 'append' | 'replace_all' | 'replace';
  open_note?: boolean | 'yes' | 'no';
  new_window?: boolean | 'yes' | 'no';
  show_window?: boolean | 'yes' | 'no';
  edit?: boolean | 'yes' | 'no';
}

/**
 * Parameters for opening a tag
 */
export interface OpenTagParams {
  name: string;
  token?: string;
}

/**
 * Parameters for renaming a tag
 */
export interface RenameTagParams {
  name: string;
  new_name: string;
  show_window?: boolean | 'yes' | 'no';
}

/**
 * Parameters for deleting a tag
 */
export interface DeleteTagParams {
  name: string;
  show_window?: boolean | 'yes' | 'no';
}

/**
 * Parameters for trashing a note
 */
export interface TrashParams {
  id?: string;
  search?: string;
  show_window?: boolean | 'yes' | 'no';
}

/**
 * Parameters for archiving a note
 */
export interface ArchiveParams {
  id?: string;
  search?: string;
  show_window?: boolean | 'yes' | 'no';
}

/**
 * Parameters for searching notes
 */
export interface SearchParams {
  term?: string;
  tag?: string;
  show_window?: boolean | 'yes' | 'no';
  token?: string;
}

/**
 * Parameters for grabbing a URL
 */
export interface GrabURLParams {
  url: string;
  tags?: string | string[];
  pin?: boolean | 'yes' | 'no';
  wait?: boolean | 'yes' | 'no';
}

/**
 * Parameters for showing untagged notes
 */
export interface UntaggedParams {
  search?: string;
  show_window?: boolean | 'yes' | 'no';
  token?: string;
}

/**
 * Parameters for showing todo notes
 */
export interface TodoParams {
  search?: string;
  show_window?: boolean | 'yes' | 'no';
  token?: string;
}

/**
 * Parameters for showing today's notes
 */
export interface TodayParams {
  search?: string;
  show_window?: boolean | 'yes' | 'no';
  token?: string;
}

/**
 * Parameters for showing locked notes
 */
export interface LockedParams {
  search?: string;
  show_window?: boolean | 'yes' | 'no';
}

/**
 * Client for interacting with the Bear app using x-callback-url
 */
export class BearAPI {
  private token?: string;

  /**
   * Creates a new BearAPI client
   * @param options Options for the client
   */
  constructor(options: BearAPIOptions = {}) {
    this.token = options.token;
  }

  /**
   * Sets the token for the client
   * @param token The token to set
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Executes a Bear x-callback-url command
   * @param action The action to execute
   * @param params The parameters for the action
   * @returns The result of the command
   */
  private async executeCommand(action: string, params: Record<string, string> = {}): Promise<string> {
    // Build the URL
    let url = `bear://x-callback-url/${action}`;
    
    // Add parameters
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    }
    
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    // Execute the command
    try {
      const { stdout } = await execPromise(`open "${url}"`);
      return stdout;
    } catch (error) {
      console.error('Error executing Bear command:', error);
      throw new Error(`Failed to execute Bear command: ${error}`);
    }
  }

  /**
   * Opens a note in Bear
   * @param params Parameters for opening the note
   * @returns The result of the command
   */
  async openNote(params: OpenNoteParams): Promise<string> {
    const commandParams: Record<string, string> = {};
    
    if (params.id) commandParams.id = params.id;
    if (params.title) commandParams.title = params.title;
    if (params.header) commandParams.header = params.header;
    if (params.exclude_trashed !== undefined) commandParams.exclude_trashed = validateAndFormatBoolean(params.exclude_trashed, 'exclude_trashed');
    if (params.new_window !== undefined) commandParams.new_window = validateAndFormatBoolean(params.new_window, 'new_window');
    if (params.float !== undefined) commandParams.float = validateAndFormatBoolean(params.float, 'float');
    if (params.show_window !== undefined) commandParams.show_window = validateAndFormatBoolean(params.show_window, 'show_window');
    if (params.open_note !== undefined) commandParams.open_note = validateAndFormatBoolean(params.open_note, 'open_note');
    if (params.selected !== undefined) commandParams.selected = validateAndFormatBoolean(params.selected, 'selected');
    if (params.pin !== undefined) commandParams.pin = validateAndFormatBoolean(params.pin, 'pin');
    if (params.edit !== undefined) commandParams.edit = validateAndFormatBoolean(params.edit, 'edit');
    if (params.search) commandParams.search = params.search;
    
    // Add token if selected is true
    if (params.selected === true || params.selected === 'yes') {
      if (!this.token) {
        throw new Error('Token is required when selected is true');
      }
      commandParams.token = this.token;
    }
    
    return this.executeCommand('open-note', commandParams);
  }

  /**
   * Creates a new note in Bear
   * @param params Parameters for creating the note
   * @returns The result of the command
   */
  async createNote(params: CreateNoteParams): Promise<string> {
    const commandParams: Record<string, string> = {};
    
    if (params.title) commandParams.title = params.title;
    if (params.text) commandParams.text = params.text;
    if (params.clipboard !== undefined) commandParams.clipboard = validateAndFormatBoolean(params.clipboard, 'clipboard');
    if (params.tags) commandParams.tags = formatTags(params.tags);
    if (params.file) commandParams.file = params.file;
    if (params.filename) commandParams.filename = params.filename;
    if (params.open_note !== undefined) commandParams.open_note = validateAndFormatBoolean(params.open_note, 'open_note');
    if (params.new_window !== undefined) commandParams.new_window = validateAndFormatBoolean(params.new_window, 'new_window');
    if (params.float !== undefined) commandParams.float = validateAndFormatBoolean(params.float, 'float');
    if (params.show_window !== undefined) commandParams.show_window = validateAndFormatBoolean(params.show_window, 'show_window');
    if (params.pin !== undefined) commandParams.pin = validateAndFormatBoolean(params.pin, 'pin');
    if (params.edit !== undefined) commandParams.edit = validateAndFormatBoolean(params.edit, 'edit');
    if (params.timestamp !== undefined) commandParams.timestamp = validateAndFormatBoolean(params.timestamp, 'timestamp');
    if (params.type) commandParams.type = params.type;
    if (params.url) commandParams.url = params.url;
    
    return this.executeCommand('create', commandParams);
  }

  /**
   * Adds text to a note in Bear
   * @param params Parameters for adding text
   * @returns The result of the command
   */
  async addText(params: AddTextParams): Promise<string> {
    const commandParams: Record<string, string> = {};
    
    if (params.id) commandParams.id = params.id;
    if (params.title) commandParams.title = params.title;
    if (params.selected !== undefined) commandParams.selected = validateAndFormatBoolean(params.selected, 'selected');
    if (params.text) commandParams.text = params.text;
    if (params.clipboard !== undefined) commandParams.clipboard = validateAndFormatBoolean(params.clipboard, 'clipboard');
    if (params.header) commandParams.header = params.header;
    if (params.mode) commandParams.mode = params.mode;
    if (params.new_line !== undefined) commandParams.new_line = validateAndFormatBoolean(params.new_line, 'new_line');
    if (params.tags) commandParams.tags = formatTags(params.tags);
    if (params.exclude_trashed !== undefined) commandParams.exclude_trashed = validateAndFormatBoolean(params.exclude_trashed, 'exclude_trashed');
    if (params.open_note !== undefined) commandParams.open_note = validateAndFormatBoolean(params.open_note, 'open_note');
    if (params.new_window !== undefined) commandParams.new_window = validateAndFormatBoolean(params.new_window, 'new_window');
    if (params.show_window !== undefined) commandParams.show_window = validateAndFormatBoolean(params.show_window, 'show_window');
    if (params.edit !== undefined) commandParams.edit = validateAndFormatBoolean(params.edit, 'edit');
    if (params.timestamp !== undefined) commandParams.timestamp = validateAndFormatBoolean(params.timestamp, 'timestamp');
    
    // Add token if selected is true
    if (params.selected === true || params.selected === 'yes') {
      if (!this.token) {
        throw new Error('Token is required when selected is true');
      }
      commandParams.token = this.token;
    }
    
    return this.executeCommand('add-text', commandParams);
  }

  /**
   * Adds a file to a note in Bear
   * @param params Parameters for adding a file
   * @returns The result of the command
   */
  async addFile(params: AddFileParams): Promise<string> {
    const commandParams: Record<string, string> = {};
    
    if (params.id) commandParams.id = params.id;
    if (params.title) commandParams.title = params.title;
    if (params.selected !== undefined) commandParams.selected = validateAndFormatBoolean(params.selected, 'selected');
    
    // File and filename are required
    validateNonEmptyString(params.file, 'file');
    validateNonEmptyString(params.filename, 'filename');
    
    commandParams.file = params.file;
    commandParams.filename = params.filename;
    
    if (params.header) commandParams.header = params.header;
    if (params.mode) commandParams.mode = params.mode;
    if (params.open_note !== undefined) commandParams.open_note = validateAndFormatBoolean(params.open_note, 'open_note');
    if (params.new_window !== undefined) commandParams.new_window = validateAndFormatBoolean(params.new_window, 'new_window');
    if (params.show_window !== undefined) commandParams.show_window = validateAndFormatBoolean(params.show_window, 'show_window');
    if (params.edit !== undefined) commandParams.edit = validateAndFormatBoolean(params.edit, 'edit');
    
    // Add token if selected is true
    if (params.selected === true || params.selected === 'yes') {
      if (!this.token) {
        throw new Error('Token is required when selected is true');
      }
      commandParams.token = this.token;
    }
    
    return this.executeCommand('add-file', commandParams);
  }

  /**
   * Gets all tags in Bear
   * @returns The result of the command
   */
  async getTags(): Promise<string> {
    if (!this.token) {
      throw new Error('Token is required for getTags');
    }
    
    return this.executeCommand('tags', { token: this.token });
  }

  /**
   * Opens a tag in Bear
   * @param params Parameters for opening the tag
   * @returns The result of the command
   */
  async openTag(params: OpenTagParams): Promise<string> {
    const commandParams: Record<string, string> = {};
    
    validateNonEmptyString(params.name, 'name');
    commandParams.name = params.name;
    
    if (params.token || this.token) {
      commandParams.token = params.token || this.token!;
    }
    
    return this.executeCommand('open-tag', commandParams);
  }

  /**
   * Renames a tag in Bear
   * @param params Parameters for renaming the tag
   * @returns The result of the command
   */
  async renameTag(params: RenameTagParams): Promise<string> {
    const commandParams: Record<string, string> = {};
    
    validateNonEmptyString(params.name, 'name');
    validateNonEmptyString(params.new_name, 'new_name');
    
    commandParams.name = params.name;
    commandParams.new_name = params.new_name;
    
    if (params.show_window !== undefined) {
      commandParams.show_window = validateAndFormatBoolean(params.show_window, 'show_window');
    }
    
    return this.executeCommand('rename-tag', commandParams);
  }

  /**
   * Deletes a tag in Bear
   * @param params Parameters for deleting the tag
   * @returns The result of the command
   */
  async deleteTag(params: DeleteTagParams): Promise<string> {
    const commandParams: Record<string, string> = {};
    
    validateNonEmptyString(params.name, 'name');
    commandParams.name = params.name;
    
    if (params.show_window !== undefined) {
      commandParams.show_window = validateAndFormatBoolean(params.show_window, 'show_window');
    }
    
    return this.executeCommand('delete-tag', commandParams);
  }

  /**
   * Moves a note to trash in Bear
   * @param params Parameters for trashing the note
   * @returns The result of the command
   */
  async trashNote(params: TrashParams): Promise<string> {
    const commandParams: Record<string, string> = {};
    
    if (params.id) commandParams.id = params.id;
    if (params.search) commandParams.search = params.search;
    if (params.show_window !== undefined) {
      commandParams.show_window = validateAndFormatBoolean(params.show_window, 'show_window');
    }
    
    return this.executeCommand('trash', commandParams);
  }

  /**
   * Moves a note to archive in Bear
   * @param params Parameters for archiving the note
   * @returns The result of the command
   */
  async archiveNote(params: ArchiveParams): Promise<string> {
    const commandParams: Record<string, string> = {};
    
    if (params.id) commandParams.id = params.id;
    if (params.search) commandParams.search = params.search;
    if (params.show_window !== undefined) {
      commandParams.show_window = validateAndFormatBoolean(params.show_window, 'show_window');
    }
    
    return this.executeCommand('archive', commandParams);
  }

  /**
   * Shows untagged notes in Bear
   * @param params Parameters for showing untagged notes
   * @returns The result of the command
   */
  async showUntagged(params: UntaggedParams = {}): Promise<string> {
    const commandParams: Record<string, string> = {};
    
    if (params.search) commandParams.search = params.search;
    if (params.show_window !== undefined) {
      commandParams.show_window = validateAndFormatBoolean(params.show_window, 'show_window');
    }
    
    if (params.token || this.token) {
      commandParams.token = params.token || this.token!;
    }
    
    return this.executeCommand('untagged', commandParams);
  }

  /**
   * Shows todo notes in Bear
   * @param params Parameters for showing todo notes
   * @returns The result of the command
   */
  async showTodo(params: TodoParams = {}): Promise<string> {
    const commandParams: Record<string, string> = {};
    
    if (params.search) commandParams.search = params.search;
    if (params.show_window !== undefined) {
      commandParams.show_window = validateAndFormatBoolean(params.show_window, 'show_window');
    }
    
    if (params.token || this.token) {
      commandParams.token = params.token || this.token!;
    }
    
    return this.executeCommand('todo', commandParams);
  }

  /**
   * Shows today's notes in Bear
   * @param params Parameters for showing today's notes
   * @returns The result of the command
   */
  async showToday(params: TodayParams = {}): Promise<string> {
    const commandParams: Record<string, string> = {};
    
    if (params.search) commandParams.search = params.search;
    if (params.show_window !== undefined) {
      commandParams.show_window = validateAndFormatBoolean(params.show_window, 'show_window');
    }
    
    if (params.token || this.token) {
      commandParams.token = params.token || this.token!;
    }
    
    return this.executeCommand('today', commandParams);
  }

  /**
   * Shows locked notes in Bear
   * @param params Parameters for showing locked notes
   * @returns The result of the command
   */
  async showLocked(params: LockedParams = {}): Promise<string> {
    const commandParams: Record<string, string> = {};
    
    if (params.search) commandParams.search = params.search;
    if (params.show_window !== undefined) {
      commandParams.show_window = validateAndFormatBoolean(params.show_window, 'show_window');
    }
    
    return this.executeCommand('locked', commandParams);
  }

  /**
   * Searches for notes in Bear
   * @param params Parameters for searching
   * @returns The result of the command
   */
  async searchNotes(params: SearchParams = {}): Promise<string> {
    const commandParams: Record<string, string> = {};
    
    if (params.term) commandParams.term = params.term;
    if (params.tag) commandParams.tag = params.tag;
    if (params.show_window !== undefined) {
      commandParams.show_window = validateAndFormatBoolean(params.show_window, 'show_window');
    }
    
    if (params.token || this.token) {
      commandParams.token = params.token || this.token!;
    }
    
    return this.executeCommand('search', commandParams);
  }

  /**
   * Grabs a URL and creates a note in Bear
   * @param params Parameters for grabbing the URL
   * @returns The result of the command
   */
  async grabURL(params: GrabURLParams): Promise<string> {
    const commandParams: Record<string, string> = {};
    
    validateNonEmptyString(params.url, 'url');
    commandParams.url = params.url;
    
    if (params.tags) commandParams.tags = formatTags(params.tags);
    if (params.pin !== undefined) {
      commandParams.pin = validateAndFormatBoolean(params.pin, 'pin');
    }
    if (params.wait !== undefined) {
      commandParams.wait = validateAndFormatBoolean(params.wait, 'wait');
    }
    
    return this.executeCommand('grab-url', commandParams);
  }
}
