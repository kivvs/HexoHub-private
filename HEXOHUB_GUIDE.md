# HexoHub 使用指南

> HexoHub 是一款 Hexo 博客管理桌面应用，提供**图形化界面**替代传统命令行操作。
> 本指南涵盖软件的完整功能，是日常使用与问题排查的参考手册。
>
> 📌 配套文档：[📖 HexoHub 使用教程（搭建个人博客全流程）](./HEXOHUB_TUTORIAL.md)

---

## 目录

- 一、软件简介与安装
- 二、界面总览
- 三、项目管理
- 四、文章管理
- 五、Markdown 编辑器
- 六、图片功能
- 七、博客主题管理
- 八、Hexo 操作与一键发布
- 九、配置管理
- 十、AI 功能
- 十一、数据统计
- 十二、软件界面主题与设置
- 十三、更新检查
- 十四、常见问题（FAQ）

---

## 一、软件简介与安装

### 1.1 简介

| 特性 | 说明 |
|-----|------|
| 小巧 | Tauri 发行版安装包仅约 5.8MB，安装后约 20MB |
| 轻量 | 基于 Next.js + React + TypeScript + Tauri/Electron |
| 快速 | 快速启动、快速响应，无冗余设计 |
| 简洁 | 简洁 UI，专注于博客管理 |
| 智能 | 集成 AI 辅助创作与问题诊断 |
| 主题化 | 六套软件界面主题 + 博客主题在线管理 |

### 1.2 系统要求（使用）

- **操作系统**：Windows 10 或更高版本
- **存储**：建议 200MB 可用空间
- **Hexo**：https://hexo.io/
- **npm**：`npm > 10` → https://www.npmjs.com/
- **Node.js**：`nodejs > 20` → https://nodejs.org/zh-cn/

### 1.3 安装步骤

