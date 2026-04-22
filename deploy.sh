#!/bin/bash

# ==========================================
# Uniy Market - 生产环境一键部署脚本
# 运行环境：Mac 本地终端
# ==========================================

# 1. 核心配置区
KEY_PATH="/Users/sakuse/Desktop/SP项目收据/uniy-market-key.pem"
SERVER="ubuntu@52.77.213.102"
REMOTE_DIR="~/uniy-market/"
LOCAL_DIR="/Users/sakuse/Programming/SP/"

echo "🚀 [1/2] 正在连接 AWS 云端，准备增量同步代码..."

# 2. 执行 rsync 安全同步
# --update: 只有本地文件比服务器新时才覆盖
# --exclude: 排除不需要或绝对不能覆盖的文件
rsync -avz --update -e "ssh -i $KEY_PATH" "$LOCAL_DIR" "$SERVER:$REMOTE_DIR" \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.DS_Store' \
  --exclude '.env' \
  --exclude 'Product Retrieval Main Page/.env'

echo "✅ [2/2] 代码传输完成！"
echo "=========================================="
echo "⚠️  注意：文件已上传，但尚未生效！"
echo "请登录 AWS 服务器 (SSH) 执行相应的重启/打包命令。"
echo "=========================================="