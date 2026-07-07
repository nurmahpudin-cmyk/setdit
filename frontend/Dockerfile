FROM nginx:alpine

# Copy dist files
COPY dist /usr/share/nginx/html

# Copy startup script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5101

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
