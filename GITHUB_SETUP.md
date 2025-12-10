# GitHub Setup Guide

This guide will help you push your PureHalf project to GitHub.

## ✅ Pre-Push Checklist

### 1. **Update Repository URL in package.json**

The `package.json` currently has a placeholder repository URL. Update it with your actual GitHub repository URL:

```json
"repository": {
  "type": "git",
  "url": "git+https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
}
```

### 2. **Verify .gitignore is Complete**

The `.gitignore` file has been updated to exclude:
- ✅ `node_modules/`
- ✅ `.expo/`
- ✅ `.env*` files (environment variables)
- ✅ Build artifacts
- ✅ Sensitive keys and certificates

### 3. **Create GitHub Repository**

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Name your repository (e.g., `PureHalf`)
4. Choose visibility (Public or Private)
5. **DO NOT** initialize with README, .gitignore, or license (you already have these)
6. Click "Create repository"

### 4. **Add Remote and Push**

Run these commands in your terminal:

```bash
# Add your GitHub repository as remote (replace with your actual URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Stage all files
git add .

# Create initial commit
git commit -m "feat: initial commit"

# Push to GitHub (main branch)
git push -u origin main
```

### 5. **Verify What Will Be Pushed**

Before pushing, you can check what files will be committed:

```bash
# See what will be committed
git status

# See detailed changes
git diff --cached
```

## 🔒 Security Checklist

Before pushing, ensure these sensitive files are **NOT** in your repository:

- ✅ `.env.development` - Should be ignored
- ✅ `.env.staging` - Should be ignored
- ✅ `.env.production` - Should be ignored
- ✅ Any API keys or secrets
- ✅ Certificate files (`.p12`, `.p8`, `.jks`, `.key`)
- ✅ `eas.json` - Check if it contains sensitive tokens (usually safe, but review)

### Create .env.example (Optional but Recommended)

Create example environment files for other developers:

```bash
# Create example files (without actual values)
cp .env.development .env.development.example
# Then remove sensitive values from .env.development.example
```

## 📝 Additional Steps (Optional)

### Update README.md

Make sure your `README.md` has:
- Correct repository URL
- Setup instructions
- Environment variable setup guide

### Set Up GitHub Actions Secrets

If you're using GitHub Actions (you have workflows in `.github/workflows/`), you'll need to add secrets:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add required secrets (EAS tokens, API keys, etc.)

### Branch Protection (Recommended)

For production projects:
1. Go to Settings → Branches
2. Add rule for `main` branch
3. Require pull request reviews before merging

## 🚀 Quick Push Commands

Once everything is set up:

```bash
# Check status
git status

# Add all files
git add .

# Commit with conventional commit message
git commit -m "feat: initial commit"

# Push to GitHub
git push -u origin main
```

## 🔍 Verify After Push

1. Visit your GitHub repository
2. Verify all files are present
3. Check that `.env*` files are **NOT** visible
4. Verify `node_modules/` is not in the repository

## ⚠️ Common Issues

### Issue: "Repository not found"
- **Solution**: Check your repository URL and ensure you have access

### Issue: "Permission denied"
- **Solution**: Use SSH keys or GitHub Personal Access Token

### Issue: ".env files are visible"
- **Solution**: Remove them from Git history:
  ```bash
  git rm --cached .env.development .env.staging .env.production
  git commit -m "chore: remove env files from tracking"
  ```

### Issue: "Large files"
- **Solution**: Check file sizes, consider using Git LFS for large assets

## 📚 Next Steps

After pushing:
1. Set up branch protection rules
2. Configure GitHub Actions secrets
3. Add collaborators
4. Create issues for known bugs/features
5. Set up project board

---

**Note**: Always review what you're committing before pushing, especially on the first commit!

