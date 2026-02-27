#!/bin/bash

# 开发环境启动脚本
# 同时启动后端和前端服务器

echo "========================================="
echo "启动 Uniy Market 开发环境"
echo "========================================="
echo ""

# 检查是否已经有服务器在运行
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  端口 3000 已被占用（后端）"
    echo "   如果是旧的后端进程，请先停止它"
    read -p "   是否要停止旧进程并继续？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $(lsof -t -i:3000) 2>/dev/null
        echo "   ✅ 已停止旧进程"
    else
        echo "   取消启动"
        exit 1
    fi
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  端口 5173 已被占用（前端）"
    read -p "   是否要停止旧进程并继续？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $(lsof -t -i:5173) 2>/dev/null
        echo "   ✅ 已停止旧进程"
    else
        echo "   取消启动"
        exit 1
    fi
fi

echo ""
echo "1. 启动后端服务器..."
echo "   端口: 3000"
echo "   日志: backend.log"
echo ""

# 启动后端
npm run dev > backend.log 2>&1 &
BACKEND_PID=$!
echo "   后端 PID: $BACKEND_PID"

# 等待后端启动
echo "   等待后端启动..."
for i in {1..30}; do
    if curl -s http://localhost:3000/api/products?page=1&limit=1 > /dev/null 2>&1; then
        echo "   ✅ 后端已启动"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "   ❌ 后端启动超时"
        echo "   请查看 backend.log 了解详情"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

echo ""
echo "2. 启动前端服务器..."
echo "   端口: 5173"
echo "   日志: frontend.log"
echo ""

# 启动前端
cd "Product Retrieval Main Page"
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "   前端 PID: $FRONTEND_PID"

# 等待前端启动
echo "   等待前端启动..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "   ✅ 前端已启动"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "   ❌ 前端启动超时"
        echo "   请查看 frontend.log 了解详情"
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

echo ""
echo "========================================="
echo "✅ 开发环境已启动"
echo "========================================="
echo ""
echo "后端: http://localhost:3000"
echo "前端: http://localhost:5173"
echo ""
echo "进程 ID:"
echo "  后端: $BACKEND_PID"
echo "  前端: $FRONTEND_PID"
echo ""
echo "日志文件:"
echo "  后端: backend.log"
echo "  前端: frontend.log"
echo ""
echo "停止服务器:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo "  或运行: ./stop-dev.sh"
echo ""
echo "查看日志:"
echo "  tail -f backend.log"
echo "  tail -f frontend.log"
echo ""
echo "现在可以在浏览器中打开: http://localhost:5173"
echo ""

# 保存 PID 到文件
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid
