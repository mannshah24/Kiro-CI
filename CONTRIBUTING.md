# Contributing to Kiro-CI

Thank you for your interest in contributing to Kiro-CI! We welcome contributions from the community.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/kiro-ci.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Run tests: `forge test`
6. Commit your changes: `git commit -m "Add your feature"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

## 📝 Development Guidelines

### Smart Contracts

- Follow Solidity style guide
- Write comprehensive tests for new features
- Ensure all tests pass: `forge test`
- Use OpenZeppelin contracts where applicable
- Add NatSpec comments for public functions

### Frontend

- Use TypeScript for type safety
- Follow React best practices
- Use TailwindCSS for styling
- Ensure responsive design

### Git Commit Messages

- Use clear, descriptive commit messages
- Start with a verb: "Add", "Fix", "Update", "Remove"
- Keep first line under 50 characters
- Add detailed description if needed

Example:
```
Add attestation revocation check

- Verify attestation is not revoked before deployment
- Add test cases for revoked attestations
- Update documentation
```

## 🧪 Testing

All contributions must include tests:

```bash
# Run all tests
forge test

# Run with coverage
forge coverage

# Run specific test
forge test --match-test testYourFeature
```

Ensure test coverage remains above 90%.

## 📋 Pull Request Process

1. Update README.md with details of changes if applicable
2. Update documentation for any modified APIs
3. Ensure all tests pass
4. Request review from maintainers
5. Address review comments
6. Squash commits if requested

## 🐛 Bug Reports

When filing a bug report, please include:

- Clear description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node version, etc.)
- Relevant logs or screenshots

## 💡 Feature Requests

We welcome feature suggestions! Please:

- Check if feature already exists or is planned
- Clearly describe the feature and use case
- Explain why it would be valuable
- Consider implementation approach

## 🔒 Security

If you discover a security vulnerability:

- **DO NOT** open a public issue
- Email the maintainers directly
- Include detailed description and reproduction steps
- Allow time for fix before public disclosure

## 📜 Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing private information
- Any unprofessional conduct

## 📞 Questions?

- Open a GitHub Discussion
- Join our Discord: [Link]
- Check existing issues and PRs

## 🙏 Thank You!

Your contributions make Kiro-CI better for everyone. We appreciate your time and effort!

---

Happy coding! 🎉
