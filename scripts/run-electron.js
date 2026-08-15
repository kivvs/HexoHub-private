// Electron 启动包装脚本
// 解决：用户级环境变量 ELECTRON_RUN_AS_NODE=1 会使 Electron 以纯 Node 模式运行
// 导致 ipcMain 等 API 不可用。此处在本进程环境删除该变量后，再启动 Electron 主进程。
const { spawn } = require('child_process');
const path = require('path');

// 关键：在本进程（及继承给子进程）的环境中清除该变量
delete process.env.ELECTRON_RUN_AS_NODE;
delete process.env.ELECTRON_FORCE_IS_PACKAGED;

const root = path.join(__dirname, '..');
const electronPath = require('electron'); // 返回 electron.exe 路径字符串
const args = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ['.'];

const child = spawn(electronPath, args, {
  stdio: 'inherit',
  env: process.env,
  cwd: root,
});

child.on('close', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
  console.error('启动 Electron 失败:', err);
  process.exit(1);
});
