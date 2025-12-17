# Contributing to @testarion/clitool

Thanks for your interest in contributing! This document outlines how to get involved.

## Reporting Bugs

Found a bug? Please open an issue on [GitHub Issues](https://github.com/testarion/clitool/issues) with:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Node.js version and OS
- Relevant error messages or logs

## Suggesting Features

Have an idea? Open an issue with:

- Description of the feature
- Use case / problem it solves
- Any implementation ideas (optional)

## Development Setup

```bash
# Clone the repository
git clone https://github.com/testarion/clitool.git
cd clitool

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Ensure tests pass (`npm test`)
5. Ensure linting passes (`npm run lint`)
6. Commit your changes (see commit guidelines below)
7. Push to your fork
8. Open a Pull Request

## Code Style

- TypeScript with strict mode
- Follow existing patterns in the codebase
- Run `npm run lint:fix` before committing
- Add tests for new functionality

## Commit Messages

Use clear, concise commit messages:

- `feat: add new crawler option for max depth`
- `fix: handle empty form fields in page processor`
- `docs: update installation instructions`
- `test: add tests for URL filter`
- `refactor: simplify crawl results parser`

## Project Structure

```
src/
├── ai/           # Anthropic AI integration
├── cli/          # CLI command implementations
├── crawler/      # Web crawling logic
├── documentation/# Doc generation
├── output/       # Output formatters
├── shared/       # Shared models and utilities
└── utils/        # General utilities

tests/
├── unit/         # Unit tests
└── integration/  # Integration tests
```

## Questions?

Open an issue for any questions about contributing.
