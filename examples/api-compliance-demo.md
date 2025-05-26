# API Compliance Demo

This example shows how to use Carrot AI PM through natural language conversations with your AI assistant.

## Scenario: Building a User Management API

Let's build a complete user management system by talking to our AI assistant.

## Step 1: Create the Specification

**You:** "Create a specification for a user management API with CRUD operations, authentication, and role-based access"

**AI Assistant:** "I'll create a comprehensive specification for your user management API."

**Carrot AI PM creates:**
- OpenAPI spec entry in `vibe.yaml`
- Detailed spec file in `specs/api/users-{timestamp}.json`

The specification includes:
- User registration endpoint (POST /api/auth/register)
- Login endpoint (POST /api/auth/login)
- User profile endpoints (GET, PUT, DELETE /api/users/{id})
- User listing with pagination (GET /api/users)
- Role-based access control
- Password requirements and validation rules
- JWT token authentication
- Error response formats

## Step 2: Review What Was Created

**You:** "Show me what endpoints were specified"

**AI Assistant:** "Here's what the specification includes:

```
POST   /api/auth/register  - Create new user account
POST   /api/auth/login     - Authenticate and get JWT token
GET    /api/users          - List users (admin only)
GET    /api/users/{id}     - Get user profile
PUT    /api/users/{id}     - Update user profile
DELETE /api/users/{id}     - Delete user account
POST   /api/auth/refresh   - Refresh JWT token
POST   /api/auth/logout    - Invalidate token
```

Each endpoint has detailed requirements for:
- Request validation
- Response formats
- Error handling
- Authentication requirements
- Role permissions"

## Step 3: Implement the API

**You:** "Now implement the user registration and login endpoints based on the specification"

**AI Assistant:** "I'll implement the authentication endpoints following the specification."

*The AI writes the code with:*
- Express.js routes
- Password hashing with bcrypt
- JWT token generation
- Email validation
- Error handling
- Input sanitization

## Step 4: Check Compliance

**You:** "Check if the authentication implementation matches the specification"

**Carrot AI PM analyzes the code and reports:**

```
Compliance Report for Authentication API
========================================

Overall Score: 92% ✅

✅ POST /api/auth/register
   - Email validation implemented correctly
   - Password hashing using bcrypt
   - Returns proper 409 for duplicate emails
   - JWT token generated on success

✅ POST /api/auth/login
   - Validates credentials properly
   - Returns 401 for invalid login
   - JWT token includes required claims

⚠️  Suggestions for improvement:
   - Add rate limiting to prevent brute force attacks
   - Implement password strength validation (min 8 chars, 1 number, 1 special)
   - Add email verification workflow

❌ Missing:
   - No refresh token endpoint implemented yet
   - Missing logout functionality
```

## Step 5: Fix Issues

**You:** "Add the missing password strength validation"

**AI Assistant:** "I'll add password strength validation to match the specification."

*AI adds validation code*

**You:** "Also add rate limiting to the login endpoint"

**AI Assistant:** "I'll add rate limiting to prevent brute force attacks."

*AI implements rate limiting*

## Step 6: Re-check Compliance

**You:** "Check the compliance again"

**Carrot AI PM reports:**

```
Compliance Report for Authentication API
========================================

Overall Score: 98% ✅

✅ All previous issues fixed:
   - Password strength validation added
   - Rate limiting implemented (5 attempts per 15 minutes)
   
✅ Security best practices:
   - Passwords hashed with bcrypt (10 rounds)
   - JWT tokens expire after 1 hour
   - Sensitive data excluded from responses
   
Remaining suggestions:
   - Consider implementing refresh tokens
   - Add email verification for new accounts
```

## Step 7: Generate Tests

**You:** "Create tests for the authentication endpoints based on the specification"

**AI Assistant:** "I'll generate comprehensive tests covering all the specification requirements."

*AI creates test suite including:*
- Valid registration tests
- Duplicate email tests
- Invalid password tests
- Login success/failure tests
- Rate limiting tests
- Token validation tests

## Key Benefits Demonstrated

### 1. Natural Language Workflow
You never had to write code or complex commands - just describe what you want in plain English.

### 2. Specification-Driven
The AI had clear requirements to follow, reducing misunderstandings and missing features.

### 3. Immediate Validation
You found out about missing features and security issues right away, not in production.

### 4. Actionable Feedback
Instead of vague "this is wrong" messages, you got specific suggestions like "add rate limiting" with implementation guidance.

### 5. Iterative Improvement
You could fix issues one at a time and re-check until everything was perfect.

## Common Conversations

**You:** "What security best practices should this API follow?"

**AI + Carrot:** "Based on the specification, your API should have:
- Password hashing (✅ implemented with bcrypt)
- Rate limiting (✅ added to login)
- JWT expiration (✅ 1 hour timeout)
- HTTPS only (⚠️ configure in production)
- Input sanitization (✅ implemented)
- SQL injection prevention (✅ using parameterized queries)"

**You:** "How can I make this API more scalable?"

**AI + Carrot:** "Consider these improvements:
- Add caching for user lookups (Redis)
- Implement connection pooling for database
- Use refresh tokens to reduce login frequency
- Add API versioning for future changes
- Implement pagination on user listing (✅ already in spec)"

## Next Steps

**You:** "What else should I implement for a complete user management system?"

**AI + Carrot:** "Based on your specification, you still need:
1. Password reset functionality
2. Email verification system
3. User profile update endpoints
4. Admin user management endpoints
5. Audit logging for security events
6. Two-factor authentication (optional but recommended)"

This demo shows how Carrot AI PM makes API development more reliable and less stressful by ensuring your AI assistant understands exactly what you need and validates that it's built correctly. 