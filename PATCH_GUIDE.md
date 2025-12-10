# Patch Guide for @gorhom/bottom-sheet

This guide explains how to create and maintain patches for `@gorhom/bottom-sheet` using `patch-package`.

## 📦 Setup Complete

✅ `patch-package` and `postinstall-postinstall` are installed
✅ `postinstall` script added to `package.json`
✅ `patches/` directory created

## 🔧 How to Create a Patch

### Step 1: Make Your Changes

Edit the file you want to patch in `node_modules`:

```bash
# Edit the constants file
code node_modules/@gorhom/bottom-sheet/src/constants.ts
```

**File Location**: `node_modules/@gorhom/bottom-sheet/src/constants.ts`

### Step 2: Generate the Patch

After making your changes, run:

```bash
npx patch-package @gorhom/bottom-sheet
```

This will:

- Compare the modified file with the original
- Create a patch file in `patches/@gorhom+bottom-sheet+<version>.patch`
- The patch will be automatically applied after `pnpm install`

### Step 3: Commit the Patch

```bash
git add patches/
git commit -m "chore: add patch for @gorhom/bottom-sheet constants"
```

## 📝 Example: Common Modifications

### Example 1: Modify Animation Duration

**Original**:

```typescript
const ANIMATION_DURATION = 250;
```

**Modified**:

```typescript
const ANIMATION_DURATION = 300; // Increased for smoother animation
```

### Example 2: Adjust Keyboard Dismiss Threshold

**Original**:

```typescript
const KEYBOARD_DISMISS_THRESHOLD = 12.5;
```

**Modified**:

```typescript
const KEYBOARD_DISMISS_THRESHOLD = 15.0; // More forgiving threshold
```

### Example 3: Change Animation Easing

**Original**:

```typescript
const ANIMATION_EASING: EasingFunction = Easing.out(Easing.exp);
```

**Modified**:

```typescript
const ANIMATION_EASING: EasingFunction = Easing.bezier(0.25, 0.1, 0.25, 1);
```

## 🔄 How Patches Work

1. **After `pnpm install`**: The `postinstall` script automatically applies all patches
2. **Patch files**: Stored in `patches/` directory
3. **Version-specific**: Patches are tied to specific package versions
4. **Automatic**: No manual intervention needed after setup

## ⚠️ Important Notes

### When Package Updates

If `@gorhom/bottom-sheet` is updated:

1. The patch might fail to apply (version mismatch)
2. You'll need to:
   - Remove the old patch: `rm patches/@gorhom+bottom-sheet+*.patch`
   - Make your changes again in `node_modules`
   - Generate a new patch: `npx patch-package @gorhom/bottom-sheet`

### Testing Your Patch

1. Remove `node_modules`: `rm -rf node_modules`
2. Reinstall: `pnpm install`
3. Verify your changes are applied
4. Test your app

## 🛠️ Troubleshooting

### Patch Fails to Apply

```bash
# Check patch file
cat patches/@gorhom+bottom-sheet+*.patch

# Try applying manually
npx patch-package @gorhom/bottom-sheet --reverse
npx patch-package @gorhom/bottom-sheet
```

### Package Version Changed

```bash
# Check current version
pnpm list @gorhom/bottom-sheet

# Regenerate patch for new version
npx patch-package @gorhom/bottom-sheet
```

## 📋 Current File to Patch

**File**: `node_modules/@gorhom/bottom-sheet/src/constants.ts`

**What you can modify**:

- Animation constants (duration, easing, configs)
- Keyboard behavior thresholds
- Platform-specific configurations
- Dimension calculations
- Enum values (be careful with these)

## 🎯 Next Steps

1. **Make your changes** to `node_modules/@gorhom/bottom-sheet/src/constants.ts`
2. **Generate patch**: `npx patch-package @gorhom/bottom-sheet`
3. **Test**: Remove `node_modules` and reinstall
4. **Commit**: Add the patch file to git

---

**Note**: Always test thoroughly after applying patches, especially for UI/UX related changes!
