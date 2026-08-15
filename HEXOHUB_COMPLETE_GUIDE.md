# 使用 HexoHub 搭建个人博客：从零到上线完整教程（GitHub Pages + Hexo）

> HexoHub 是一款 Hexo 博客管理桌面应用，提供**图形化界面**替代传统命令行操作。
> 使用 HexoHub，您不需要记忆任何 `hexo xxx` 命令，所有操作都通过鼠标点击完成。
>
> 本教程遵循推荐流程：**先在 GitHub 网页完成全部准备工作，再下载 HexoHub 进行博客管理**。内容完整覆盖：环境准备、GitHub 建仓、软件安装、建站、换主题、写文章、配阅读量与评论、发布上线，以及 AI 辅助、数据统计等进阶功能。

---

## 目录

- 一、HexoHub 简介与特性
- 二、准备工作
- 三、GitHub 网页操作（建仓 / 演示主页 / SSH / Token / Discussions）
- 四、下载并安装 HexoHub
- 五、创建博客项目
- 六、界面总览
- 七、更换主题
- 八、创建与编辑文章
- 九、个性化页面展示与配置管理
- 十、添加阅读量统计（GA4）
- 十一、添加评论功能（Giscus）
- 十二、数据统计
- 十三、发布到 GitHub Pages
- 十四、发布到自己服务器，Nginx 代理
- 十五、AI 功能
- 十六、软件界面主题与设置
- 十七、更新检查
- 十八、常见问题（FAQ）
- 十九、最终效果展示

---

## 一、HexoHub 简介与特性

HexoHub 把 Hexo 博客的常见命令行操作（`hexo init`、`hexo new`、`hexo g`、`hexo d`、`hexo s` 等）全部整合为图形化界面，让您可以**可视化管理整个博客**：创建项目、管理文章、切换主题、配置站点、发布部署，一条龙完成。

| 特性 | 说明 |
|-----|------|
| 小巧 | Tauri 发行版安装包仅约 5.8MB，安装后约 20MB |
| 轻量 | 基于 Next.js + React + TypeScript + Tauri/Electron |
| 快速 | 快速启动、快速响应，无冗余设计 |
| 简洁 | 简洁 UI，专注于博客管理 |
| 智能 | 集成 AI 辅助创作与问题诊断 |
| 主题化 | 六套软件界面主题 + 博客主题在线管理 |

---

## 二、准备工作

### 1. GitHub 账号

