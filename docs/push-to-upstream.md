# Git Workflow for Updating Upstream Template Repository

This document outlines a workflow for selectively updating an upstream template
repository with new changes from your development project.

## Preparation

1. Make sure your local repository is clean (no uncommitted changes)

```bash
git status
```

## Creating a Temporary Integration Branch

2. Create a temporary branch from your development branch

```bash
git checkout dev
git checkout -b pull-from-upstream
```

## Pulling Changes from Upstream

3. Pull the latest changes from your upstream template

```bash
git pull upstream main
```

## Conflict Resolution

4. Resolve any merge conflicts if they occur

```bash
# If there are conflicts, edit the files to resolve them
# Then mark them as resolved
git add [conflicted-files]
git commit -m "Merge upstream changes and resolve conflicts"
```

## Identifying New Files

5. View the new files that were added in your project but not in upstream

```bash
git diff --name-status upstream/main pull-from-upstream | grep "^A"
```

## Selectively Pushing to Upstream

6. Create a branch based on upstream/main for your contributions

```bash
git checkout -b push-to-upstream upstream/main
```

7. Copy new files from a specific directory to push upstream in one command

```bash
# To copy only files from a specific directory (e.g., src/components/):
git diff --name-status upstream/main pull-from-upstream | grep "^A" | grep "src/components/" | cut -f2 | xargs -I{} git checkout pull-from-upstream -- {}
```

8. Commit and push to upstream

```bash
git add .
git commit -m "Add new components from project to template"
git push upstream push-to-upstream:main
```

## Cleanup

9. Return to your development branch and clean up temporary branches

```bash
git checkout dev
git branch -D pull-from-upstream
git branch -D push-to-upstream
```

## Additional Commands

### View Different Types of Changes

```bash
# New files in your project
echo "New files in your project:"
git diff --name-status upstream/main | grep "^A"

# Modified files
echo "Modified files:"
git diff --name-status upstream/main | grep "^M"

# Deleted files
echo "Deleted files:"
git diff --name-status upstream/main | grep "^D"
```

### Copy All New Files (Not Just From Specific Directory)

```bash
git diff --name-status upstream/main pull-from-upstream | grep "^A" | cut -f2 | xargs -I{} git checkout pull-from-upstream -- {}
```
