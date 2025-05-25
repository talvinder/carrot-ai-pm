# Enhanced Carrot MCP Tools Test

## Problem Statement
The original tools were generating generic, boilerplate specifications that weren't contextually relevant to the actual task domain (Spotify playlist management). This test demonstrates the improvements.

## Hypothesis
**Enhanced tools with context analysis will generate domain-specific, relevant specifications that build upon existing project patterns.**

## Test Scenarios

### Scenario 1: Spotify Playlist Route Creation
**Input**: 
- Path: `/api/spotify/playlists/{playlistId}`
- Method: `PATCH`
- Handler: `updatePlaylistHandler`

**Expected Improvements**:
1. **Context Detection**: Should detect Spotify domain from path
2. **Pattern Recognition**: Should identify existing authentication patterns
3. **Domain-Specific Schemas**: Should generate playlist-specific schemas with proper fields
4. **Relevant Test Cases**: Should generate Spotify-specific test scenarios

### Scenario 2: Generic API Route
**Input**:
- Path: `/api/generic/resource`
- Method: `POST`
- Handler: `createResourceHandler`

**Expected Behavior**:
- Should fall back to generic patterns but still analyze project context
- Should recommend following existing project patterns

## Key Improvements Implemented

### 1. Context Analysis Engine
- **Project Structure Analysis**: Scans for existing files, patterns, and dependencies
- **Domain Detection**: Identifies domain from path segments and summary keywords
- **Pattern Recognition**: Detects existing authentication, validation, and API patterns

### 2. Domain-Specific Schema Generation
- **Spotify Domain**: Generates playlist-specific schemas with proper fields (name, description, public, collaborative, tracks)
- **User Management**: Generates user-specific schemas and authentication patterns
- **Generic Fallback**: Provides intelligent generic schemas when domain is unclear

### 3. Contextual Test Case Generation
- **Domain-Aware Tests**: Generates relevant test scenarios based on detected domain
- **Security Tests**: Includes authorization and ownership validation tests
- **Error Scenarios**: Generates domain-specific error cases

### 4. Implementation Guidance
- **Technology Stack Detection**: Identifies existing technologies (Next.js, Zod, etc.)
- **Pattern Consistency**: Recommends following existing project patterns
- **Dependency Management**: Suggests relevant dependencies based on context

## Comparison: Before vs After

### Before (Generic Boilerplate)
```json
{
  "endpoint": "/api/spotify/playlists/{playlistId}",
  "summary": "Update playlist",
  "features": [
    {
      "name": "multi-task-specs",
      "description": "Support for defining complex tasks..."
    }
  ]
}
```

### After (Context-Aware)
```json
{
  "endpoint": "/api/spotify/playlists/{playlistId}",
  "summary": "Update playlist",
  "domain": "spotify",
  "specification": {
    "purpose": "Spotify playlist management endpoint",
    "functionality": {
      "core": "Manage user playlists with full CRUD operations",
      "authentication": "User-based via x-user-id header",
      "authorization": "Users can only access their own playlists"
    },
    "dataModel": {
      "playlist": {
        "id": "Unique playlist identifier (UUID)",
        "name": "Playlist name (max 100 chars)",
        "description": "Optional description (max 300 chars)",
        "public": "Boolean - public visibility",
        "collaborative": "Boolean - collaborative editing",
        "userId": "Owner user ID",
        "tracks": "Array of track objects"
      }
    }
  }
}
```

## Validation Criteria

### ✅ Context Intelligence
- [ ] Detects Spotify domain from path/summary
- [ ] Identifies existing project patterns
- [ ] Recognizes authentication mechanisms

### ✅ Domain Relevance
- [ ] Generates playlist-specific schemas
- [ ] Includes relevant validation rules
- [ ] Provides domain-appropriate error handling

### ✅ Pattern Consistency
- [ ] Follows existing project structure
- [ ] Maintains consistency with existing APIs
- [ ] Recommends appropriate technologies

### ✅ Test Quality
- [ ] Generates relevant test scenarios
- [ ] Includes security and authorization tests
- [ ] Covers domain-specific edge cases

## Expected Results

The enhanced tools should now:
1. **Generate contextually relevant specifications** instead of generic boilerplate
2. **Build upon existing project patterns** rather than ignoring them
3. **Provide domain-specific guidance** for implementation
4. **Create comprehensive, relevant test cases** for the specific domain

This represents a significant improvement in the quality and relevance of generated specifications, moving from generic templates to intelligent, context-aware generation. 