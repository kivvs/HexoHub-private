// server.ts - Next.js Standalone + Socket.IO
import { setupSocket } from '@/lib/socket';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const currentPort = 4001;
const hostname = '0.0.0.0';

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    // Create Next.js app
    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      // In production, use the current directory where .next is located
      conf: dev ? undefined : { distDir: './.next' }
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer((req, res) => {
      // Skip socket.io requests from Next.js handler
      if (req.url?.startsWith('/api/socketio')) {
        return;
      }
      handle(req, res);
    });

    // Setup Socket.IO
    const io = new Server(server, {
      path: '/api/socketio',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    setupSocket(io);

    // Start the server
    server.listen(currentPort, hostname, () => {
      console.log(`> Ready on http://${hostname}:${currentPort}`);
      console.log(`> Socket.IO server running at ws://${hostname}:${currentPort}/api/socketio`);
    });

    // 优雅关闭服务器的函数
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n收到 ${signal} 信号，正在优雅关闭服务器...`);
      
      try {
        // 关闭 Socket.IO 服务器
        io.close(() => {
          console.log('Socket.IO 服务器已关闭');
        });

        // 关闭 HTTP 服务器
        server.close(() => {
          console.log('HTTP 服务器已关闭');
          process.exit(0);
        });

        // 设置超时，如果10秒内无法正常关闭，强制退出
        setTimeout(() => {
          console.error('服务器关闭超时，强制退出');
          process.exit(1);
        }, 10000);
      } catch (error) {
        console.error('关闭服务器时出错:', error);
        process.exit(1);
      }
    };

    // 监听关闭信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Windows 下的 Ctrl+C
    if (process.platform === 'win32') {
      process.on('SIGBREAK', () => gracefulShutdown('SIGBREAK'));
    }

    // 捕获未处理的异常
    process.on('uncaughtException', (error) => {
      console.error('未捕获的异常:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('未处理的 Promise 拒绝:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Start the server
createCustomServer();
