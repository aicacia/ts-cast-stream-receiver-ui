#!/bin/bash

root_path="/var/www/html"
env_window_path="window.env"
env_variables=$(printenv | grep '^APP_')

# Create env.{sha1}.js
temp_env_file_name="env.js"
echo "Found ${#env_variables[@]} environment variable/s"
echo "$env_window_path = $env_window_path || {};" >> ${temp_env_file_name}

while IFS= read -r env_variable; do 
  key=$(echo $env_variable | awk -F= '{print $1}')
  value=$(echo $env_variable | awk -F= '{print $2}')
  echo "$key=$value"
  echo "$env_window_path.$key=\"$value\";" >> ${temp_env_file_name}
done <<< "$env_variables"

# Add shasum to file name for cache busting. Update references to it in static files.
env_hash=$(sha1sum ${temp_env_file_name} | cut -d ' ' -f 1)
env_hash_file_name="env.$env_hash.js"
echo "Env Hash File Name: $env_hash_file_name"
sed -i "s/\(env\.[a-zA-Z0-9]*\.js\)/$env_hash_file_name/" ${root_path}/index.html
mv ${temp_env_file_name} ${root_path}/${env_hash_file_name}

nginx