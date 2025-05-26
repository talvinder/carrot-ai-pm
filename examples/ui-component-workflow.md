# UI Component Workflow

This example shows how to build React components using natural language conversations with your AI assistant.

## Scenario: Building a Product Card Component

Let's create a reusable e-commerce product card by talking to our AI assistant.

## Step 1: Create the Component Specification

**You:** "Create a specification for an e-commerce product card component with image, pricing, ratings, and add-to-cart functionality"

**AI Assistant:** "I'll create a detailed specification for your product card component."

**Carrot AI PM creates** a specification in `specs/ui/ProductCard-{timestamp}.json` that includes:
- Component props (product data, callbacks)
- State management (hover, loading states)
- Accessibility requirements
- Responsive design needs
- Performance optimizations

## Step 2: Review the Specification

**You:** "What features will this product card have?"

**AI Assistant:** "Based on the specification, your ProductCard component will have:

**Visual Features:**
- Product image with lazy loading
- Product name and description
- Price display with sale price support
- Star rating with review count
- Add to cart button
- Discount badge for sales

**Interactive Features:**
- Hover effects on desktop
- Click to view product details
- Add to cart with loading state
- Keyboard navigation support

**Technical Requirements:**
- TypeScript interfaces for type safety
- Responsive design (mobile-first)
- Accessibility (ARIA labels, keyboard nav)
- Performance (image lazy loading, memoization)
- Theme support (light/dark modes)"

## Step 3: Implement the Component

**You:** "Implement this product card component in React with TypeScript"

**AI Assistant:** "I'll create the ProductCard component following the specification."

*The AI creates:*
- TypeScript interfaces for props
- React component with hooks
- CSS modules for styling
- Proper event handlers
- Loading states
- Error boundaries

## Step 4: Check Component Compliance

**You:** "Check if the product card implementation matches the specification"

**Carrot AI PM analyzes and reports:**

```
Component Compliance Report: ProductCard
========================================

Overall Score: 94% ✅

✅ Props Implementation
   - All required props defined with correct types
   - Optional props have default values
   - TypeScript interfaces match specification

✅ Accessibility
   - ARIA labels for screen readers
   - Keyboard navigation (Enter/Space for actions)
   - Focus indicators visible
   - Alt text for images

✅ State Management
   - Loading states implemented
   - Hover effects working
   - Error handling in place

⚠️  Suggestions:
   - Add aria-live region for cart updates
   - Implement skeleton loader for better UX
   - Consider adding product comparison feature

❌ Missing:
   - No theme support implemented yet
   - Missing price formatting for different currencies
```

## Step 5: Improve Based on Feedback

**You:** "Add theme support for light and dark modes"

**AI Assistant:** "I'll add theme support using CSS custom properties."

*AI implements theming*

**You:** "Also add the skeleton loader while the image is loading"

**AI Assistant:** "I'll add a skeleton loader for better perceived performance."

*AI adds skeleton loading state*

## Step 6: Create Component Tests

**You:** "Create tests for the product card component"

**AI Assistant:** "I'll create comprehensive tests based on the specification."

*AI generates tests for:*
- Component rendering
- Props validation
- User interactions
- Accessibility features
- Loading states
- Error scenarios

## Step 7: Create Usage Examples

**You:** "Show me how to use this product card in different scenarios"

**AI Assistant:** "Here are examples of using the ProductCard component:

**Basic Usage:**
```jsx
<ProductCard 
  product={productData}
  onAddToCart={(id) => addToCart(id)}
/>
```

**With Sale Price:**
```jsx
<ProductCard 
  product={{
    ...productData,
    originalPrice: 99.99,
    price: 79.99
  }}
  onAddToCart={(id) => addToCart(id)}
/>
```

**In a Grid Layout:**
```jsx
<div className="product-grid">
  {products.map(product => (
    <ProductCard 
      key={product.id}
      product={product}
      onAddToCart={handleAddToCart}
      variant="compact"
    />
  ))}
</div>
```"

## Common Conversations

**You:** "How can I make this component more accessible?"

**AI + Carrot:** "Your component already has good accessibility, but you can enhance it further:
- ✅ Keyboard navigation (already implemented)
- ✅ ARIA labels (already added)
- ✅ Focus indicators (styled)
- ⚠️ Add aria-live for cart updates
- ⚠️ Ensure color contrast meets WCAG AA
- 💡 Add reduced motion support
- 💡 Test with screen readers"

**You:** "What about performance optimization?"

**AI + Carrot:** "Current optimizations and suggestions:
- ✅ Image lazy loading (implemented)
- ✅ Component memoization (using React.memo)
- ✅ Event handler optimization (useCallback)
- ⚠️ Consider image optimization (WebP format)
- ⚠️ Add intersection observer for viewport detection
- 💡 Implement virtual scrolling for large lists"

**You:** "Can this work with different CSS frameworks?"

**AI + Carrot:** "Yes! The component uses CSS modules by default, but you can adapt it:
- **Tailwind CSS**: Replace class names with Tailwind utilities
- **Styled Components**: Convert styles to styled-components
- **Material-UI**: Wrap with MUI theme provider
- **Bootstrap**: Use Bootstrap classes for layout

The component logic remains the same, only styling changes."

## Best Practices Highlighted

### 1. Component Composition
The specification encourages building small, focused components that work together.

### 2. Type Safety
TypeScript interfaces ensure props are used correctly throughout your app.

### 3. Accessibility First
The spec includes accessibility requirements from the start, not as an afterthought.

### 4. Performance Built-in
Lazy loading and memoization are part of the initial implementation.

### 5. Testability
The component is designed to be easily testable with clear props and outputs.

## Next Steps

**You:** "What other components would work well with this product card?"

**AI + Carrot:** "To build a complete e-commerce UI, consider these complementary components:

1. **ProductGrid** - Responsive grid layout for multiple cards
2. **FilterPanel** - Product filtering by category, price, etc.
3. **SortDropdown** - Sort products by price, rating, etc.
4. **QuickView** - Modal for product details without navigation
5. **ComparisonTable** - Compare multiple products
6. **WishlistButton** - Save products for later
7. **ProductCarousel** - Featured products slider"

This example shows how Carrot AI PM helps you build better UI components by:
- Starting with clear specifications
- Validating implementation against requirements
- Providing specific improvement suggestions
- Ensuring accessibility and performance from day one 