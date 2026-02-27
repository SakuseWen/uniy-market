#!/bin/bash

# 停止开发服务器脚本

echo "========================================="
echo "停止 Uniy Market 开发环境"
echo "========================================="
echo ""

# 从文件读取 PID
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "停止后端服务器 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        echo "✅ 后端已停止"
    else
        echo "⚠️  后端进程不存在"
    fi
    rm .backend.pid
else
    echo "⚠️  未找到后端 PID 文件"
    # 尝试通过端口查找
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "通过端口查找后端进程..."
        kill $(lsof -t -i:3000) 2>/dev/null
        echo "✅ 后端已停止"
    fi
fi

echo ""

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "停止前端服务器 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        echo "✅ 前端已停止"
    else
        echo "⚠️  前端进程不存在"
    fi
    rm .frontend.pid
else
    echo "⚠️  未找到前端 PID 文件"
    # 尝试通过端口查找
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "通过端口查找前端进程..."
        kill $(lsof -t -i:5173) 2>/dev/null
        echo "✅ 前端已停止"
    fi
fi

echo ""
echo "========================================="
echo "✅ 开发环境已停止"
echo "========================================="
echo ""
