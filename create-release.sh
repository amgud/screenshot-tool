#!/bin/bash

# Script to create a new version and GitHub release tag

# Check if version is provided
if [ $# -eq 0 ]; then
    echo "Please provide a version number (e.g. 1.0.1)"
    exit 1
fi

VERSION=$1

# Update version in manifest.json
sed -i '' "s/\"version\": \"[0-9.]*\"/\"version\": \"$VERSION\"/" manifest.json

# Commit changes
git add manifest.json
git commit -m "Bump version to $VERSION"

# Create tag
git tag "v$VERSION"

# Push both commit and tag in one command
git push origin main --tags

echo "Version bumped to $VERSION and changes pushed to main branch."
echo "Tag v$VERSION has been pushed."
echo "GitHub Actions workflow should start soon to create the release."
