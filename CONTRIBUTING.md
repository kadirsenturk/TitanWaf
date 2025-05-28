# 🤝 Contributing to TitanWAF

Thank you for your interest in contributing to TitanWAF! This document provides guidelines for contributing to the project.

## 🌟 Ways to Contribute

### 🐛 Bug Reports
- Report bugs through GitHub Issues
- Include detailed reproduction steps
- Provide system information and logs
- Use the bug report template

### 💡 Feature Requests
- Suggest new features via GitHub Issues
- Explain the use case and benefits
- Provide mockups or examples if possible
- Use the feature request template

### 🔧 Code Contributions
- Fix bugs and implement features
- Improve documentation
- Add tests and examples
- Optimize performance

### 📚 Documentation
- Improve README and guides
- Add code comments
- Create tutorials and examples
- Translate documentation

## 🚀 Getting Started

### 1. Fork the Repository
```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/yourusername/TitanWAF.git
cd TitanWAF
```

### 2. Set Up Development Environment
```bash
# Install dependencies
npm run install-all

# Start development servers
npm run dev
```

### 3. Create a Branch
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Or bug fix branch
git checkout -b fix/bug-description
```

## 📝 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow existing code formatting
- Add JSDoc comments for functions
- Use meaningful variable names
- Keep functions small and focused

### Commit Messages
```bash
# Format: type(scope): description
feat(waf): add new attack detection pattern
fix(ui): resolve dashboard loading issue
docs(readme): update installation guide
test(api): add endpoint validation tests
```

### Testing
```bash
# Run tests before submitting
npm test

# Test your changes manually
npm run dev
```

## 🔒 Security Contributions

### Security Issues
- **DO NOT** open public issues for security vulnerabilities
- Email security issues to: security@titanwaf.com
- Include detailed vulnerability description
- Provide proof of concept if possible

### Security Features
- New attack detection patterns
- Performance improvements
- False positive reduction
- New security algorithms

## 📋 Pull Request Process

### 1. Before Submitting
- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] Branch is up to date with main

### 2. Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Tests pass
- [ ] Manual testing completed
- [ ] No breaking changes

## Screenshots (if applicable)
Add screenshots for UI changes
```

### 3. Review Process
- Maintainers will review your PR
- Address feedback promptly
- Keep discussions constructive
- Be patient during review process

## 🏗️ Project Structure

```
TitanWAF/
├── waf-tool/
│   ├── backend/          # Express.js API
│   │   ├── src/
│   │   │   ├── waf.ts    # Core WAF logic
│   │   │   └── server.ts # Express server
│   │   └── package.json
│   └── frontend/         # React admin panel
│       ├── src/
│       │   ├── components/
│       │   ├── services/
│       │   └── App.tsx
│       └── package.json
├── docs/                 # Documentation
├── tests/               # Test files
└── README.md
```

## 🧪 Testing Guidelines

### Unit Tests
- Test individual functions
- Mock external dependencies
- Aim for high coverage
- Use descriptive test names

### Integration Tests
- Test API endpoints
- Test WebSocket communication
- Test attack detection
- Test UI components

### Manual Testing
- Test admin panel functionality
- Verify attack detection
- Check real-time updates
- Test different browsers

## 📖 Documentation Standards

### Code Documentation
```typescript
/**
 * Detects SQL injection attacks in request data
 * @param requestData - The request data to analyze
 * @param ip - Client IP address
 * @returns Attack detection result
 */
function detectSQLInjection(requestData: string, ip: string): AttackResult {
    // Implementation
}
```

### README Updates
- Keep installation steps current
- Update feature lists
- Add new configuration options
- Include troubleshooting tips

## 🎯 Priority Areas

### High Priority
- Performance optimizations
- New attack detection patterns
- Security improvements
- Bug fixes

### Medium Priority
- UI/UX improvements
- Documentation updates
- Test coverage
- Code refactoring

### Low Priority
- Feature enhancements
- Cosmetic changes
- Optional integrations

## 🏆 Recognition

### Contributors
- All contributors are listed in README
- Significant contributions get special recognition
- Regular contributors may become maintainers

### Hall of Fame
- Outstanding security researchers
- Major feature contributors
- Long-term maintainers

## 📞 Communication

### Channels
- **GitHub Issues**: Bug reports and features
- **GitHub Discussions**: General questions
- **Email**: security@titanwaf.com (security only)

### Response Times
- Issues: 1-3 business days
- Pull Requests: 3-7 business days
- Security Issues: 24-48 hours

## 📜 Code of Conduct

### Our Standards
- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain professional communication

### Unacceptable Behavior
- Harassment or discrimination
- Spam or off-topic content
- Sharing security vulnerabilities publicly
- Disruptive behavior

## 🙏 Thank You

Your contributions make TitanWAF better for everyone. Whether you're fixing a typo or implementing a major feature, every contribution is valued and appreciated!

---

**Happy Contributing! 🛡️** 