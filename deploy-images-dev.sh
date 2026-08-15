#!/bin/bash

# TO EXECUTE FROM DEV MACHINE TO DEPLOY OPENVPN CONFIG TO REMOTE SERVER
ssh arezkisaba@192.168.1.101

# TO EXECUTE ON RASPBERRY PI TO PULL OPENVPN CONFIG FROM BABYLON SERVER
babylon_ip="192.168.1.100"
remote_username="arezkisaba"
remote_ovpn_path="/media/Babylon/system/openvpn/de1198.nordvpn.com.tcp.ovpn"
local_ovpn_path="/etc/openvpn/main.conf"
sudo scp $remote_username@$babylon_ip:$remote_ovpn_path $local_ovpn_path
sudo rm -rf /home/$remote_username/Downloads/cadmus
download_path="/home/$remote_username/Downloads"
scp -r $remote_username@$babylon_ip:/home/$remote_username/git/cadmus $download_path
cd "$download_path/cadmus"
./deploy-images-rpi.sh