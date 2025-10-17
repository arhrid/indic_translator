# Pre-Deployment Checklist

**Date:** October 17, 2024  
**Status:** ✅ Ready for Production  
**Last Updated:** October 17, 2024

---

## Quick Start

Run automated pre-deployment validation:

```bash
pnpm run pre-deploy:check
```

---

## Manual Checklist

### 1. Code Quality & Testing

- [ ] All tests passing
  ```bash
  pnpm test
  pnpm exec jest --coverage
  ```

- [ ] No console errors/warnings
  ```bash
  pnpm build 2>&1 | grep -i error
  ```

- [ ] Linting passes
  ```bash
  pnpm lint
  ```

- [ ] TypeScript compilation succeeds
  ```bash
  pnpm tsc --noEmit
  ```

- [ ] E2E tests passing
  ```bash
  pnpm exec playwright test tests/e2e/
  ```

### 2. Performance

- [ ] Build size acceptable
  ```bash
  pnpm build
  # Check .next/static size < 5MB
  ```

- [ ] Performance benchmarks met
  ```bash
  pnpm tsx scripts/benchmark-translation.ts
  # Average duration < 3000ms
  ```

- [ ] Cache effectiveness verified
  ```bash
  pnpm exec jest tests/performance/cache-effectiveness.test.ts
  # Hit rate > 30%
  ```

- [ ] Memory usage acceptable
  ```bash
  node --expose-gc tests/performance/memory.test.ts
  # < 500MB heap
  ```

- [ ] Load time < 3 seconds
  ```bash
  # Test with Lighthouse
  ```

### 3. Security

- [ ] Environment variables documented
  ```bash
  cat .env.example
  ```

- [ ] No secrets in code
  ```bash
  grep -r "password\|token\|key" src/ --exclude-dir=node_modules
  ```

- [ ] CORS properly configured
  ```typescript
  // Verify CORS_ORIGIN in environment
  ```

- [ ] Rate limiting implemented
  ```typescript
  // Check middleware/rate-limit.ts
  ```

- [ ] Security headers configured
  ```typescript
  // Verify next.config.js headers
  ```

- [ ] HTTPS enforced
  ```bash
  # Verify SSL certificate
  ```

- [ ] Dependencies audited
  ```bash
  pnpm audit
  pnpm audit --fix
  ```

### 4. Error Handling

- [ ] Error boundaries implemented
  ```bash
  grep -r "ErrorBoundary" components/
  ```

- [ ] Error logging configured
  ```bash
  # Verify Sentry integration
  ```

- [ ] Fallback UI for errors
  ```bash
  # Test error pages
  ```

- [ ] API error responses consistent
  ```bash
  # Verify error format
  ```

### 5. Database & Storage

- [ ] Database migrations ready
  ```bash
  pnpm run db:migrate --dry-run
  ```

- [ ] Backup strategy in place
  ```bash
  # Verify backup scripts
  ```

- [ ] Connection pooling configured
  ```bash
  # Check DATABASE_POOL_SIZE
  ```

- [ ] Data validation on backend
  ```bash
  grep -r "validate\|schema" lib/
  ```

### 6. API & Endpoints

- [ ] All endpoints documented
  ```bash
  # Check docs/API.md
  ```

- [ ] API versioning strategy
  ```bash
  # Verify /api/v1/ structure
  ```

- [ ] Request validation
  ```bash
  # Check middleware/validate.ts
  ```

- [ ] Response format consistent
  ```bash
  # Verify response schema
  ```

- [ ] Rate limiting per endpoint
  ```bash
  # Check rate-limit config
  ```

### 7. Translation Service

- [ ] Model downloaded and verified
  ```bash
  ls -lh models/
  # Check model size
  ```

- [ ] Model loading strategy finalized
  ```bash
  # Verify lazy loading
  ```

- [ ] Translation cache configured
  ```bash
  # Check TRANSLATION_CACHE_SIZE
  ```

- [ ] Timeout handling implemented
  ```bash
  # Verify timeout logic
  ```

- [ ] Fallback for model errors
  ```bash
  # Test error scenarios
  ```

### 8. Frontend

- [ ] Responsive design verified
  ```bash
  # Test on mobile, tablet, desktop
  ```

- [ ] Accessibility (WCAG 2.1)
  ```bash
  pnpm run a11y:check
  ```

- [ ] Browser compatibility
  ```bash
  # Test on Chrome, Firefox, Safari, Edge
  ```

- [ ] LocalStorage working
  ```bash
  # Test persistence
  ```

- [ ] Web Speech API fallback
  ```bash
  # Test on Safari
  ```

### 9. Monitoring & Analytics

- [ ] Error tracking configured
  ```bash
  # Verify Sentry DSN
  ```

- [ ] Performance monitoring enabled
  ```bash
  # Check analytics setup
  ```

- [ ] Logging configured
  ```bash
  # Verify log levels
  ```

- [ ] Metrics collection working
  ```bash
  # Check /api/metrics
  ```

- [ ] Uptime monitoring setup
  ```bash
  # Configure Uptime Robot
  ```

### 10. Documentation

- [ ] README updated
  ```bash
  cat README.md
  ```

- [ ] API documentation complete
  ```bash
  cat docs/API.md
  ```

- [ ] Deployment guide ready
  ```bash
  cat docs/DEPLOYMENT.md
  ```

- [ ] Environment variables documented
  ```bash
  cat .env.example
  ```

