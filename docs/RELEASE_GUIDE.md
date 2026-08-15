# HexoHub 自动发布指南

本项目配置了Github Action，可自动通过Tag识别更新并自动打包。

## 🎯 核心原则

**只在推送 Git tag 时触发自动构建，日常提交不会触发。**

---

## 📝 日常开发（不触发构建）

正常提交代码，**不会触发任何构建**：

```bash
# 随便提交，完全不会触发构建
git add .
git commit -m "feat: 添加新功能"
git push

git commit -m "fix: 修复 bug"
git push

git commit -m "refactor: 代码重构"
git push

# ... 继续开发 3-5 个功能
```

---

## 🚀 发布新版本（触发构建）

当你完成了 **3-5 个功能**，准备发布时：

### 1. 更新版本号

```bash
# 小更新（bug 修复）：2.6.0 -> 2.6.1
npm version patch

# 功能更新（新功能）：2.6.0 -> 2.7.0
npm version minor

# 重大更新（不兼容）：2.6.0 -> 3.0.0
npm version major

# 测试版本：2.6.0 -> 2.7.0-beta.1
npm version prerelease --preid=beta
```

这个命令会自动：
- ✅ 修改 package.json 中的版本号
- ✅ 同步更新 src-tauri/tauri.conf.json 的版本号
- ✅ 同步更新 src-tauri/Cargo.toml 的版本号
- ✅ 创建一个 git commit（包含所有版本文件的更改）
- ✅ 创建一个 git tag（例如 v2.7.0）

> **注意**：版本号会自动同步到所有配置文件，无需手动修改！

如果你只想同步版本号而不创建 commit 和 tag：

1. 手动修改 `package.json` 中的 `version` 字段
2. 运行同步脚本：
   ```bash
   npm run sync-version
   ```

   
### 2. 推送 tag（触发构建）

```bash
git push --follow-tags
```

**只有这个操作会触发 GitHub Actions！**

### 3. 等待自动构建（约 15 分钟）

在本库，访问：https://github.com/kivvs/HexoHub-private/actions

在你fork的库，访问：https://github.com/[YourUsername]/HexoHub/actions


### 4. 检查并发布 Release

在本库，访问：https://github.com/kivvs/HexoHub-private/releases

在你fork的库，访问：https://github.com/[YourUsername]/HexoHub/releases


你会看到一个 **Draft（草稿）** 状态的 Release：

1. ✅ 检查文件是否都上传成功
2. ✅ 编辑 Release Notes（添加详细说明）
3. ✅ 点击 "Publish release" 按钮

完成！🎉

---

## 📋 发布前检查清单

```
[ ] 所有代码已提交
[ ] 本地测试通过（npm run electron）
[ ] 版本号已更新（npm version）
[ ] Tag 已推送（git push --follow-tags）
[ ] GitHub Actions 构建成功
[ ] 安装包已上传到 Release
[ ] Release Notes 已编写
```

---

## 🎯 完整示例

### 场景：开发了 3 周，完成 5 个功能，准备发布

```bash
# === 开发阶段（3 周） ===

# 第 1 周
git commit -m "feat: 添加 AI 分析功能"
git push  # ✅ 不触发构建

git commit -m "feat: 优化文章列表"
git push  # ✅ 不触发构建

# 第 2 周
git commit -m "feat: 添加批量导入"
git push  # ✅ 不触发构建

git commit -m "fix: 修复保存问题"
git push  # ✅ 不触发构建

# 第 3 周
git commit -m "feat: 添加夜间模式"
git push  # ✅ 不触发构建

# 现在有 5 个更新，准备发布！


# === 发布阶段（3 分钟操作 + 15 分钟等待） ===

# 1. 确保代码最新
git pull

# 2. 本地测试
npm run electron
# 确认应用正常运行

# 3. 更新版本号（有新功能，用 minor）
npm version minor
# 输出：v2.7.0

# 4. 推送 tag（触发自动构建）
git push --follow-tags

# 5. 查看构建进度
# 浏览器打开：https://github.com/kivvs/HexoHub-private/actions
# ☕ 去喝杯咖啡，等 15 分钟

# 6. 构建完成后，检查 Release
# 浏览器打开：https://github.com/kivvs/HexoHub-private/releases
# 编辑 Draft Release，添加更新说明

# 7. 点击 "Publish release"
# 完成！🎉
```

---

## 🔍 常见问题

### Q: 如何查看自上次版本的所有更改？

```bash
# 查看提交历史
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# 生成 Changelog
git log $(git describe --tags --abbrev=0)..HEAD --pretty=format:"- %s"
```

### Q: 如果构建失败怎么办？

1. 查看 Actions 页面的错误日志
2. 修复问题
3. 删除失败的 tag：
   ```bash
   git tag -d v2.7.0
   git push origin :refs/tags/v2.7.0
   ```
4. 重新发布：
   ```bash
   npm version minor
   git push --follow-tags
   ```

### Q: 可以取消正在进行的构建吗？

可以！访问 Actions 页面，点击正在运行的工作流，右上角有 "Cancel workflow" 按钮。

### Q: 如何发布紧急修复？

```bash
# 1. 修复问题
git commit -m "fix: 紧急修复 XXX"

# 2. 立即发布 patch 版本
npm version patch
git push --follow-tags

# 3. 等待 15 分钟自动构建完成
```

---

## 📊 版本号规范

遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

```
格式：主版本号.次版本号.修订号

主版本号 (major)：重大不兼容更改
  例如：2.6.0 -> 3.0.0

次版本号 (minor)：新增功能，向后兼容
  例如：2.6.0 -> 2.7.0

修订号 (patch)：bug 修复，向后兼容
  例如：2.6.0 -> 2.6.1

预发布版本：
  例如：2.7.0-beta.1
  例如：2.7.0-alpha.1
```

---

## ⏱️ 预计时间

| 操作 | 时间 |
|------|------|
| 更新版本号 | 10 秒 |
| 推送 tag | 5 秒 |
| 自动构建 | 15 分钟 |
| 检查并发布 | 2 分钟 |
| **总计** | **~17 分钟** |

**你的实际操作时间**：不到 3 分钟 ⏱️

---

## ✨ 优势总结

**vs 手动构建（85 分钟）：**
- ⏱️ 节省时间：85 分钟 → 17 分钟
- 🤖 自动化：大部分工作自动完成
- 🔄 并行构建：Windows + Linux 同时进行
- ✅ 标准化：每次构建过程一致

**vs 每次提交都构建：**
- 💰 节省资源：不会频繁触发
- 🎯 按需发布：完全由你控制节奏
- 🔒 稳定性：只发布完整的版本

---

有问题随时反馈！🚀

