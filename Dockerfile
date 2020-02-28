FROM nginx:1.17

RUN echo "daemon off;" >> /etc/nginx/nginx.conf

COPY ./start.sh /start.sh
COPY ./default.conf /etc/nginx/conf.d/default.conf
COPY ./build /var/www/html

CMD ["/start.sh"]