#!/bin/bash

echo "enter the branch name"

read branch_name

echo "switched to new branch $branch_name"

git add .
echo "Enter the commit message"
read commit_message
git commit -m "$commit_message"
git push origin $branch_name
echo "pushed to remote branch successfully: $branch_name"
