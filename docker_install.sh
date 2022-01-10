#!/bin/bash
apt-get update -y
sudo apt-get install     ca-certificates     curl     gnupg     lsb-release
echo   "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
$(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -y
sudo apt-get install docker-ce docker-ce-cli containerd.io -y
systemctl enable docker
