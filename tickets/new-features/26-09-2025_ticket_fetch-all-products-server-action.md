# Ticket: Fetch All Products Server Action

## **Problem**

Currently, city cards on the homepage are loaded from a hardcoded constant. We need to dynamically load city data from Bokun API instead.

## **Goal**

Replace static city data with dynamic Bokun product data to power the city cards on the homepage.

## **Requirements**

### **Functional Requirements**

- Create a server action to fetch all products from Bokun API
- Display only city names/titles on city cards
- Replace hardcoded CITIES constant with API data
- Maintain existing city card UI/UX

### **Technical Requirements**

- Use server action (not API route) for security
- Handle loading states gracefully
- Implement error handling for API failures
- Cache data appropriately to avoid excessive API calls

### **Acceptance Criteria**

- [ ] City cards load from Bokun API instead of constants
- [ ] Only city names are displayed (no other product details)
- [ ] Page loads without breaking existing functionality
- [ ] Error states are handled gracefully
- [ ] No public API endpoints exposed

## **Implementation Notes**

- Use existing Bokun utilities (`lib/bokun/`)
- Modify `components/cards/CityCard.tsx` to use server action
- Consider caching strategy for performance
- Test with actual Bokun API credentials

## **Priority**

Medium

## **Estimated Effort**

2-3 hours

## **Dependencies**

- Bokun API integration (completed)
- Environment variables configured
