# Production Dockerfile for Botly Pro on Northflank
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy all project files into nginx html directory
COPY . /usr/share/nginx/html

# Expose port 8080 (standard for Northflank services)
EXPOSE 8080

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
