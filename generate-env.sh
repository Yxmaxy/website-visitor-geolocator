#!/bin/bash

# Remove existing .env files if they exist
rm -f backend/.env
rm -f frontend/.env

# Create .env files
touch backend/.env
touch frontend/.env

# VAPID keys
echo "Generate vapid keys at https://web-push-codelab.glitch.me/ and copy them here"
read -p "WEBSITE_VISITOR_GEOLOCATOR_VAPID_PUBLIC_KEY: " WEBSITE_VISITOR_GEOLOCATOR_VAPID_PUBLIC_KEY
read -p "WEBSITE_VISITOR_GEOLOCATOR_VAPID_PRIVATE_KEY: " WEBSITE_VISITOR_GEOLOCATOR_VAPID_PRIVATE_KEY
read -p "WEBSITE_VISITOR_GEOLOCATOR_VAPID_EMAIL: " WEBSITE_VISITOR_GEOLOCATOR_VAPID_EMAIL

echo "WEBSITE_VISITOR_GEOLOCATOR_VAPID_PUBLIC_KEY=$WEBSITE_VISITOR_GEOLOCATOR_VAPID_PUBLIC_KEY" >> backend/.env
echo "WEBSITE_VISITOR_GEOLOCATOR_VAPID_PRIVATE_KEY=$WEBSITE_VISITOR_GEOLOCATOR_VAPID_PRIVATE_KEY" >> backend/.env
echo "WEBSITE_VISITOR_GEOLOCATOR_VAPID_EMAIL=$WEBSITE_VISITOR_GEOLOCATOR_VAPID_EMAIL" >> backend/.env

echo "VITE_WEBSITE_VISITOR_GEOLOCATOR_VAPID_PUBLIC_KEY=$WEBSITE_VISITOR_GEOLOCATOR_VAPID_PUBLIC_KEY" >> frontend/.env

# API configuration
read -p "VITE_BASE_BACKEND_API_URL eg.: http://localhost:8000/api/ " VITE_BASE_BACKEND_API_URL
echo "VITE_BASE_BACKEND_API_URL=$VITE_BASE_BACKEND_API_URL" >> frontend/.env

# Login/Logout
read -p "VITE_LOGIN_URL eg.: http://localhost:8000/admin/ " VITE_LOGIN_URL
echo "VITE_LOGIN_URL=$VITE_LOGIN_URL" >> frontend/.env
read -p "VITE_LOGOUT_URL eg.: http://localhost:8000/api/logout/ " VITE_LOGOUT_URL
echo "VITE_LOGOUT_URL=$VITE_LOGOUT_URL" >> frontend/.env

