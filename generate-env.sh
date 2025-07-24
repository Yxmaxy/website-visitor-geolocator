#!/bin/bash

# Remove existing .env files if they exist
rm -f backend/.env
rm -f frontend/.env

# Create .env files
touch backend/.env
touch frontend/.env

# VAPID keys
echo "Generate vapid keys at https://web-push-codelab.glitch.me/ and copy them here"
read -p "VAPID_PUBLIC_KEY: " VAPID_PUBLIC_KEY
read -p "VAPID_PRIVATE_KEY: " VAPID_PRIVATE_KEY
read -p "VAPID_EMAIL: " VAPID_EMAIL

echo "VAPID_PUBLIC_KEY=$VAPID_PUBLIC_KEY" >> backend/.env
echo "VAPID_PRIVATE_KEY=$VAPID_PRIVATE_KEY" >> backend/.env
echo "VAPID_EMAIL=$VAPID_EMAIL" >> backend/.env

echo "VITE_VAPID_PUBLIC_KEY=$VAPID_PUBLIC_KEY" >> frontend/.env

# API configuration
read -p "VITE_BASE_BACKEND_API_URL eg.: http://localhost:8000/api/ " VITE_BASE_BACKEND_API_URL
echo "VITE_BASE_BACKEND_API_URL=$VITE_BASE_BACKEND_API_URL" >> frontend/.env

# Login/Logout
read -p "VITE_LOGIN_URL eg.: http://localhost:8000/admin/ " VITE_LOGIN_URL
echo "VITE_LOGIN_URL=$VITE_LOGIN_URL" >> frontend/.env
read -p "VITE_LOGOUT_URL eg.: http://localhost:8000/api/logout/ " VITE_LOGOUT_URL
echo "VITE_LOGOUT_URL=$VITE_LOGOUT_URL" >> frontend/.env