1. 前往 [Releases](https://github.com/kivvs/HexoHub-private/releases/) 下载最新版本安装包
2. 推荐选择 **Tauri** 发行版（`HexoHub-Tauri-Windows-x.x.x.exe`）
3. 运行安装包，按提示完成安装
4. 安装完成后，从桌面快捷方式或开始菜单启动 HexoHub

> ⚠️ 若杀毒软件误报，请将 HexoHub 加入信任列表（开源项目常见现象）。

---

## 二、界面总览

启动后，HexoHub 主界面分为以下区域：

| 区域 | 功能 |
|-----|------|
| **顶栏** | 主题轮换、语言切换、AI 灵感、AI 诊断、更新检查等快捷操作 |
| **左侧栏** | 项目选择/创建、文章、图片、主题、配置、统计等导航入口 |
| **主工作区** | 根据所选功能展示对应面板（文章列表 / 编辑器 / 主题卡片等） |
| **编辑器区** | Markdown 编辑器（左）与实时预览（右），支持拖动分屏比例 |

![image-20260815134610945](../AppData/Roaming/Typora/typora-user-images/image-20260815134610945.png)

### 自定义标题栏

桌面端使用自定义标题栏，支持拖拽移动窗口、最小化/最大化/关闭，与软件界面主题保持一致。

---

## 三、项目管理

### 3.1 创建新项目

1. 点击 **「创建项目」**
2. 选择存储路径（建议**不含空格**）
3. 填写文件夹名称（如 `blog`）
4. 可勾选「使用淘宝镜像源」「安装部署插件」
5. 点击「创建」，等待环境检测 + 自动安装 + 初始化完成

> 向导会自动检测 npm / Git / hexo-cli 是否已安装并显示版本，缺失时给出明确提示。

### 3.2 打开已有项目

在左侧栏选择 **「打开项目」**，定位到 Hexo 项目目录（包含 `_config.yml` 的目录），软件自动校验并加载。

### 3.3 项目验证

打开项目后，软件会校验：

- 是否存在 `_config.yml`
- 是否为有效的 Hexo 项目结构（`source/`、`scaffolds/`、`themes/`、`node_modules/`）

验证失败时会在界面给出明确提示。

---

## 四、文章管理

### 4.1 文章列表

- 展示所有文章的标题、修改时间、front-matter 日期
- 支持**标签 / 分类筛选**（点击标签云或筛选器）
- 支持**分页**（每页条数可在面板设置调整）

### 4.2 新建文章

点击 **「新建文章」**，填写：

- **标题**（必填）
- **标签**：输入新标签或从已有标签下拉选择
- **分类**：同上
- **摘要**：可选
- **模板**：默认 `post`，可选 `page`、`draft` 等（自动读取 `scaffolds/` 目录）

### 4.3 编辑与保存

- 点击文章进入编辑器
- **自动保存**：默认每 3 分钟自动保存，可在面板设置修改间隔
- 工具栏「保存」按钮手动保存

### 4.4 删除文章

在文章列表中选择文章 → 点击删除 → 确认弹窗，删除前请确认已备份。

### 4.5 文章统计

在「统计」页可查看：

- **标签云**：文章标签聚合，点击可筛选文章
- **发布统计**：按月维度的文章发布数量图表

---

## 五、Markdown 编辑器

![image-20260815134721398](../AppData/Roaming/Typora/typora-user-images/image-20260815134721398.png)

### 5.1 工具栏

| 工具 | 说明 |
|-----|------|
| 标题 H1-H3 | 插入各级标题 |
| 加粗 / 斜体 | 快速包裹选中文字 |
| 引用 / 列表 / 有序列表 | 常见排版 |
| 链接 / 图片 | 插入引用 |
| 表格 / 代码 | GFM 支持 |
| 分割线 | 插入 `---` |
| **字体颜色** | 16 种常用色 + 自定义取色 + 清除颜色（生成 `<font color>` 标签） |

### 5.2 编辑器增强

- **富文本清理**：一键清除粘贴自语雀/Word 等处的 `<font style="...">` 样式标签，仅保留文字
- **HTML 渲染**：预览支持 `<font style>`、`<span>`、`<br>` 等内联标签，还原富文本排版
- **默认颜色修复**：编辑器文字始终跟随主题变量，不再出现"默认白色看不清"问题

### 5.3 编辑模式

- **模式 1（分屏）**：左侧编辑 + 右侧实时预览，拖动分隔条调节比例
- **模式 2（纯编辑）**：仅编辑器，预览通过按钮/外部浏览器
- **外部编辑器**：可启用使用系统 Markdown 编辑器编辑

### 5.4 预览

- **静态预览**：内置渲染（GFM 表格、HTML 标签）
- **服务器预览**：启动 `hexo server` 后，可通过 iframe 展示真实站点效果（地址模式可切换 hexo 标准地址 / 根路径）

---

## 六、图片功能

> 本软件采用**直接 URL 路径**引用图片（形如 `https://你的博客地址/images/xxx.png`），不使用 `{% asset_img %}` 标签。

![image-20260815134746990](../AppData/Roaming/Typora/typora-user-images/image-20260815134746990.png)

### 6.1 图片引用基础地址设置

在 **「面板设置」→「博客设置」** 中配置 **「图片引用基础地址」**（默认 `https://example.github.io/images/`，请改为您自己的博客域名，如 `https://kivvs.github.io/images/`）。

图片库「插入引用」时会自动拼接为 `基础地址 + 图片名`：

```
![](https://你的域名/images/图片名.png)
```

### 6.2 图片库管理（source/images）

- **视图切换**：网格 / 列表
- **按文章标签筛选**：图片自动关联文章标签
- **重命名 / 删除**：直接在图片库操作
- **插入引用**：一键在编辑器中插入图片的直接 URL 引用（`![](https://你的域名/images/图片名.png)`）

### 6.3 手动引用图片

在 Markdown 编辑器中直接输入图片的完整 URL：

```
![示例图片](https://你的域名/images/test.png)
```

### 6.4 图片提取（外部网络图片）

1. 在编辑器中点击「提取图片」
2. 自动识别 `<img src="...">` 与 Markdown 图片语法
3. 自动下载到 `source/images`，按 `文章名-序号.扩展名` 重命名
4. 自动关联当前文章并**替换正文引用**为 `images/xxx.png` 直接路径

### 6.5 背景图设置

在「面板设置」可设置软件背景图片 URL、透明度，并配置图片引用基础地址。

![image-20260815134811565](../AppData/Roaming/Typora/typora-user-images/image-20260815134811565.png)

---

## 七、博客主题管理



### 7.1 已安装主题

- 自动扫描 `themes/` 目录与 `node_modules/hexo-theme-*`
- 卡片展示：主题名 / 版本 / 来源 / 是否为有效 Hexo 主题
- 非 Hexo 主题（Gatsby/Hugo/VitePress）自动识别并**禁用切换**

### 7.2 一键切换（含智能回滚）

1. 点击目标主题卡片「切换」
2. 自动修改 `_config.yml` 的 `theme:` 字段
3. 自动执行 `hexo clean + generate` 验证
4. 生成失败时（缺 layout / 0 文件等）**自动回滚原主题**并重新生成
5. 保证任何主题切换都不会导致站点白屏

### 7.3 在线主题库

- 内置 hexo.io 官方目录（**440+ 主题**），含名称 / GitHub 链接 / 简介 / 标签
- 支持**搜索**、**已安装状态标记**
- **一键 SSH 下载安装**到 `themes/` 目录
- 三层加载加速：30 天长期缓存 → 打包静态目录（秒开、离线可用）→ 在线刷新

---

## 八、Hexo 操作与一键发布

### 8.1 单步命令

| 按钮 | 命令 | 说明 |
|-----|------|------|
| 清理 | `hexo clean` | 清理缓存文件 |
| 生成 | `hexo generate` | 生成静态文件到 `public/` |
| 部署 | `hexo deploy` | 部署到远程服务器（GitHub Pages 等） |
| 启动服务器 | `hexo server` | 本地预览，地址 `http://localhost:4000` |

所有命令执行均有**实时输出**（stdout / stderr）与成功/失败状态。

### 8.2 一键发布

点击 **「一键发布」**，自动顺序执行：**清理 → 生成 → 部署 → 推送**（如启用推送）。

- 若 git push 因远程有新提交被拒（non-fast-forward），自动 `git pull --rebase` 后重试一次
- 每一步骤状态实时展示，失败立即停止并高亮

### 8.3 推送设置（面板设置）

| 配置项 | 说明 |
|-------|------|
| 启用推送 | 是否在一键发布时推送源码到仓库 |
| 推送仓库地址 | HTTPS 或 SSH 地址，如 `https://github.com/用户名/仓库.git` 或 `git@github.com:用户名/仓库.git` |
| 推送分支 | 默认 `main` |
| 推送用户名 / 邮箱 | git 提交身份 |

### 8.4 GitHub 仓库准备（网页操作）

发布前需在 GitHub 网页创建仓库：

1. 登录 [GitHub](https://github.com) → 右上角头像 → **Your repositories**

   ![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/2b166635eb155af4280f7a543e8a0c91.png)

2. 点击 **New** → 仓库名填 `<用户名>.github.io`（GitHub Pages 固定命名，必须用您的用户名）

   ![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/996b57865fe5f52123cf99174db0811b.png)

3. 选择 **Public**（免费托管要求公开），可勾选添加 README，点击 **Create repository**

   ![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/ab8567f9eef0b6250ac609116186d41e.png)

4. 记录仓库地址（两种格式均可用于 HexoHub 配置）：
   - HTTPS：`https://github.com/用户名/用户名.github.io.git`
   - SSH：`git@github.com:用户名/用户名.github.io.git`

**（可选）创建一个简单主页验证 GitHub Pages：**

1. 在仓库页面点击 **「Add file」→「Create new file」**
2. 文件名**必须为 `index.html`**，内容示例：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>kivvs</title>
</head>
<body>
    <h1>kivvs的个人主页</h1>
    <h1>Hello ~</h1>
</body>
</html>
```

3. 点击 **「Commit new file」** 提交
4. 访问 `https://用户名.github.io/` 即可看到主页（仅用于演示 GitHub Pages；之后 HexoHub 一键发布会覆盖此文件）

> HTTPS 私有仓库推送需使用 **Personal Access Token**：GitHub → Settings → Developer settings → Personal access tokens → Generate new token（勾选 `repo`）→ 用户名填 GitHub 用户名、密码填 `ghp_xxx`。

### 8.5 SSH 连接 GitHub 仓库（推荐）

SSH 方式无需反复输入账号密码，且更安全。**三步完成配置：**

**（1）生成密钥**（任意终端）

```bash
ssh-keygen -t rsa -b 4096 -C "你的GitHub邮箱@example.com"
```

一路回车，默认保存到 `C:\Users\<用户名>\.ssh\id_rsa`。

**（2）添加公钥到 GitHub**

```bash
type C:\Users\<用户名>\.ssh\id_rsa.pub
```

复制输出 → GitHub → Settings → **SSH and GPG keys** → **New SSH key** → 粘贴 → **Add SSH key**。

**（3）测试并配置**

```bash
ssh -T git@github.com
# 看到 Hi <用户名>! You've successfully authenticated... 即成功
```

然后在 HexoHub「面板设置 → 部署推送」把仓库地址填为：

```
git@github.com:用户名/用户名.github.io.git
```

> 软件主题面板的「在线主题库」同样使用 SSH（`git@github.com:owner/repo.git`）一键下载安装主题，前提是 SSH 已连通 GitHub。
>
> 常见问题：`Permission denied (publickey)` → 公钥未正确添加，或 ssh-agent 未加载密钥（`ssh-add ~/.ssh/id_rsa`）。

### 8.6 自定义指令

在「面板设置 → 自定义指令」可自定义 clean/generate/server/deploy 的完整命令，适配特殊环境（如代理、特定 hexo 变体）。

### 8.7 命令日志

所有命令执行结果都会记录，可在日志对话框中查看历史（含成功/失败状态），也可作为 AI 诊断的上下文。

### 8.4 自定义指令

在「面板设置 → 自定义指令」可自定义 clean/generate/server/deploy 的完整命令，适配特殊环境（如代理、特定 hexo 变体）。

### 8.5 命令日志

所有命令执行结果都会记录，可在日志对话框中查看历史（含成功/失败状态），也可作为 AI 诊断的上下文。

---

## 九、配置管理

### 9.1 站点设置（基本）

| 字段 | 对应 `_config.yml` |
|-----|-------------------|
| 网站标题 | `title` |
| 副标题 | `subtitle` |
| 描述 | `description` |
| 作者 | `author` |
| 语言 | `language` |
| 时区 | `timezone` |
| 主题 | `theme` |

### 9.2 高级设置

- **URL 配置**：`url`、`root`
- **永久链接格式**：`permalink`

### 9.3 YAML 编辑器

直接编辑原始 `_config.yml` 文件，适合高级用户。

### 9.4 导入 / 导出

- **导出**：下载当前 `_config.yml`
- **导入**：选择 `.yml/.yaml` 文件覆盖配置
- 方便主题迁移与配置备份

### 9.5 主题配置文件

支持 fluid 等主题的 `_config.<主题名>.yml` 独立配置管理，表单化编辑主题参数。

---

## 十、AI 功能

### 10.1 启用 AI

1. **面板设置 → AI 设置**
2. 勾选「启用 AI」
3. 选择提供商：**DeepSeek / OpenAI / 硅基流动**
4. 填写 API 密钥，可「测试连接」
5. 按需配置模型、端点、提示词

### 10.2 功能一览

| 功能 | 入口 | 说明 |
|-----|------|------|
| **AI 灵感** | 顶栏「来点灵感」 | 基于博客主题与偏好生成写作灵感 |
| **AI 分析** | 统计页「开始分析」 | 分析标签与发布数据，给出鼓励性反馈 |
| **AI 重写 / 改进 / 扩展 / 翻译** | 编辑器右键菜单（需开启"编辑器 AI 增强"） | 对选中文字进行 AI 润色 |
| **AI 深度模仿** | 编辑器右键菜单 → AI 工具 | 参考选定文章风格模仿创作 |
| **AI 辅助诊断** | 顶栏「AI 诊断」 | 自动分析软件/博客问题并给出分步解决方案 |

### 10.3 AI 辅助诊断

1. 点击顶栏 **「AI 诊断」**
2. 描述遇到的问题（如主题切换白屏、部署失败、图片提取失败等）
3. 点击「开始诊断」

AI 自动携带诊断上下文：**软件/系统环境**（版本、架构、系统、Node/Hexo 版本）+ **项目上下文**（当前项目路径、最近 10 条操作日志）。

输出：**问题原因分析（分点）+ 可操作的解决步骤**。

### 10.4 隐私说明

- AI 请求直接发送至您配置的服务商 API，无第三方中转
- 诊断仅发送环境信息与最近 10 条操作日志摘要（不含文章正文）
- API 密钥仅保存在本地（localStorage）

---

## 十一、数据统计

### 11.1 标签云

文章标签聚合展示，点击标签筛选文章列表。

### 11.2 发布统计

按月份展示文章发布数量的图表。

### 11.3 外部统计（Giscus / GA4）

在「面板设置 → 外部统计」配置两种外部数据源，集中查看文章的**评论数与阅读量**：

- **Giscus（评论数）**：GitHub 仓库 + Discussion 分类 + Token
- **GA4（阅读量）**：Google Analytics 4 Property ID + 服务账号 JSON（需 **Google 账号**）

配置完成后，在「统计 → 外部统计」页面集中查看（Giscus 评论图表页 / GA4 阅读量图表页）。

#### ① 配置 Giscus 评论数（需 GitHub 账号）

**Step 1：GitHub 网页端准备**

1. 登录 GitHub，进入仓库页面 → **Settings → General → Features**，勾选 **「Discussions」** 启用 GitHub Discussions（Giscus 的底层）
2. 确认仓库为 **Public**（公开）
3. 到 [giscus.app](https://giscus.app) 输入仓库名 → 「连接」→ 完成 **giscus App 授权** → 选择 **Discussion 分类**（如 `Announcements`）
4. 记录生成脚本中的 `data-repo-id` / `data-category-id`（填入主题时使用）

**Step 2：GitHub Token 获取**

GitHub → Settings → Developer settings → Personal access tokens → Generate new token（勾选 `repo` / `discussion` 权限）→ 复制 `ghp_xxx`

**Step 3：在 HexoHub 中配置**

1. 打开 **「面板设置」→「外部统计」**
2. 填写：
   - **Giscus GitHub 仓库**：如 `kivvs/kivvs.github.io`
   - **Giscus Discussion 分类**：如 `Announcements`
   - **GitHub Token**：上一步生成的 Token
3. 统计页展示：评论总数 / 讨论数 / 反应数、互动趋势图、高互动讨论排行

> 若要让**读者在页面底部发表评论**，将 giscus.app 脚本中的 `repo` / `repo_id` / `category` / `category_id` 填入主题配置文件的 `giscus` 配置段。

#### ② 配置 GA4 阅读量（需 Google 账号）

**Step 1：创建 GA4 资源（Google Analytics）**

1. 用 [Google 账号](https://accounts.google.com) 登录 [Google Analytics](https://analytics.google.com)
2. **管理 → 创建 → 创建资源**，填写资源名称、报告时区、货币
3. 创建 **Web 数据流**，填写网站网址（如 `https://kivvs.github.io`）
4. 记下两个关键 ID（**不同，勿混淆**）：
   - **Property ID（资源 ID）**：**纯数字**（如 `123456789`），用于 HexoHub 的 "GA4 Property ID"
   - **衡量 ID（Measurement ID）**：`G-XXXXXXXXXX` 格式，仅用于 gtag.js 跟踪代码
5. 将 GA4 跟踪代码（gtag.js，使用衡量 ID）添加到主题模板 `head`/`footer`，开始收集访问数据

**Step 2：创建 Google Cloud 服务账号**

1. 用同一 Google 账号打开 [Google Cloud Console](https://console.cloud.google.com)，创建项目（或选择已有）
2. **API 和服务 → 库**，搜索并启用 **「Google Analytics Data API」**
3. **API 和服务 → 凭据 → 创建凭据 → 服务账号**：
   - 填写名称（如 `hexohub-analytics`），角色可选「查看者」，完成
4. 点击该服务账号 → **密钥 → 添加密钥 → 创建新密钥 → JSON**，下载得到**服务账号 JSON 文件**

**Step 3：授予 GA4 数据访问权限**

1. 回到 [Google Analytics](https://analytics.google.com) → **管理 → 访问管理**
2. 点击 **+**，添加用户在**服务账号邮箱**（JSON 中 `client_email`，格式 `xxx@xxx.iam.gserviceaccount.com`）
3. 角色选择 **「查看者」**（必须，否则 HexoHub 无法读取数据）

**Step 4：在 HexoHub 中填入配置**

1. 打开 **「面板设置」→「外部统计」**
2. 填写：
   - **GA4 Property ID**：**纯数字资源 ID**（如 `123456789`），**不是** `G-` 开头的衡量 ID
   - **GA4 服务账号 JSON**：粘贴 JSON 文件完整内容
3. 统计页展示：总阅读量 / 活跃用户 / 近 7 天阅读量、每日趋势图、热门页面排行

> ✅ 配置成功后统计页应显示真实数据；提示"数据加载失败"时，检查服务账号权限与 Property ID 是否为纯数字（非 `G-` 开头）。

---

## 十二、软件界面主题与设置

### 12.1 六套界面主题

**跟随系统 / 明亮 / 黑夜 / 深海 / 森林 / 日落**

- 顶部工具栏一键轮换
- 设置面板可视化预览与选择
- 配置自动保存、重启后恢复

### 12.2 面板设置汇总

| 设置项 | 说明 |
|-------|------|
| 每页文章数 | 文章列表分页条数 |
| 自动保存间隔 | 编辑器自动保存分钟数 |
| 预览地址模式 | iframe 使用 hexo 标准地址 / 根路径 |
| 编辑模式 | 分屏 / 纯编辑 / 外部编辑器 |
| 背景图 | URL 与透明度 |
| 图片引用基础地址 | 图片库引用前缀 |
| 外部统计 | Giscus / GA4 配置 |
| 部署推送 | 一键发布推送设置 |
| 自定义指令 | clean/generate/server/deploy 覆盖 |
| AI 设置 | 提供商 / 密钥 / 模型 / 提示词 |
| 更新检查 | 自动/手动检查新版本 |

### 12.3 语言切换

支持 **中文 / English** 切换（顶栏语言按钮）。

---

## 十三、更新检查

- **自动检查**：启动时自动检查新版本（可在设置关闭）
- **手动检查**：顶栏更新按钮，查看当前版本与最新版本
- 发现新版本时提示下载（Release 页面）

---

## 十四、常见问题（FAQ）

**Q1：创建项目时报错 "npm 未安装"？**
A：请先安装 Node.js（≥20），确保 `npm` 在 PATH 中，重启 HexoHub 后重试。

**Q2：切换主题后站点白屏？**
A：HexoHub 会自动回滚，无需担心。若手动操作遇到白屏，检查主题是否有 `layout/` 模板目录。

**Q3：为什么某些主题无法切换？**
A：HexoHub 自动识别非 Hexo 主题（Gatsby/Hugo/VitePress 等）并禁用，请安装真正的 Hexo 主题。

**Q4：一键发布提示"请先配置推送信息"？**
A：在「面板设置 → 部署推送」中填写仓库地址、用户名、邮箱，并勾选启用推送。

**Q5：git push 被拒绝（non-fast-forward）？**
A：HexoHub 会自动执行 `git pull --rebase` 后重试；若仍失败，手动解决冲突后重新发布。

**Q6：SSH 推送报错 `Permission denied (publickey)`？**
A：按顺序排查：1) 是否已执行 `ssh-keygen` 生成密钥；2) 公钥（`~/.ssh/id_rsa.pub`）是否已添加到 GitHub（Settings → SSH and GPG keys）；3) 是否已用 `ssh -T git@github.com` 测试连通；4) 是否已运行 `ssh-add ~/.ssh/id_rsa` 加载密钥到 ssh-agent。

**Q7：使用 HTTPS 仓库地址推送时提示需要密码？**
A：GitHub 已不支持账号密码推送。请在 GitHub 生成 Personal Access Token（Settings → Developer settings → Personal access tokens → Generate new token，勾选 `repo`），推送时用户名填 GitHub 用户名、密码填 Token。**推荐改用 SSH 方式。**

**Q8：在线主题库点击"下载安装"失败？**
A：主题库通过 SSH（`git@github.com:owner/repo.git`）克隆安装，请先确认 SSH 已连通 GitHub（`ssh -T git@github.com`），网络可正常访问 GitHub。

**Q9：AI 按钮置灰不可用？**
A：请确认：1) 已勾选「启用 AI」；2) 已填写正确的 API 密钥；3) 顶栏「AI 诊断」仅需密钥，「来点灵感」还需选择有效 Hexo 项目。

