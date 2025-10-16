# Git Repository Cleanup Guide

## Current Status

**Repository Size Issue Detected:**
- Working directory: 37 GB
- Git history: 7.8 GB (too large!)
- Main culprit: ML model files (3.9 GB × 2 in history)

---

## Problem

The IndicTrans2 model (~7.6 GB) was accidentally committed to git history. This makes the repository too large to push to GitHub (GitHub's limit is 100 MB per file, 2 GB per repository).

---

## Solution: Clean Git History

### Option 1: Using git-filter-repo (Recommended)

**Step 1: Install git-filter-repo**
```bash
pip install git-filter-repo
```

**Step 2: Remove model files from history**
```bash
cd /Users/arhrid/antima-workspace/indic_translator

# Remove all model files
git filter-repo --path models/ --invert-paths

# Remove large binary files
git filter-repo --path '*.bin' --invert-paths
git filter-repo --path '*.safetensors' --invert-paths
git filter-repo --path '*.pt' --invert-paths
```

**Step 3: Force push to remote**
```bash
git push origin main --force-with-lease
```

---

### Option 2: Using BFG Repo-Cleaner

**Step 1: Install BFG**
```bash
brew install bfg
```

**Step 2: Clone a fresh copy**
```bash
git clone --mirror /Users/arhrid/antima-workspace/indic_translator indic_translator.git
```

**Step 3: Remove large files**
```bash
bfg --delete-files '*.bin' indic_translator.git
bfg --delete-files '*.safetensors' indic_translator.git
bfg --delete-files '*.pt' indic_translator.git
bfg --strip-blobs-bigger-than 100M indic_translator.git
```

**Step 4: Prune and push**
```bash
cd indic_translator.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --mirror
```

---

## Prevention: Updated .gitignore

**File:** `.gitignore`

```
# ML Models (too large for git)
models/
*.bin
*.safetensors
*.pt
*.pth
*.ckpt

# Large files
*.tar.gz
*.zip
*.7z

# Testing artifacts
/test-results/
/playwright-report/
/blob-report/

# Dependencies
node_modules/
.pnp
.pnp.js

# Build
.next/
out/
build/
dist/

# Environment
.env.local
.env.development.local
.env.test.local
.env.production.local
```

---

## Recommended Approach

### For This Project:

1. **Update .gitignore** (already done)
   ```bash
   git add .gitignore
   git commit -m "chore: add model files to gitignore"
   ```

2. **Clean history using git-filter-repo**
   ```bash
   # Install
   pip install git-filter-repo
   
   # Remove models directory
   git filter-repo --path models/ --invert-paths
   
   # Force push
   git push origin main --force-with-lease
   ```

3. **Verify cleanup**
   ```bash
   # Check new size
   du -sh .git
   
   # Should be < 100 MB now
   ```

---

## Model Distribution Strategy

### Instead of Git, Use:

1. **Hugging Face Hub** (Recommended)
   ```python
   from huggingface_hub import snapshot_download
   
   model_path = snapshot_download(
       repo_id="ai4bharat/indictrans2-indic-en-1B",
       cache_dir="./models"
   )
   ```

2. **Download Script**
   ```bash
   # File: scripts/download-model.sh
   #!/bin/bash
   
   MODEL_DIR="models/translation/IndicTrans2"
   
   if [ ! -d "$MODEL_DIR" ]; then
       echo "Downloading IndicTrans2 model..."
       huggingface-cli download \
           ai4bharat/indictrans2-indic-en-1B \
           --cache-dir "$MODEL_DIR"
   fi
   ```

3. **Docker Volume**
   ```dockerfile
   # Mount model as volume
   VOLUME ["/app/models"]
   ```

4. **AWS S3 / Cloud Storage**
   ```python
   import boto3
   
   s3 = boto3.client('s3')
   s3.download_file(
       'my-bucket',
       'models/indictrans2.tar.gz',
       'models/indictrans2.tar.gz'
   )
   ```

---

## Current .gitignore Status

✅ Updated with:
```
# ML Models (too large for git)
models/
*.bin
*.safetensors
*.pt
```

---

## Next Steps

1. **Commit .gitignore update**
   ```bash
   git add .gitignore
   git commit -m "chore: exclude model files from git"
   ```

2. **Clean git history** (if pushing to GitHub)
   ```bash
   pip install git-filter-repo
   git filter-repo --path models/ --invert-paths
   git push origin main --force-with-lease
   ```

3. **Update documentation**
   - Add model download instructions to README
   - Document setup process
   - Include model download script

4. **Test deployment**
   - Verify model downloads on first run
   - Test inference pipeline
   - Check performance

---

## Repository Size After Cleanup

**Before:**
- Working directory: 37 GB
- Git history: 7.8 GB

**After (Expected):**
- Working directory: ~1 GB (without models)
- Git history: ~50 MB (code only)

---

## Verification Commands

```bash
# Check current size
du -sh .git

# List largest files in git
git rev-list --all --objects | \
  sed 's/ .*//' | \
  git cat-file --batch-check | \
  grep blob | \
  sort -k3 -n | \
  tail -10

# Check .gitignore is working
git check-ignore -v models/
git check-ignore -v *.bin
```

---

## References

- [git-filter-repo Documentation](https://github.com/newren/git-filter-repo)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [GitHub File Size Limits](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)
- [Git LFS](https://git-lfs.com/)

---

**Status:** ⚠️ Cleanup Required  
**Priority:** High (before pushing to GitHub)  
**Estimated Time:** 10-15 minutes
