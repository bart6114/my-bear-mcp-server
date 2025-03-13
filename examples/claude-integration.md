# Using Bear MCP Server with Claude

This document provides examples of how to use the Bear MCP server with Claude.

## Setup

1. First, make sure the Bear MCP server is running with your API token:

```bash
node build/index.js --token YOUR_BEAR_TOKEN
```

2. Configure Claude to use the Bear MCP server by adding it to your MCP settings file.

## Example Interactions

Here are some examples of how to interact with Bear through Claude:

### Creating a New Note

```
<use_mcp_tool>
<server_name>bear</server_name>
<tool_name>create_note</tool_name>
<arguments>
{
  "title": "Meeting Notes",
  "text": "# Team Meeting\n\n## Agenda\n\n- Project updates\n- Timeline review\n- Questions",
  "tags": ["work", "meetings"]
}
</arguments>
</use_mcp_tool>
```

### Searching for Notes

```
<use_mcp_tool>
<server_name>bear</server_name>
<tool_name>search_notes</tool_name>
<arguments>
{
  "term": "meeting",
  "tag": "work"
}
</arguments>
</use_mcp_tool>
```

Example response:
```
Search performed successfully in the Bear app.

Search parameters:
- Search term: meeting
- Tag filter: work

Results:
- Meeting Notes (ID: 123ABC-DEF456-789GHI), Tags: work, meetings
- Team Sync (ID: 456DEF-789GHI-123ABC), Tags: work, meetings, team
- Project Kickoff (ID: 789GHI-123ABC-456DEF), Tags: work, projects
```

### Adding Text to a Note

```
<use_mcp_tool>
<server_name>bear</server_name>
<tool_name>add_text</tool_name>
<arguments>
{
  "title": "Meeting Notes",
  "text": "\n\n## Action Items\n\n- [ ] Follow up with team\n- [ ] Prepare presentation\n- [ ] Schedule next meeting",
  "mode": "append",
  "new_line": true
}
</arguments>
</use_mcp_tool>
```

### Getting All Tags

```
<use_mcp_tool>
<server_name>bear</server_name>
<tool_name>get_tags</tool_name>
<arguments>
{}
</arguments>
</use_mcp_tool>
```

Example response:
```
Tags retrieved successfully from Bear:

- work
- meetings
- projects
- personal
- ideas
- research
- work/projects
- work/meetings
- personal/journal
```

### Creating a Note from a Web Page

```
<use_mcp_tool>
<server_name>bear</server_name>
<tool_name>grab_url</tool_name>
<arguments>
{
  "url": "https://bear.app/",
  "tags": ["tools", "reference"],
  "pin": true
}
</arguments>
</use_mcp_tool>
```

### Opening a Specific Tag

```
<use_mcp_tool>
<server_name>bear</server_name>
<tool_name>open_tag</tool_name>
<arguments>
{
  "name": "work/projects"
}
</arguments>
</use_mcp_tool>
```

Example response:
```
Tag opened successfully: work/projects

Notes with this tag:
- Project Alpha (ID: 123ABC-DEF456-789GHI)
- Project Beta Planning (ID: 456DEF-789GHI-123ABC)
- Project Gamma Research (ID: 789GHI-123ABC-456DEF)
```

## Workflow Examples

### Taking Meeting Notes

1. Create a new note for the meeting:

```
<use_mcp_tool>
<server_name>bear</server_name>
<tool_name>create_note</tool_name>
<arguments>
{
  "title": "Meeting with Marketing Team",
  "text": "# Marketing Team Meeting\n\n**Date:** March 13, 2025\n\n## Attendees\n\n- John Smith\n- Jane Doe\n- Alex Johnson\n\n## Agenda\n\n1. Campaign updates\n2. Q2 planning\n3. Budget review",
  "tags": ["work", "meetings", "marketing"],
  "timestamp": true
}
</arguments>
</use_mcp_tool>
```

2. During the meeting, add notes as the discussion progresses:

```
<use_mcp_tool>
<server_name>bear</server_name>
<tool_name>add_text</tool_name>
<arguments>
{
  "title": "Meeting with Marketing Team",
  "text": "\n\n## Campaign Updates\n\n- Social media campaign reached 50k impressions\n- Email open rate at 28%, above industry average\n- New landing page design increased conversions by 15%",
  "mode": "append",
  "new_line": true
}
</arguments>
</use_mcp_tool>
```

3. Add action items at the end of the meeting:

```
<use_mcp_tool>
<server_name>bear</server_name>
<tool_name>add_text</tool_name>
<arguments>
{
  "title": "Meeting with Marketing Team",
  "text": "\n\n## Action Items\n\n- [ ] John: Finalize Q2 campaign calendar by Friday\n- [ ] Jane: Prepare budget proposal for new initiatives\n- [ ] Alex: Share analytics report with the team\n- [ ] Everyone: Review campaign brief by Monday",
  "mode": "append",
  "new_line": true
}
</arguments>
</use_mcp_tool>
```

### Research Project

1. Save a web page for research:

```
<use_mcp_tool>
<server_name>bear</server_name>
<tool_name>grab_url</tool_name>
<arguments>
{
  "url": "https://example.com/research-paper",
  "tags": ["research", "project-x"],
  "wait": true
}
</arguments>
</use_mcp_tool>
```

2. Add your own notes and insights:

```
<use_mcp_tool>
<server_name>bear</server_name>
<tool_name>add_text</tool_name>
<arguments>
{
  "title": "Research Paper: Example Title",
  "text": "\n\n## My Analysis\n\nKey points from this research that apply to our project:\n\n1. The methodology aligns with our approach\n2. Results suggest we should focus more on X\n3. Limitations to consider for our implementation",
  "mode": "append",
  "new_line": true
}
</arguments>
</use_mcp_tool>
```

3. Find all your research notes:

```
<use_mcp_tool>
<server_name>bear</server_name>
<tool_name>open_tag</tool_name>
<arguments>
{
  "name": "research/project-x"
}
</arguments>
</use_mcp_tool>
