#!/bin/bash
echo "Configuring Nginx..."
cat << 'EOF' | sudo tee /etc/nginx/sites-available/default > /dev/null
server {
    listen 80;
    server_name gusenglishschool.com www.gusenglishschool.com gusenglishschool.com.br www.gusenglishschool.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
sudo systemctl restart nginx
pm2 start npm --name "plataforma" -- start
echo "Tudo pronto!"