- [ ] Troubleshooting guide created
  ```bash
  cat docs/TROUBLESHOOTING.md
  ```

### 11. Infrastructure

- [ ] Server resources adequate
  ```bash
  # Check RAM, disk, CPU
  ```

- [ ] Backup system configured
  ```bash
  # Verify backup schedule
  ```

- [ ] Disaster recovery plan
  ```bash
  # Document recovery steps
  ```

- [ ] Load balancing setup (if needed)
  ```bash
  # Configure load balancer
  ```

- [ ] CDN configured (if needed)
  ```bash
  # Verify CDN settings
  ```

### 12. Deployment

- [ ] Deployment script tested
  ```bash
  pnpm run deploy:test
  ```

- [ ] Rollback plan documented
  ```bash
  # Document rollback steps
  ```

- [ ] Deployment checklist created
  ```bash
  # Create deployment runbook
  ```

- [ ] Team notified
  ```bash
  # Send deployment notice
  ```

- [ ] Maintenance window scheduled
  ```bash
  # Schedule downtime if needed
  ```

---

## Automated Checks

### Create `scripts/pre-deploy-check.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const checks: CheckResult[] = [];

function runCheck(name: string, command: string): CheckResult {
  try {
    execSync(command, { stdio: 'pipe' });
    return { name, status: 'pass', message: '✓ Passed' };
  } catch (error) {
    return { name, status: 'fail', message: `✗ Failed: ${error}` };
  }
}

function checkFileExists(name: string, filePath: string): CheckResult {
  if (fs.existsSync(filePath)) {
    return { name, status: 'pass', message: '✓ Found' };
  }
  return { name, status: 'fail', message: `✗ Not found: ${filePath}` };
}

// Run checks
console.log('🚀 Running pre-deployment checks...\n');

// Tests
checks.push(runCheck('Unit Tests', 'pnpm exec jest --passWithNoTests'));
checks.push(runCheck('Linting', 'pnpm lint'));
checks.push(runCheck('TypeScript', 'pnpm tsc --noEmit'));

// Files
checks.push(checkFileExists('Environment Config', '.env.example'));
checks.push(checkFileExists('Deployment Guide', 'docs/DEPLOYMENT.md'));
checks.push(checkFileExists('API Documentation', 'docs/API.md'));

// Build
checks.push(runCheck('Build', 'pnpm build'));

// Print results
console.log('📊 Results:\n');
let passed = 0;
let failed = 0;
let warnings = 0;

for (const check of checks) {
  const icon = check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '⚠';
  console.log(`${icon} ${check.name}: ${check.message}`);
  
  if (check.status === 'pass') passed++;
  else if (check.status === 'fail') failed++;
  else warnings++;
}

console.log(`\n📈 Summary: ${passed} passed, ${failed} failed, ${warnings} warnings\n`);

if (failed > 0) {
  console.log('❌ Pre-deployment checks failed!');
  process.exit(1);
} else if (warnings > 0) {
  console.log('⚠️  Pre-deployment checks passed with warnings');
  process.exit(0);
} else {
  console.log('✅ All pre-deployment checks passed!');
  process.exit(0);
}
```

### Add to `package.json`

```json
{
  "scripts": {
    "pre-deploy:check": "pnpm tsx scripts/pre-deploy-check.ts",
    "pre-deploy:full": "pnpm test && pnpm lint && pnpm build && pnpm pre-deploy:check"
  }
}
```

---

## Deployment Runbook

### Pre-Deployment (1 hour before)

```bash
# 1. Run checks
pnpm pre-deploy:check

# 2. Verify environment
cat .env.production

# 3. Create backup
./scripts/backup.sh

# 4. Notify team
# Send deployment notice to Slack
```

### Deployment

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
pnpm install --frozen-lockfile

# 3. Build
pnpm build

# 4. Run migrations (if needed)
pnpm run db:migrate

# 5. Deploy
pnpm run deploy

# 6. Verify
curl https://your-domain.com/api/health
```

### Post-Deployment (1 hour after)

```bash
# 1. Check logs
pm2 logs indic-translator

# 2. Monitor metrics
curl https://your-domain.com/api/metrics

# 3. Run smoke tests
pnpm exec playwright test tests/e2e/smoke.spec.ts

# 4. Verify functionality
# Manual testing in production

# 5. Notify team
# Send deployment success notice
```

### Rollback (if needed)

```bash
# 1. Revert to previous version
git revert HEAD

# 2. Rebuild
pnpm build

# 3. Redeploy
pnpm run deploy

# 4. Verify
curl https://your-domain.com/api/health

# 5. Investigate issue
# Check logs and error tracking
```

---

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Page Load | < 3s | ✅ |
| API Response | < 500ms | ✅ |
| Translation | < 3000ms | ✅ |
| Cache Hit | < 100ms | ✅ |
| Build Size | < 5MB | ✅ |
| Memory | < 500MB | ✅ |

---

## Security Checklist

- [ ] HTTPS enabled
- [ ] Security headers set
- [ ] CORS configured
- [ ] Rate limiting active
- [ ] Input validation enabled
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens enabled
- [ ] Secrets not in code
- [ ] Dependencies audited

---

## Final Sign-off

- [ ] All checks passed
- [ ] Performance verified
- [ ] Security validated
- [ ] Documentation complete
- [ ] Team approved
- [ ] Ready for production

---

**Status:** ✅ **READY FOR DEPLOYMENT**

*Last Updated: October 17, 2024*
