import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  labels: Array<{ name: string }>;
}

interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubIssue[];
}

/**
 * Configure todo resource for GitHub issues
 */
export function todoResource(server: McpServer, repoRoot: string): void {
  // GitHub API request options
  const apiOptions: RequestInit = {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Carrot-AI-PM'
    }
  };

  // Add authorization if GitHub token is available
  if (process.env.GITHUB_TOKEN && apiOptions.headers) {
    // Cast to Record to allow string indexing
    (apiOptions.headers as Record<string, string>)['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  // Template for todo://issues/{id} resources
  const todoTemplate = new ResourceTemplate('todo://issues/{id}', {
    list: async () => {
      try {
        // Default page size and first page
        const pageSize = 10;
        const page = 1;
        
        // Build GitHub API URL
        // Default to searching in the carrot org or repo with open state
        const apiUrl = `https://api.github.com/search/issues?q=label:carrot+state:open&sort=updated&per_page=${pageSize}&page=${page}`;
        
        // Fetch issues from GitHub
        const response = await fetch(apiUrl, apiOptions);
        
        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json() as GitHubSearchResponse;
        
        // Map GitHub issues to todo resources
        const resources = data.items.map((issue) => ({
          uri: `todo://issues/${issue.number}`,
          name: `Issue #${issue.number}`,
          description: issue.title
        }));
        
        return { 
          resources,
          nextCursor: data.total_count > page * pageSize ? `page=2` : undefined
        };
      } catch (error) {
        console.error('Error fetching GitHub issues:', error);
        return { resources: [] };
      }
    }
  });
  
  // Handler for reading individual issues
  server.resource('todo', todoTemplate, async (uri, params) => {
    const { id } = params;
    
    if (!id) {
      throw new Error('Issue ID not provided');
    }
    
    try {
      // Fetch the specific issue
      const apiUrl = `https://api.github.com/repos/carrot/carrot/issues/${id}`;
      const response = await fetch(apiUrl, apiOptions);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Issue #${id} not found`);
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      const issue = await response.json() as GitHubIssue;
      
      // Format issue as JSON
      const formattedIssue = {
        id: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        url: issue.html_url,
        labels: issue.labels.map(label => label.name)
      };
      
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(formattedIssue, null, 2)
        }]
      };
    } catch (error) {
      console.error(`Error fetching issue #${id}:`, error);
      throw new Error(`Failed to fetch issue #${id}`);
    }
  });
} 