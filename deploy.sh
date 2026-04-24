#!/bin/bash
set -e

echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Installing Functions dependencies..."
cd firebase/functions
npm install
cd ..

echo "Deploying to Firebase..."
firebase deploy

echo ""
echo "Deployment complete."
echo "Frontend: https://YOUR_PROJECT_ID.web.app"
echo "Functions: https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api"