**Q10：提示"连接测试失败"？**
A：桌面端测试不受浏览器 CORS 限制；若仍失败，检查端点地址、模型名与密钥是否正确。

**Q11：评论在本地预览无法提交？**
A：Giscus 评论依赖 GitHub Pages 线上环境。本地预览时无法正常加载 Giscus 属正常现象，发布到 GitHub Pages 后即可正常评论。

**Q12：路径包含空格导致命令失败？**
A：建议将项目放在不含空格的路径（如 `D:\blog`）。创建项目时软件会有提示。

**Q13：如何备份配置？**
A：使用「配置面板 → 导出」，保存 `_config.yml` 备份；迁移时使用「导入」。

**Q14：页面内不显示阅读量/评论，如何开启？**
A：HexoHub 统计页的阅读量与评论数通过「面板设置 → 外部统计」配置：阅读量使用 **GA4**（需 Google 账号），评论数使用 **Giscus**（需 GitHub 账号）。若要让**读者在页面底部**看到评论组件，需将 giscus.app 生成的嵌入脚本填入主题配置文件的 `giscus` 配置段（`repo`、`repo_id`、`category`、`category_id`）。

**Q15：统计页的"GA4 阅读量"提示数据加载失败？**
A：按顺序排查：1) Property ID 是否为**纯数字**资源 ID（如 `123456789`，而非 `G-` 开头的衡量 ID）；2) 服务账号 JSON 是否完整粘贴（含 `client_email` 与 `private_key`）；3) 是否已在 Google Analytics「访问管理」中将服务账号邮箱添加为**查看者**；4) 是否已启用 **Google Analytics Data API**。

