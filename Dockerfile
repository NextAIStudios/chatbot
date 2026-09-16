# Production Dockerfile for Botly Pro on Northflank
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy all project files into nginx html directory
COPY . /usr/share/nginx/html

# Setup runtime entrypoint script for environment variable injection
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 8080 (standard for Northflank services)
EXPOSE 8080

# Execute entrypoint to inject env vars, then launch nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
