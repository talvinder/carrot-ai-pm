# Database Schema Evolution

This example shows how to design and evolve database schemas through natural language conversations.

## Scenario: E-commerce Database Design

Let's build a complete e-commerce database by talking to our AI assistant.

## Step 1: Create Initial Schema Specification

**You:** "Create a database schema specification for an e-commerce platform with users, products, orders, and inventory tracking"

**AI Assistant:** "I'll create a comprehensive database schema specification for your e-commerce platform."

**Carrot AI PM creates** specifications in `specs/db/` including:
- User authentication and profiles
- Product catalog with categories
- Order management system
- Inventory tracking
- Shopping cart functionality

## Step 2: Review the Schema Design

**You:** "Show me the main tables and their relationships"

**AI Assistant:** "Here's the database structure created for your e-commerce platform:

**Core Tables:**
1. **users** - Customer accounts and authentication
2. **products** - Product catalog
3. **categories** - Product categorization
4. **orders** - Customer orders
5. **order_items** - Individual items in orders
6. **inventory** - Stock tracking
7. **cart_items** - Shopping cart contents
8. **addresses** - Shipping/billing addresses
9. **payment_methods** - Saved payment options

**Key Relationships:**
- Users → Orders (one-to-many)
- Orders → Order Items → Products (many-to-many)
- Products → Categories (many-to-many)
- Products → Inventory (one-to-one)
- Users → Cart Items → Products (shopping cart)
- Users → Addresses (one-to-many)"

## Step 3: Implement the Database Schema

**You:** "Create the SQL for the users and products tables based on the specification"

**AI Assistant:** "I'll create the SQL schema following the specification."

*The AI generates SQL with:*
- Proper data types
- Primary and foreign keys
- Indexes for performance
- Constraints for data integrity
- Default values
- Timestamps for auditing

## Step 4: Check Schema Compliance

**You:** "Check if the database implementation matches the specification"

**Carrot AI PM analyzes and reports:**

```
Database Schema Compliance Report
=================================

Overall Score: 91% ✅

✅ Table Structure
   - All required tables created
   - Column data types match specification
   - Primary keys properly defined

✅ Relationships
   - Foreign keys correctly implemented
   - Cascade rules appropriate
   - Junction tables for many-to-many

✅ Constraints
   - NOT NULL constraints in place
   - UNIQUE constraints on emails, SKUs
   - CHECK constraints for valid data

⚠️  Performance Suggestions:
   - Add index on orders.user_id for faster lookups
   - Consider composite index on (product_id, created_at)
   - Add index on products.sku for inventory queries

❌ Missing:
   - No full-text search index on product names
   - Missing audit triggers for order changes
```

## Step 5: Optimize Based on Feedback

**You:** "Add the suggested indexes for better performance"

**AI Assistant:** "I'll add the performance indexes."

*AI adds indexes*

**You:** "Also add full-text search for product names and descriptions"

**AI Assistant:** "I'll implement full-text search capabilities."

*AI adds full-text indexes*

## Step 6: Handle Schema Evolution

**You:** "We need to add support for product reviews and ratings"

**AI Assistant:** "I'll extend the schema to support reviews. This requires:

**New Tables:**
- **reviews** - Customer product reviews
- **review_votes** - Helpful/unhelpful votes

**Schema Changes:**
- Add average_rating to products table
- Add review_count to products table
- Create triggers to update ratings

Here's the migration plan..."

*AI provides migration SQL*

## Step 7: Validate the Migration

**You:** "Check if the review system implementation is correct"

**Carrot AI PM reports:**

```
Migration Compliance Report
==========================

✅ New tables created correctly
✅ Foreign keys maintain referential integrity  
✅ Triggers update product ratings automatically
✅ Indexes added for performance
✅ Backward compatibility maintained

Migration safe to deploy!
```

## Common Database Conversations

**You:** "How can we improve query performance for order history?"

**AI + Carrot:** "Based on your schema and common queries:

**Current Optimizations:**
- ✅ Index on orders.user_id
- ✅ Index on orders.created_at
- ✅ Composite index on order_items

**Suggested Improvements:**
1. Add covering index for order summary queries
2. Consider partitioning orders table by date
3. Add materialized view for order statistics
4. Implement Redis caching for recent orders"

**You:** "What about data security and privacy?"

**AI + Carrot:** "Your schema includes several security features:

**Implemented:**
- ✅ Password hashes (never plain text)
- ✅ Separate PII in users table
- ✅ Audit timestamps on sensitive tables

**Recommendations:**
- 🔒 Encrypt credit card tokens
- 🔒 Add row-level security for multi-tenant
- 🔒 Implement soft deletes for compliance
- 🔒 Add data retention policies"

**You:** "How do we handle high-volume Black Friday traffic?"

**AI + Carrot:** "Here's a scaling strategy for your schema:

**Database Level:**
1. **Read Replicas** - Distribute read queries
2. **Connection Pooling** - Optimize connections
3. **Query Caching** - Cache frequent queries
4. **Sharding** - Split users by region

**Application Level:**
1. **Inventory Reserve** - Prevent overselling
2. **Queue Orders** - Process asynchronously  
3. **Cache Products** - Reduce database hits
4. **CDN Assets** - Offload static content"

## Schema Best Practices Demonstrated

### 1. Normalization
The schema follows 3NF to prevent data anomalies while allowing strategic denormalization for performance.

### 2. Data Integrity
Foreign keys, constraints, and triggers ensure data remains consistent.

### 3. Performance First
Indexes are created based on actual query patterns, not guesswork.

### 4. Scalability Built-in
The design supports horizontal scaling and caching strategies.

### 5. Security by Design
Sensitive data is properly isolated and encrypted.

## Advanced Schema Features

**You:** "Show me how to implement multi-currency support"

**AI + Carrot:** "To add multi-currency support:

**Schema Changes:**
```sql
-- Add currency table
CREATE TABLE currencies (
  code CHAR(3) PRIMARY KEY,
  name VARCHAR(50),
  symbol VARCHAR(5),
  exchange_rate DECIMAL(10,6)
);

-- Modify products table
ALTER TABLE products 
ADD COLUMN currency_code CHAR(3) DEFAULT 'USD',
ADD FOREIGN KEY (currency_code) REFERENCES currencies(code);

-- Modify orders table  
ALTER TABLE orders
ADD COLUMN currency_code CHAR(3),
ADD COLUMN exchange_rate DECIMAL(10,6);
```

**Implementation Notes:**
- Store prices in product's native currency
- Lock exchange rate at order time
- Display prices in user's preferred currency
- Update exchange rates via scheduled job"

## Next Steps

**You:** "What other features should we consider for a modern e-commerce database?"

**AI + Carrot:** "Consider adding these features:

1. **Wishlist System** - Save products for later
2. **Recommendation Engine** - Track user preferences
3. **Loyalty Program** - Points and rewards
4. **Subscription Orders** - Recurring purchases
5. **Multi-vendor Support** - Marketplace functionality
6. **Advanced Analytics** - User behavior tracking
7. **A/B Testing** - Feature flag support
8. **Event Sourcing** - Complete audit trail"

This example shows how Carrot AI PM helps with database design by:
- Creating comprehensive schemas from requirements
- Validating implementations against best practices
- Suggesting performance optimizations
- Guiding schema evolution safely
- Ensuring security and scalability from the start 