**Q16：没有 Google 账号，如何配置 GA4 阅读量？**
A：需要先注册 Google 账号（https://accounts.google.com），然后按第十一章 11.3 的 Step 1-4 依次创建 GA4 资源、Google Cloud 服务账号并授权。流程约 10 分钟。

**Q17：Giscus 评论数一直显示 0 或未配置？**
A：确认「面板设置 → 外部统计」已填写 Giscus 仓库与 GitHub Token（需 `repo`/`discussion` 权限），且仓库已启用 **Discussions** 并设为 **Public**；若读者页面的评论功能未生效，请到 giscus.app 生成嵌入脚本并填入主题配置的 `giscus` 段（`repo_id`、`category_id` 等）。

---

## 相关链接

- [Hexo 官网](https://hexo.io/)
- [Hexo 官方主题列表](https://hexo.io/themes/)
- [Node.js 下载](https://nodejs.org/zh-cn/)
- [GitHub](https://github.com)
- [Google 账号](https://accounts.google.com) / [Google Analytics](https://analytics.google.com) / [Google Cloud Console](https://console.cloud.google.com)
- [giscus.app](https://giscus.app)
- [DeepSeek](https://platform.deepseek.com/) / [OpenAI](https://platform.openai.com/) / [硅基流动](https://siliconflow.cn/)
- 更多开发文档：`docs/` 目录（`TAURI_DEVELOPMENT.md`、`THEME_MANAGEMENT.md`、`AI_FEATURES.md`、`RELEASE_GUIDE.md` 等）
