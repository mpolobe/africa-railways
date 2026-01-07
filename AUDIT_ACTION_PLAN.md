# Audit Action Plan - Priority Fixes

**Based on**: PROJECT_AUDIT_REPORT.md  
**Date**: January 6, 2025  
**Status**: Ready for Implementation

---

## 🚨 Critical Issues (Fix This Week)

### 1. Go Version Mismatch ⚠️

**Issue**: Backend requires Go 1.24.1 (doesn't exist), system has 1.22.12

**Impact**: Cannot build backend services

**Fix**:
```bash
# Update backend/go.mod
cd backend
# Change line 3 from:
go 1.24.1
# To:
go 1.22
```

**Files to Update**:
- `backend/go.mod` - Line 3

**Estimated Time**: 5 minutes

---

### 2. Invalid PACKAGE_ID in App.js ⚠️

**Issue**: Hardcoded `PACKAGE_ID = "0x0"` will cause blockchain interactions to fail

**Impact**: Mobile app cannot interact with Sui blockchain

**Fix**:
```javascript
// SmartphoneApp/App.js - Line 9
// BEFORE:
const PACKAGE_ID = "0x0";

// AFTER:
const PACKAGE_ID = process.env.EXPO_PUBLIC_PACKAGE_ID || "0x0";
```

**Additional Steps**:
1. Add to `.env.example`:
   ```
   EXPO_PUBLIC_PACKAGE_ID=your_sui_package_id_here
   ```
2. Update deployment scripts to set this variable
3. Document in README

**Files to Update**:
- `SmartphoneApp/App.js` - Line 9
- `.env.example` - Add new variable
- `README.md` - Document requirement

**Estimated Time**: 15 minutes

---

### 3. Fix Test Failures ⚠️

**Issue**: 2 test suites failing (MapHologram, analytics) due to Babel parse errors

**Impact**: CI/CD pipeline unreliable, potential bugs undetected

**Fix**:
```bash
cd SmartphoneApp

# Option 1: Update Babel config
# Check babel.config.js for missing presets

# Option 2: Update test files to use correct imports
# Review MapHologram.test.js and analytics.test.js

# Option 3: Update Jest config
# Check jest.config.js transformIgnorePatterns
```

**Investigation Steps**:
1. Run tests with verbose output: `npm test -- --verbose`
2. Check Babel configuration
3. Verify import paths
4. Update transformIgnorePatterns if needed

**Files to Check**:
- `SmartphoneApp/babel.config.js`
- `SmartphoneApp/jest.config.js`
- `SmartphoneApp/__tests__/MapHologram.test.js`
- `SmartphoneApp/__tests__/analytics.test.js`

**Estimated Time**: 1-2 hours

---

### 4. Remove Large Binaries from Repo ⚠️

**Issue**: 33MB of compiled binaries committed to repository

**Impact**: Slow clones, bloated repo, violates best practices

**Fix**:
```bash
# 1. Add to .gitignore
echo "relayer" >> .gitignore
echo "dashboard/occ-dashboard" >> .gitignore
echo "monitor" >> .gitignore

# 2. Remove from git history (optional, requires force push)
git rm --cached relayer
git rm --cached dashboard/occ-dashboard
git rm --cached monitor

# 3. Commit changes
git add .gitignore
git commit -m "chore: Remove compiled binaries from repository"

# 4. Update CI/CD to build these binaries
# Add build steps to GitHub Actions workflows
```

**Files to Update**:
- `.gitignore` - Add binary patterns
- `.github/workflows/deploy.yml` - Add build steps
- `README.md` - Document build process

**Estimated Time**: 30 minutes

---

## 📋 High Priority (Fix This Month)

### 5. Increase Test Coverage

**Current**: ~5% coverage  
**Target**: 50% coverage (short term), 80% (long term)

**Action Items**:
1. Fix existing test failures
2. Add backend tests (Go, Python)
3. Add integration tests for API endpoints
4. Add E2E tests for critical flows

**Estimated Time**: 2-3 weeks

---

### 6. Consolidate Documentation

**Current**: 198 markdown files  
**Target**: <50 well-organized files

**Action Items**:
1. Create `/docs/archive/` directory
2. Move outdated docs to archive
3. Merge redundant documentation
4. Update DOCS_INDEX.md
5. Add version numbers to docs

**Estimated Time**: 1 week

---

### 7. Fix npm Vulnerabilities

**Current**: 15 low severity vulnerabilities in root package

**Fix**:
```bash
cd /workspaces/africa-railways
npm audit fix
npm audit fix --force  # If needed

# Review changes
git diff package-lock.json

# Test to ensure nothing broke
npm test
```

**Estimated Time**: 30 minutes

---

### 8. Add Backend Tests

**Current**: No tests for Go or Python code

**Action Items**:
1. Add Go unit tests
   - `backend/main_test.go`
   - `backend/reports_test.go`
   
2. Add Python unit tests
   - `test_app.py`
   - `test_sui_logic.py`
   - `test_notifications.py`

3. Set up test coverage reporting

**Estimated Time**: 1-2 weeks

---

## 🎯 Medium Priority (Next Quarter)

### 9. Performance Optimization

- Bundle size analysis and reduction
- Database query optimization
- Implement caching strategy
- Image optimization

**Estimated Time**: 2-3 weeks

---

### 10. Monitoring & Observability

- Integrate APM (Application Performance Monitoring)
- Set up log aggregation (ELK stack or similar)
- Add error tracking (Sentry)
- Create dashboards

**Estimated Time**: 2 weeks

---

### 11. API Documentation

- Generate OpenAPI/Swagger documentation
- Create interactive API docs
- Document all endpoints
- Add request/response examples

**Estimated Time**: 1 week

---

### 12. CI/CD Improvements

- Add test automation to all workflows
- Implement code quality gates (ESLint, Prettier)
- Add security scanning (Snyk, Dependabot)
- Implement blue-green deployments

**Estimated Time**: 1-2 weeks

---

## 📊 Progress Tracking

### Week 1 Checklist

- [ ] Fix Go version in backend/go.mod
- [ ] Fix PACKAGE_ID in SmartphoneApp/App.js
- [ ] Fix test failures (MapHologram, analytics)
- [ ] Remove large binaries from repo
- [ ] Update .gitignore
- [ ] Run npm audit fix

### Month 1 Checklist

- [ ] Increase test coverage to 25%
- [ ] Add backend unit tests
- [ ] Consolidate documentation (reduce to <100 files)
- [ ] Fix all npm vulnerabilities
- [ ] Add API documentation (basic)

### Quarter 1 Checklist

- [ ] Increase test coverage to 50%
- [ ] Implement monitoring and observability
- [ ] Complete API documentation
- [ ] Optimize performance (bundle size, queries)
- [ ] Implement CI/CD improvements

---

## 🔧 Quick Wins (Can Do Today)

1. **Fix Go Version** (5 min)
   ```bash
   cd backend
   sed -i 's/go 1.24.1/go 1.22/' go.mod
   git commit -am "fix: Update Go version to 1.22"
   ```

2. **Fix PACKAGE_ID** (15 min)
   - Update App.js to use environment variable
   - Add to .env.example
   - Commit changes

3. **Run npm audit fix** (30 min)
   ```bash
   npm audit fix
   git commit -am "fix: Resolve npm vulnerabilities"
   ```

4. **Add binaries to .gitignore** (5 min)
   ```bash
   echo -e "\n# Compiled binaries\nrelayer\nmonitor\ndashboard/occ-dashboard" >> .gitignore
   git commit -am "chore: Ignore compiled binaries"
   ```

---

## 📈 Success Metrics

### Week 1 Success Criteria
- ✅ All critical issues resolved
- ✅ Backend builds successfully
- ✅ All tests passing
- ✅ No large binaries in repo

### Month 1 Success Criteria
- ✅ Test coverage >25%
- ✅ Documentation <100 files
- ✅ Zero npm vulnerabilities
- ✅ Backend tests added

### Quarter 1 Success Criteria
- ✅ Test coverage >50%
- ✅ Monitoring implemented
- ✅ API documentation complete
- ✅ Performance optimized

---

## 🚀 Getting Started

To begin implementing this action plan:

1. **Review the audit report**: Read `PROJECT_AUDIT_REPORT.md`
2. **Start with quick wins**: Fix Go version and PACKAGE_ID today
3. **Create GitHub issues**: One issue per action item
4. **Assign priorities**: Label issues as P0, P1, P2
5. **Track progress**: Update this document weekly

---

## 📞 Support

If you need help with any of these fixes:
- Review the full audit report: `PROJECT_AUDIT_REPORT.md`
- Check existing documentation in `/docs/`
- Create a GitHub issue for discussion
- Consult the team in your communication channels

---

**Last Updated**: January 6, 2025  
**Next Review**: January 13, 2025 (Weekly)