需要有一个 GitHub 账号，没有的话到 [GitHub 官网](https://github.com) 申请一个。发布博客到 GitHub Pages、使用 Giscus 评论都离不开它。

### 2. 安装 Git

在自己电脑上安装好 Git，发布博客到 GitHub 时需要用到。网上找篇教程或者参考「Git 安装 (Windows)」。

### 3. 安装 Node.js

在自己电脑上安装好 Node.js（**建议 20 及以上版本**），Hexo 是基于 Node.js 编写的，需要 Node.js 和 npm 工具。安装包下载：https://nodejs.org/zh-cn/

- **npm**：`npm > 10` → https://www.npmjs.com/
- **Node.js**：`nodejs > 20` → https://nodejs.org/zh-cn/

### 4. 可选：Google 账号

若需要统计博客阅读量（GA4），需准备一个 Google 账号，详见[第十节](#十添加阅读量统计ga4)。

---

## 三、GitHub 网页操作

> 在安装 HexoHub 之前，请先在 GitHub 网页完成以下全部操作，后面所有步骤会用到。

### 步骤 1：创建博客仓库（具体操作）

1. 登录 [GitHub](https://github.com)，点击右上角头像，选择 **「Your repositories」**

   ![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/2b166635eb155af4280f7a543e8a0c91.png)

2. 点击 **「New」**（绿色按钮）进入创建仓库页面

   ![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/996b57865fe5f52123cf99174db0811b.png)

3. 填写仓库信息：
   - **Repository name**：`<用户名>.github.io`（**必须**用您的用户名，如 `kivvs.github.io`），这是 GitHub Pages 的固定命名规则
   - **Description**：可选，填写仓库描述
   - **Public / Private**：建议选 **Public**（GitHub Pages 免费托管要求公开仓库）
   - **Initialize this repository with**：可勾选 **Add a README file**，其余可不勾选

4. 点击 **「Create repository」** 完成创建

   ![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/ab8567f9eef0b6250ac609116186d41e.png)

5. 创建成功后页面会显示仓库地址，记录两种格式：
   - **HTTPS**：`https://github.com/kivvs/kivvs.github.io.git`
   - **SSH**：`git@github.com:kivvs/kivvs.github.io.git`

### 步骤 2（可选）：创建一个简单主页验证 GitHub Pages

创建仓库后，可以先创建一个 `index.html` 文件，验证 GitHub Pages 是否生效：

1. 在仓库页面点击 **「Add file」→「Create new file」**（或 **creating a new file**）
2. 新文件的名字**必须为 `index.html`**
3. 内容先随便写一个简单的，示例如下：

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

4. 填写之后点击 **「Commit new file」** 提交
5. 在 GitHub Pages 中找到主页地址 `https://kivvs.github.io/`
6. 浏览器中访问，展示成功

> 💡 这里创建的网页是非常简陋的，只是为了演示 GitHub Pages 的使用方式。之后使用 HexoHub 创建好 Hexo 博客并执行「一键发布」后，`public` 目录中的 `index.html` 会自动覆盖此文件，无需担心。

### 步骤 3（可选但推荐）：SSH 连接 GitHub 仓库

SSH 方式比 HTTPS 更安全，且推送时**无需反复输入用户名密码**。以下是完整配置：

**（1）生成 SSH 密钥**

打开任意终端（PowerShell / CMD / Git Bash），执行：

```bash
ssh-keygen -t rsa -b 4096 -C "你的GitHub邮箱@example.com"
```

- 一路回车即可（默认保存到 `C:\Users\你的用户名\.ssh\id_rsa`）
- 也可设置 passphrase（密钥口令），建议直接回车留空

**（2）将公钥添加到 GitHub（网页操作）**

1. 查看公钥内容：

```bash
type C:\Users\你的用户名\.ssh\id_rsa.pub
```

2. 复制输出的全部内容（以 `ssh-rsa AAAA...` 开头）
3. 登录 GitHub → 右上角头像 → **Settings** → 左侧 **SSH and GPG keys**
4. 点击 **「New SSH key」**
5. **Title** 填写任意名称（如 `my-pc`），**Key** 粘贴刚才复制的公钥
6. 点击 **「Add SSH key」** 完成添加

**（3）测试 SSH 连接**

```bash
ssh -T git@github.com
```

首次连接会提示确认指纹，输入 `yes` 回车。看到以下输出即表示连接成功：

```
Hi kivvs! You've successfully authenticated, but GitHub does not provide shell access.
```

> ⚠️ **SSH 方式的额外前提**：Hexo 的部署插件（hexo-deployer-git）在执行 `git push` 时会通过 SSH 连接 GitHub，**必须在项目首次部署前确认 SSH 已连通**（即上一步测试成功）。若使用 Git for Windows，其自带的 OpenSSH 会读取 `~/.ssh` 下的密钥，无需额外配置。
>
> 常见问题：`Permission denied (publickey)` → 公钥未正确添加，或 ssh-agent 未加载密钥（`ssh-add ~/.ssh/id_rsa`）。

### 步骤 4：获取 GitHub Token（后续 Giscus 评论需要）

1. 登录 GitHub → 右上角头像 → **Settings** → 左侧最下方 **Developer settings**
2. 选择 **Personal access tokens** → **Tokens (classic)** → **Generate new token**
3. 填写 Note（如 `hexohub`），勾选权限：**`repo`** 与 **`discussion`**（Giscus 评论统计需要）
4. 点击 **Generate token**，复制生成的 `ghp_xxx...` 并妥善保存（只显示一次）

> **HTTPS 私有仓库推送说明**：若使用 HTTPS 地址且仓库为私有，GitHub 已不再支持密码推送，同样需使用此 Token 作为密码（推送时用户名填 GitHub 用户名、密码填 Token）。**推荐直接使用 SSH 方式，免去该麻烦。**

### 步骤 5：启用 Discussions（Giscus 评论需要）

1. 进入您的仓库页面（如 `kivvs/kivvs.github.io`），点击 **「Settings」**
2. 左侧找到 **「General」→「Features」**，勾选 **「Discussions」** 启用 Discussions 功能（Giscus 的底层是 GitHub Discussions）
3. 返回仓库主页，确认出现 **「Discussions」** 标签页；若无分类，可在该页手动创建分类（如 `Announcements`）

> ⚠️ 您的仓库必须是 **Public（公开）**，Giscus 才能正常工作。

### 步骤 6：在 giscus.app 生成评论配置

1. 打开 [giscus.app](https://giscus.app)，在「仓库」输入您的仓库名（如 `kivvs/kivvs.github.io`），点击「连接」
2. 按提示完成 **GitHub App（giscus）授权**
3. 选择 **Discussion 分类**（如 `Announcements`）
4. 页面会生成一段嵌入脚本，其中包含 `data-repo`、`data-repo-id`、`data-category`、`data-category-id`，请记录下来（第十一节配置时会用到）

---

## 四、下载并安装 HexoHub

1. 前往 [Releases](https://github.com/kivvs/HexoHub-private/releases/) 下载最新版本安装包
2. 推荐选择 **Tauri** 发行版（`HexoHub-Tauri-Windows-x.x.x.exe`，安装包仅约 5.8MB）
3. 运行安装包，按提示完成安装
4. 安装完成后，从桌面快捷方式或开始菜单启动 HexoHub

> ⚠️ 若杀毒软件误报，请将 HexoHub 加入信任列表（开源项目常见现象）。

**系统要求**：Windows 10 或更高版本；存储建议 200MB 可用空间；已安装 Hexo / npm / Node.js（见第二节）。

---

## 五、创建博客项目

### 步骤 1：打开「创建 Hexo 项目」向导

启动 HexoHub 后，在左侧栏点击 **「创建项目」**（或「新建 Hexo 项目」）按钮，打开创建向导。

### 步骤 2：填写项目信息

1. **选择存储路径**：点击「选择目录」，挑选一个不含空格的路径（例如 `D:\blog`），HexoHub 会提示路径是否含空格
2. **文件夹名称**：默认 `blog`，可自定义，如 `hexo-blog`
3. **使用淘宝镜像源**：勾选后自动执行 `npm config set registry https://registry.npmmirror.com`，国内下载依赖更快
4. **安装部署插件**：勾选后自动安装 `hexo-deployer-git`（发布到 GitHub Pages 必需）

### 步骤 3：环境自动检测

点击创建后，HexoHub 会依次检测：

- ✅ npm 是否安装（显示版本号）
- ✅ Git 是否安装（显示版本号）
- ✅ hexo-cli 是否安装（显示版本号）

如果缺少某项，HexoHub 会提示您先安装。

### 步骤 4：一键创建

点击 **「创建项目」**，HexoHub 自动完成以下全部步骤：

| 自动步骤 | 说明 |
|---------|------|
| 设置镜像源 | `npm config set registry ...`（可选） |
| 安装 Hexo CLI | `npm install -g hexo-cli`（未安装时） |
| 初始化项目 | `hexo init` |
| 安装依赖 | `npm install` |
| 安装部署插件 | `npm install hexo-deployer-git --save`（可选） |

过程中有**实时进度条和命令输出窗口**，方便您观察每一步的执行结果。创建成功后，点击「打开项目」，即可进入博客管理主界面。

> 💡 Hexo 项目本身自带完整的博客主页，不需要额外创建 `index.html`。

### 打开已有项目

如果您已有 Hexo 项目，也可以在左侧栏选择 **「打开项目」**，定位到包含 `_config.yml` 的目录，软件自动校验并加载：

- 是否存在 `_config.yml`
- 是否为有效的 Hexo 项目结构（`source/`、`scaffolds/`、`themes/`、`node_modules/`）

验证失败时会在界面给出明确提示。

---

## 六、界面总览

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

## 七、更换主题

### 方式 A：使用软件内置的在线主题库（推荐）

1. 在主界面切换到 **「博客主题」** 标签页
2. 点击 **「在线主题库」** 子标签
3. 内置 hexo.io 官方目录（**440+ 主题**），含名称 / GitHub 链接 / 简介 / 标签，可**搜索主题名**（如 `fluid`、`next`）
4. 找到目标主题后，点击 **「下载安装」**（通过 SSH 一键下载到 `themes/` 目录），并自动处理依赖
5. 支持**已安装状态标记**，已装主题一目了然

> 在线主题库使用 SSH（`git@github.com:owner/repo.git`）克隆安装，前提是 SSH 已连通 GitHub（见第三节步骤 3）。加载采用三层加速：30 天长期缓存 → 打包静态目录（秒开、离线可用）→ 在线刷新。

### 方式 B：使用本地已安装的主题

1. 在 **「博客主题」→「已安装主题」** 标签页，HexoHub 自动扫描 `themes/` 目录与 `node_modules/hexo-theme-*`
2. 卡片式展示主题的**名称 / 版本 / 来源**，并标识是否为有效的 Hexo 主题
3. 非 Hexo 主题（Gatsby / Hugo / VitePress）自动识别并**禁用切换**
4. 点击目标主题卡片上的 **「切换」** 按钮

### 一键切换与智能验证回滚（HexoHub 特色）

- 点击切换后，HexoHub 自动修改 `_config.yml` 的 `theme:` 字段
- 自动执行 `hexo clean + hexo generate` **验证**生成是否成功
- 若生成失败（缺少 layout 模板、0 文件等），**自动回滚到原主题**并重新生成，**任何主题都不会再白屏**
- 自动识别 Gatsby / Hugo / VitePress 等**非 Hexo 主题**，直接禁用切换按钮，从源头避免错误

### 手动指定主题（了解原理）

若您已手动把主题文件夹放到了 `themes/` 目录，在主题面板点「刷新」即可识别；软件修改的正是项目根目录 `_config.yml` 中的：

```yaml
theme: fluid   # 指定主题
language: zh-CN # 指定语言，会影响主题显示的语言，按需修改
```

### 创建「关于页」（Fluid 主题需要）

1. 在 HexoHub 中新建文章时，**选择模板 `page`**（生成 `source/about/index.md`）
2. 创建完成后，编辑 `source/about/index.md`，在 front-matter 中添加：

```markdown
---
title: about
date: 2020-02-23 19:20:33
layout: about
---

这里写关于页的正文，支持 Markdown, HTML
```

### 启动本地预览

切换主题后，在主界面点击 **「启动服务器」**，浏览器访问 `http://localhost:4000` 即可看到新主题效果。

---

## 八、创建与编辑文章

### 步骤 1：新建文章

1. 点击 **「新建文章」** 按钮
2. 填写：
   - **文章标题**（如「测试文章」）
   - **标签**（可输入新标签，或从下拉列表选择已有标签）
   - **分类**
   - **摘要**（可选）
   - **模板**：默认 `post`；如需关于页可选 `page`（自动读取 `scaffolds/` 目录）
3. 点击 **「创建」**，文章即出现在文章列表中

### 步骤 2：编辑文章

1. 在文章列表点击文章，右侧进入 **Markdown 编辑器**
2. 内置工具栏支持：标题、加粗、斜体、引用、列表、链接、图片、表格、代码、**字体颜色**等
3. **实时预览**：左侧编辑、右侧渲染，支持 GFM 表格、HTML 标签（`<font style>`、`<span>`、`<br>`）等
4. **自动保存**：默认每 3 分钟自动保存（可在面板设置中调整间隔），也可用工具栏「保存」按钮手动保存

![image-20260815134721398](../AppData/Roaming/Typora/typora-user-images/image-20260815134721398.png)

### 步骤 3：插入图片（直接 URL 路径方式）

本教程采用**直接路径引用图片**的方式（形如 `https://你的博客地址/images/xxx.png`），不使用 `{% asset_img %}` 标签。

**方式一：图片库管理（推荐）**

1. 打开 **「图片」** 标签页，可统一管理 `source/images` 图片库
2. 支持**网格/列表**视图、按文章标签筛选、重命名、删除
3. 点击 **「插入引用」**，自动在编辑器中填入直接 URL 格式：

```
![](https://kivvs.github.io/images/test.png)
```

> 💡 **关于图片引用基础地址**：在 **「面板设置」→「博客设置」** 中可配置 **「图片引用基础地址」**（请改为您自己的博客域名），图片库插入引用时自动拼接为 `基础地址 + 图片名`，即 `![](https://你的域名/images/图片名.png)`。

**方式二：手动填写 URL**

在 Markdown 编辑器中直接输入：

```
![示例图片](https://kivvs.github.io/images/test.png)
```

**图片提取（特色功能）**：一键提取文章中引用的外部网络图片，自动下载到 `source/images`、按 `文章名-序号.扩展名` 重命名，并将正文引用替换为 `images/xxx.png` 直接路径。

### 步骤 4：预览与验证

- **静态预览**：编辑器右侧实时渲染（GFM 表格、HTML 标签）
- **服务器预览**：点击 **「启动服务器」**，浏览器访问 `http://localhost:4000`；也可在编辑器中通过 iframe 展示真实站点效果（地址模式可切换 hexo 标准地址 / 根路径）

### 步骤 5：文章管理

- **文章列表**：展示标题、修改时间、front-matter 日期，支持标签/分类筛选、分页
- **删除文章**：选择文章 → 删除 → 确认弹窗，删除前请确认已备份

---

## 九、个性化页面展示与配置管理

### 1. 浏览器 Tab 页名称

主界面切换到 **「配置」** 标签页（站点配置），修改 **「网站标题」** 字段（对应根目录 `_config.yml` 的 `title`）。

### 2. 博客标题

在主题的配置文件管理中，编辑 `themes/fluid/_config.yml` 中的 `blog_title` 字段。

> 💡 HexoHub 支持 **「主题配置文件」** 管理：对 fluid 等主题的 `_config.<主题名>.yml` 独立配置进行表单化编辑。

### 3. 主页正中间的文字

同样在 `themes/fluid/_config.yml` 中修改 `text` 字段。

修改后点击 **「保存」**，刷新本地预览即可看到效果。

### 4. 配置管理总览

| 配置项 | HexoHub 操作位置 |
|-------|-----------------|
| 网站标题（Tab 页名称） | 配置面板 → 站点设置 → 网站标题 |
| 副标题 / 描述 / 作者 / 语言 / 时区 | 配置面板 → 站点设置（对应 `subtitle` / `description` / `author` / `language` / `timezone`） |
| 博客标题 | 配置面板 → 主题配置文件 → fluid → blog_title |
| 主页正中间文字 | 配置面板 → 主题配置文件 → fluid → text |
| URL / 根路径 / 永久链接 | 配置面板 → 高级设置（`url` / `root` / `permalink`） |
| 任意原始 YAML | 配置面板 → **YAML 编辑器**（直接编辑原始文件） |
| 配置文件备份/迁移 | 配置面板 → **导入 / 导出** `_config.yml` |
| 主题独立配置 | 配置面板 → 主题配置文件（`_config.<主题名>.yml`） |

---

## 十、添加阅读量统计（GA4）

HexoHub 使用 **Google Analytics 4（GA4）** 统计博客阅读量。只需一个 Google 账号，按以下三步配置。

### 第一步：创建 GA4 资源（Google Analytics）

1. 使用 [Google 账号](https://accounts.google.com) 登录 [Google Analytics](https://analytics.google.com)
2. 点击左下角 **「管理」→「创建」→「创建资源」**，填写资源名称（如「我的博客」）
3. 设置**报告时区**与**货币**后点击「创建资源」
4. 创建数据流：选择 **「Web」** → 填写**网站网址**（如 `https://kivvs.github.io`）与**数据流名称**
5. 创建完成后，记下两个关键 ID（**它们不同，不要混淆**）：
   - **Property ID（资源 ID）**：在 **「管理 → 资源和数据管理 → 数据流」** 页面点击数据流，可看到资源 ID，为**纯数字**（如 `123456789`），即 **HexoHub 中要填的 "GA4 Property ID"**
   - **衡量 ID（Measurement ID）**：格式为 `G-XXXXXXXXXX`，用于 gtag.js 跟踪代码，**不是** Property ID
6. 将 GA4 提供的跟踪代码（`gtag.js` 脚本）添加到您的 Hexo 主题模板中（通常在 `head` 或 `footer` 中），即可开始统计网站访问数据

### 第二步：创建 Google Cloud 服务账号（用于 HexoHub 读取数据）

1. 打开 [Google Cloud Console](https://console.cloud.google.com)，用同一 Google 账号登录
2. **创建项目**（或选择已有项目）
3. 进入 **「API 和服务」→「库」**，搜索并启用 **「Google Analytics Data API」**
4. 进入 **「API 和服务」→「凭据」→「创建凭据」→「服务账号」**：
   - 填写服务账号名称（如 `hexohub-analytics`）
   - 角色可选「查看者（Viewer）」，点击「完成」
5. 在服务账号列表中，点击该账号 → **「密钥」→「添加密钥」→「创建新密钥」**，选择 **JSON** 格式，下载得到一个 **服务账号 JSON 文件**
6. 回到 [Google Analytics](https://analytics.google.com)，**「管理 → 资源和数据管理 → 访问管理」**，点击右上角 **+**，将上一步的**服务账号邮箱**（JSON 中的 `client_email`，格式如 `hexohub-analytics@xxxx.iam.gserviceaccount.com`）添加为**查看者（Viewer）**权限——否则 HexoHub 无权读取数据

### 第三步：在 HexoHub 中填入配置

1. 打开 **「面板设置」→「外部统计」**
2. 填写：
   - **GA4 Property ID**：纯数字资源 ID（如 `123456789`），**不是** `G-` 开头的衡量 ID
   - **GA4 服务账号 JSON**：粘贴上一步下载的 JSON 文件完整内容
3. 保存后，在 **「统计」→「外部统计」→「GA4 阅读量」** 页面查看：
   - 总阅读量 / 活跃用户 / 近 7 天阅读量
   - 每日阅读趋势图表
   - 热门页面排行（每篇文章的阅读量）

> ✅ **完成标准**：在统计页能看到 GA4 阅读量数据，即表示配置成功；若提示「数据加载失败」，请检查服务账号权限与 Property ID 是否正确（纯数字，非 `G-` 开头）。

---

## 十一、添加评论功能（Giscus）

[第三节](#三github-网页操作)中已完成 GitHub 侧的准备工作（启用 Discussions、giscus.app 生成配置、获取 Token），本节只需在 HexoHub 中完成配置。

### 步骤 1：在 HexoHub 中配置

1. 打开 **「面板设置」→「外部统计」**
2. 填写 **Giscus** 配置：
   - `Giscus GitHub 仓库`：如 `kivvs/kivvs.github.io`
   - `Giscus Discussion 分类`：如 `Announcements`
   - `GitHub Token`：第三节步骤 4 获取的 `ghp_xxx`
3. 在 **「统计」→「外部统计」→「Giscus 评论」** 页面查看：
   - 评论总数 / 讨论数 / 反应数
   - 互动趋势图表
   - 高互动讨论排行

### 步骤 2：让读者在页面底部发表评论

若您使用支持 Giscus 的主题，可将第三节步骤 6 中 giscus.app 生成的嵌入脚本配置填入主题配置文件中对应的 `giscus` 配置段（`repo`、`repo_id`、`category`、`category_id`），这样**读者也能在页面底部发表评论**。

> 提示：Giscus 评论依赖 GitHub Pages 线上环境。本地预览时无法正常加载 Giscus 属正常现象，发布到 GitHub Pages 后即可正常评论。

---

## 十二、数据统计

### 12.1 标签云

文章标签聚合展示，点击标签可筛选文章列表。

### 12.2 发布统计

按月份展示文章发布数量的图表。

### 12.3 外部统计（Giscus / GA4）

配置方法见[第十节](#十添加阅读量统计ga4)与[第十一节](#十一添加评论功能giscus)。配置完成后，在「统计 → 外部统计」页面集中查看：

- **Giscus 评论图表页**：评论总数 / 讨论数 / 反应数、互动趋势图、高互动讨论排行
- **GA4 阅读量图表页**：总阅读量 / 活跃用户 / 近 7 天阅读量、每日趋势图、热门页面排行

### 阅读量 + 评论配置速查表

| 能力 | 数据源 | 需要账号 | HexoHub 配置位置 |
|-----|-------|---------|-----------------|
| 阅读量统计（统计页） | GA4 | **Google** | 面板设置 → 外部统计 |
| 评论数统计（统计页） | Giscus | GitHub | 面板设置 → 外部统计 |
| 评论功能（页面内） | Giscus | GitHub | 主题配置文件 `giscus` 配置段 |

---

## 十三、发布到 GitHub Pages

### 步骤 1：在 HexoHub 中填写部署配置

1. 打开 **「面板设置」→「部署 / 发布设置」**
2. 填写：

| 配置项 | 说明 |
|-------|------|
| **部署仓库地址** | HTTPS 或 SSH 地址，如 `https://github.com/kivvs/kivvs.github.io.git` 或 `git@github.com:kivvs/kivvs.github.io.git` |
| **GitHub 用户名** | 如 `kivvs`（用于 git 提交身份） |
| **GitHub 邮箱** | 如 `xxx@qq.com` |
| **分支** | 默认 `main` |
| **推送开关** | 勾选「启用推送」，一键发布时自动把源码推送到仓库 |

> HexoHub 的部署插件会自动处理 `hexo-deployer-git` 的安装与 `_config.yml` 中 `deploy` 段的写入（type: git / repo / branch）。
>
> **HTTPS 仓库地址的鉴权说明**：若使用 HTTPS 地址且仓库为私有，GitHub 已不再支持密码推送，需使用第三节步骤 4 获取的 **Personal Access Token（PAT）** 作为密码。首次推送被要求输入账号密码时，用户名填 GitHub 用户名，密码填 Token。**推荐直接使用第三节的 SSH 方式，免去该麻烦。**

### 步骤 2：一键发布

在 HexoHub 主界面点击 **「一键发布」** 按钮，软件自动顺序执行：

1. **清理**（`hexo clean`）
2. **生成**（`hexo generate`）
3. **部署**（`hexo deploy`，通过 hexo-deployer-git 推送到 GitHub Pages）
4. **推送源码**（如启用推送，把项目源码推送到仓库）

每个步骤都有**实时输出与成功/失败状态**；若推送因远程有新提交被拒绝，HexoHub 会自动 `git pull --rebase` 后重试一次。

### 常用命令按钮（单步执行）

主界面提供四个独立按钮，可单步执行，所有命令均有实时输出（stdout / stderr）与成功/失败状态：

| 按钮 | 对应命令 | 用途 |
|-----|---------|------|
| 清理 | `hexo clean` | 清理缓存文件 |
| 生成 | `hexo generate` | 生成静态文件到 `public/` |
| 部署 | `hexo deploy` | 部署到远程服务器 |
| 启动服务器 | `hexo server` | 本地预览（`http://localhost:4000`） |

> 💡 **自定义指令**：在「面板设置 → 自定义指令」中可自定义 clean/generate/server/deploy 的完整命令，适配特殊环境。
>
> 💡 **命令日志**：所有命令执行结果都会记录，可在日志对话框中查看历史（含成功/失败状态），也可作为 AI 诊断的上下文。

发布完成后，浏览器访问 `https://kivvs.github.io/`，部署成功！🎉

---

## 十四、发布到自己服务器，Nginx 代理

如果自己有服务器，也可以不使用 GitHub Pages，直接部署到自己的服务器，通过 Nginx 进行代理。

### 步骤 1：设置根路径

在 **「配置」→「高级设置」** 中，将 **`root`** 设为 `/blog`（网站存放在子目录，需与 Nginx 的 `location /blog` 路径一致）。

### 步骤 2：生成静态文件

在主界面点击 **「生成」** 按钮，打包好的文件生成在项目的 `public` 目录。

### 步骤 3：上传到服务器

使用您习惯的 SFTP/SCP 工具，将 `public` 目录下的文件上传到 Linux 服务器的某个目录（如 `/opt/rkyao/fronted/hexo-blog`）。

### 步骤 4：配置 Nginx

```nginx
# server 节点下添加如下配置
location /blog {
    alias  /opt/rkyao/fronted/hexo-blog;
    index  index.html index.htm;
}
```

### 步骤 5：重启 Nginx

```bash
cd /usr/local/nginx/sbin
./nginx -s reload
```

访问 `http://服务器IP/blog/` 即可看到博客。

---

## 十五、AI 功能

### 15.1 启用 AI

1. **面板设置 → AI 设置**
2. 勾选「启用 AI」
3. 选择提供商：**DeepSeek / OpenAI / 硅基流动**
4. 填写 API 密钥，可「测试连接」
5. 按需配置模型、端点、提示词（所有提示词均可自定义）

> 支持 OpenAI 兼容中转站：在面板设置中填写中转站端点（如 `https://your-proxy.com/v1`）与请求路径（默认 `/chat/completions`），并配置对应模型名即可。

### 15.2 功能一览

| 功能 | 入口 | 说明 |
|-----|------|------|
| **AI 灵感** | 顶栏「来点灵感」 | 基于博客主题与偏好生成写作灵感 |
| **AI 分析** | 统计页「开始分析」 | 分析标签与发布数据，给出鼓励性反馈 |
| **AI 重写 / 改进 / 扩展 / 翻译** | 编辑器右键菜单（需开启"编辑器 AI 增强"） | 对选中文字进行 AI 润色 |
| **AI 深度模仿** | 编辑器右键菜单 → AI 工具 | 参考选定文章风格模仿创作 |
| **AI 辅助诊断** | 顶栏「AI 诊断」 | 自动分析软件/博客问题并给出分步解决方案 |

### 15.3 AI 辅助诊断

1. 点击顶栏 **「AI 诊断」**
2. 描述遇到的问题（如主题切换白屏、部署失败、图片提取失败等）
3. 点击「开始诊断」

AI 自动携带诊断上下文：**软件/系统环境**（版本、架构、系统、Node/Hexo 版本）+ **项目上下文**（当前项目路径、最近 10 条操作日志）。

输出：**问题原因分析（分点）+ 可操作的解决步骤**。

### 15.4 隐私说明

- AI 请求直接发送至您配置的服务商 API，无第三方中转
- 诊断仅发送环境信息与最近 10 条操作日志摘要（不含文章正文）
- API 密钥仅保存在本地（localStorage）

---

## 十六、软件界面主题与设置

### 16.1 六套界面主题

**跟随系统 / 明亮 / 黑夜 / 深海 / 森林 / 日落**

- 顶部工具栏一键轮换
- 设置面板可视化预览与选择
- 配置自动保存、重启后恢复

### 16.2 面板设置汇总

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

![image-20260815134811565](../AppData/Roaming/Typora/typora-user-images/image-20260815134811565.png)

### 16.3 语言切换

支持 **中文 / English** 切换（顶栏语言按钮）。

---

## 十七、更新检查

- **自动检查**：启动时自动检查新版本（可在设置关闭）
- **手动检查**：顶栏更新按钮，查看当前版本与最新版本
- 发现新版本时提示下载（Release 页面）

---

## 十八、常见问题（FAQ）

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
A：需要先注册 Google 账号（https://accounts.google.com），然后按第十节的 Step 1-3 依次创建 GA4 资源、Google Cloud 服务账号并授权。流程约 10 分钟。

**Q17：Giscus 评论数一直显示 0 或未配置？**
A：确认「面板设置 → 外部统计」已填写 Giscus 仓库与 GitHub Token（需 `repo`/`discussion` 权限），且仓库已启用 **Discussions** 并设为 **Public**；若读者页面的评论功能未生效，请到 giscus.app 生成嵌入脚本并填入主题配置的 `giscus` 段（`repo_id`、`category_id` 等）。

---

## 十九、最终效果展示

按照本教程操作后，您的博客将具备：

- ✅ 个性化主题（Fluid / NexT 等 440+ 官方主题可选）
- ✅ 文章管理（创建、编辑、标签、分类、实时预览）
- ✅ 图片资源管理（图片库、外部图片提取，直接 URL 引用）
- ✅ 阅读量统计（GA4，含每日趋势与热门文章排行）
- ✅ 评论功能（Giscus，基于 GitHub Discussions）
- ✅ AI 辅助创作与问题诊断
- ✅ GitHub Pages 一键发布

---

## 相关链接

- [Hexo 官网](https://hexo.io/) / [Hexo 官方主题列表](https://hexo.io/themes/)
- [Node.js 下载](https://nodejs.org/zh-cn/) / [npm](https://www.npmjs.com/) / [GitHub](https://github.com)
- [Google 账号](https://accounts.google.com) / [Google Analytics](https://analytics.google.com) / [Google Cloud Console](https://console.cloud.google.com)
- [giscus.app](https://giscus.app)
- [DeepSeek](https://platform.deepseek.com/) / [OpenAI](https://platform.openai.com/) / [硅基流动](https://siliconflow.cn/)
- HexoHub 开发文档：`docs/` 目录（`THEME_MANAGEMENT.md`、`AI_FEATURES.md`、`RELEASE_GUIDE.md`、`TAURI_DEVELOPMENT.md` 等）
