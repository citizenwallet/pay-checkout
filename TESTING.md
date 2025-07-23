# Testing Setup

This project is configured with Jest and React Testing Library for testing.

## Available Scripts

- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode (re-runs when files change)
- `npm run test:coverage` - Run tests with coverage report

## Test File Naming

Tests should be named with `.test.ts` or `.test.tsx` extension:
- `component.test.tsx` - For React component tests
- `function.test.ts` - For utility function tests
- `api.test.ts` - For API route tests

## Writing Tests

### Testing React Components

```tsx
import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### Testing Utility Functions

```tsx
import { extractIdFromMessage } from './transaction'

describe('extractIdFromMessage', () => {
  it('extracts numbers from string', () => {
    expect(extractIdFromMessage('Order #123')).toBe('123')
  })
})
```

### Testing API Routes

```tsx
import { GET } from './route'

describe('API Route', () => {
  it('returns correct response', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
  })
})
```

## Testing Utilities

The project includes:
- **Jest** - Test runner
- **React Testing Library** - For testing React components
- **@testing-library/jest-dom** - Custom matchers for DOM testing
- **jest-environment-jsdom** - DOM environment for tests

## Mocking

Common mocks are set up in `jest.setup.js`:
- Next.js router
- Next.js navigation
- ResizeObserver
- matchMedia

## Coverage

Run `npm run test:coverage` to see test coverage reports. Coverage is collected from:
- `src/**/*.{ts,tsx}`
- Excludes `.d.ts` and `.stories.{ts,tsx}` files 