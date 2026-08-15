#!/bin/bash

DOCKER_REPO="arezkisaba/main"
IMAGE_BASE_NAME="cadmus"
BACKEND_NAME="${IMAGE_BASE_NAME}-backend"
FRONTEND_NAME="${IMAGE_BASE_NAME}-frontend"
LOCAL_OVPN_PATH="/etc/openvpn/main.conf"
LOCAL_OVPN_AUTH_PATH="/etc/openvpn/auth.txt"

clean_dependencies() {
    echo "🧹 Cleaning node_modules and dist folders..."
    rm -rf node_modules dist
    rm -rf backend/.config
    rm -rf backend/node_modules backend/dist
    rm -rf frontend/node_modules frontend/dist
    echo "✅ Cleanup complete"
}

init_compose_file() {
    sed "s|{{DOCKER_REPO}}|$DOCKER_REPO|g; s|{{BACKEND_NAME}}|$BACKEND_NAME|g; s|{{FRONTEND_NAME}}|$FRONTEND_NAME|g" docker-compose.build.yml.template >docker-compose.build.yml
    sed "s|{{DOCKER_REPO}}|$DOCKER_REPO|g; s|{{BACKEND_NAME}}|$BACKEND_NAME|g; s|{{FRONTEND_NAME}}|$FRONTEND_NAME|g" docker-compose.prod.yml.template >docker-compose.prod.yml
}

stop_services() {
    echo "⏹️ Stopping existing services..."
    sudo systemctl stop openvpn@main
    sudo systemctl disable openvpn@main
    sudo docker-compose -f docker-compose.prod.yml down
}

configure_openvpn() {
    if [ -f "$LOCAL_OVPN_PATH" ]; then
        sudo sed -i "s|^auth-user-pass.*|auth-user-pass $LOCAL_OVPN_AUTH_PATH|" "$LOCAL_OVPN_PATH"
        sudo cat "$LOCAL_OVPN_PATH"
    fi

    if [ -n "$OPENVPN_USER" ] && [ -n "$OPENVPN_PASS" ]; then
        openvpn_username="$OPENVPN_USER"
        openvpn_password="$OPENVPN_PASS"
    else
        read -p "OpenVPN username: " openvpn_username
        read -s -p "OpenVPN password: " openvpn_password
        echo
    fi

    printf '%s\n' "$openvpn_username" | sudo tee "$LOCAL_OVPN_AUTH_PATH" >/dev/null
    printf '%s\n' "$openvpn_password" | sudo tee -a "$LOCAL_OVPN_AUTH_PATH" >/dev/null
    sudo chown root:root "$LOCAL_OVPN_AUTH_PATH" 2>/dev/null
    sudo chmod 600 "$LOCAL_OVPN_AUTH_PATH" 2>/dev/null

}

configure_docker() {
    echo "🧹 Cleaning up old images..."
    if docker image inspect "$DOCKER_REPO:$BACKEND_NAME" >/dev/null 2>&1; then
        sudo docker rmi -f "$DOCKER_REPO:$BACKEND_NAME"
    fi
    if docker image inspect "$DOCKER_REPO:$FRONTEND_NAME" >/dev/null 2>&1; then
        sudo docker rmi -f "$DOCKER_REPO:$FRONTEND_NAME"
    fi

    echo "🔨 Building images..."
    sudo docker-compose -f docker-compose.build.yml build --no-cache
}

start_services() {
    echo "▶️ Starting services..."
    sudo systemctl start openvpn@main
    sudo systemctl enable openvpn@main
    sudo -E docker-compose -f docker-compose.prod.yml up
}

clean_dependencies
init_compose_file
stop_services
configure_openvpn
configure_docker
start_services
