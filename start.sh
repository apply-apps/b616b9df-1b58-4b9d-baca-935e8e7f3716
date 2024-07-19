#!/bin/sh

# Use the EXPO_PORT environment variable if set, otherwise set to 443
if [ -z "$EXPO_PORT" ]; then
  EXPO_PORT=443
fi

# Copy initial index.js to App directory
echo "$(date) - Copying /app/image/index.js to /app/App/index.js"
# cp /app/image/index.js /app/App/index.js

# Function to start the application
start_application() {
  echo "$(date) - Starting the application on port $EXPO_PORT"
  npm start -- --reset-cache --port $EXPO_PORT &
  APP_PID=$!
  echo "$(date) - Application started with PID $APP_PID"
}

# Function to stop the application
stop_application() {
  echo "$(date) - Stopping the application"
  pkill -f "node /app/node_modules/.bin/expo start --reset-cache --port $EXPO_PORT"
  echo "$(date) - Application stopped"
}

# Function to rebuild the application
rebuild_application() {
  echo "$(date) - Rebuilding the application..."
  # Add any specific rebuild commands here, if necessary
  # cp /app/image/index.js /app/App/index.js
  stop_application
  start_application
  echo "$(date) - Application rebuilt and started"
}

# Ensure the directory and rebuild flag file exist
echo "$(date) - Ensuring /app directory and /app/rebuild_flag file exist"
mkdir -p /app
touch /app/rebuild_flag

# Start the application initially
echo "$(date) - Initial start of the application"
start_application

# Watch for changes in the directory containing the flag file to trigger rebuild
echo "$(date) - Starting inotifywait on /app directory"
inotifywait -m -e create,modify,delete /app |
while read -r directory events filename; do
  echo "$(date) - Detected event: $events on $filename in $directory"
  if [ "$filename" = "rebuild_flag" ]; then
    echo "$(date) - Detected rebuild_flag file change. Rebuilding app..."
    rebuild_application
  fi
done