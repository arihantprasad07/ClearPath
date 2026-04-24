#!/bin/bash
set -e

echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Deploying to Firebase..."
firebase deploy

echo ""
echo "Deployment complete."
echo "Frontend: https://YOUR_PROJECT_ID.web.app"
