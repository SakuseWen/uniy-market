#!/bin/bash

# Uniy Market 部署脚本
# 用于自动化部署流程

set -e  # 遇到错误时退出

echo "🚀 开始部署 Uniy Market..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查必需的环境变量
check_env_vars() {
    echo "📋 检查环境变量..."
    
    required_vars=(
        "JWT_SECRET"
        "SESSION_SECRET"
        "GOOGLE_CLIENT_ID"
        "GOOGLE_CLIENT_SECRET"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo -e "${RED}❌ 缺少必需的环境变量:${NC}"
        printf '%s\n' "${missing_vars[@]}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 环境变量检查通过${NC}"
}

# 运行安全审计
run_security_audit() {
    echo "🔒 运行安全审计..."
    
    cd ..
    npm run security:audit
    
    echo -e "${YELLOW}⚠️  请检查安全审计结果并修复所有关键和高危问题${NC}"
    read -p "是否继续部署？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "部署已取消"
        exit 1
    fi
}

# 构建应用
build_app() {
    echo "🔨 构建应用..."
    
    cd ..
    npm run build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 构建成功${NC}"
    else
        echo -e "${RED}❌ 构建失败${NC}"
        exit 1
    fi
}

# 运行测试
run_tests() {
    echo "🧪 运行测试..."
    
    cd ..
    npm test
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 测试通过${NC}"
    else
        echo -e "${RED}❌ 测试失败${NC}"
        exit 1
    fi
}

# 备份数据库
backup_database() {
    echo "💾 备份数据库..."
    
    if [ -f "../data/unity_market.db" ]; then
        backup_dir="../backups"
        mkdir -p "$backup_dir"
        
        timestamp=$(date +%Y%m%d_%H%M%S)
        backup_file="$backup_dir/unity_market_${timestamp}.db"
        
        cp "../data/unity_market.db" "$backup_file"
        echo -e "${GREEN}✅ 数据库已备份到: $backup_file${NC}"
    else
        echo -e "${YELLOW}⚠️  未找到数据库文件，跳过备份${NC}"
    fi
}

# 使用 Docker Compose 部署
deploy_with_docker() {
    echo "🐳 使用 Docker Compose 部署..."
    
    # 停止现有容器
    docker-compose down
    
    # 构建并启动新容器
    docker-compose up -d --build
    
    # 等待服务启动
    echo "⏳ 等待服务启动..."
    sleep 10
    
    # 检查健康状态
    if docker-compose ps | grep -q "Up"; then
        echo -e "${GREEN}✅ 部署成功！${NC}"
        docker-compose ps
    else
        echo -e "${RED}❌ 部署失败${NC}"
        docker-compose logs
        exit 1
    fi
}

# 直接部署（不使用 Docker）
deploy_direct() {
    echo "📦 直接部署..."
    
    cd ..
    
    # 停止现有进程
    if [ -f "unity-market.pid" ]; then
        pid=$(cat unity-market.pid)
        if ps -p $pid > /dev/null; then
            echo "停止现有进程 (PID: $pid)..."
            kill $pid
            sleep 2
        fi
    fi
    
    # 启动新进程
    NODE_ENV=production nohup node dist/index.js > logs/app.log 2>&1 &
    echo $! > unity-market.pid
    
    echo -e "${GREEN}✅ 应用已启动 (PID: $(cat unity-market.pid))${NC}"
}

# 主函数
main() {
    echo "================================"
    echo "Uniy Market 部署脚本"
    echo "================================"
    echo ""
    
    # 检查环境变量
    check_env_vars
    
    # 运行安全审计
    run_security_audit
    
    # 构建应用
    build_app
    
    # 运行测试
    run_tests
    
    # 备份数据库
    backup_database
    
    # 选择部署方式
    echo ""
    echo "选择部署方式:"
    echo "1) Docker Compose (推荐)"
    echo "2) 直接部署"
    read -p "请选择 (1/2): " -n 1 -r
    echo ""
    
    case $REPLY in
        1)
            deploy_with_docker
            ;;
        2)
            deploy_direct
            ;;
        *)
            echo -e "${RED}无效选择${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    echo "================================"
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo "================================"
    echo ""
    echo "访问应用: ${FRONTEND_URL:-http://localhost:3000}"
    echo "健康检查: ${FRONTEND_URL:-http://localhost:3000}/health"
    echo ""
}

# 运行主函数
main
