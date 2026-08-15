# HexoHub 使用教程：GitHub Pages + Hexo 搭建个人博客

> HexoHub 是一款 Hexo 博客管理桌面应用，提供**图形化界面**替代传统命令行操作。
> 使用 HexoHub，您不需要记忆任何 `hexo xxx` 命令，所有操作都通过鼠标点击完成。
>
> 本教程遵循推荐流程：**先在 GitHub 网页完成全部准备工作，再下载 HexoHub 进行博客管理**。

---

## 目录

- 一、准备工作
- 二、GitHub 网页操作（建仓 / 演示主页 / SSH / Token / Discussions）
- 三、下载并安装 HexoHub
- 四、创建博客项目
- 五、更换主题
- 六、创建文章
- 七、个性化页面展示
- 八、添加阅读量统计（GA4）
- 九、添加评论功能（Giscus）
- 十、发布到 GitHub Pages
- 十一、发布到自己服务器，Nginx 代理
- 十二、最终效果展示

---

## 一、准备工作

### 1. GitHub 账号

需要有一个 GitHub 账号，没有的话到 [GitHub 官网](https://github.com) 申请一个。发布博客到 GitHub Pages、使用 Giscus 评论都离不开它。

### 2. 安装 Git

在自己电脑上安装好 Git，发布博客到 GitHub 时需要用到。网上找篇教程或者参考「Git 安装 (Windows)」。

### 3. 安装 Node.js

在自己电脑上安装好 Node.js（**建议 20 及以上版本**），Hexo 是基于 Node.js 编写的，需要 Node.js 和 npm 工具。安装包下载：https://nodejs.org/zh-cn/

### 4. 可选：Google 账号

若需要统计博客阅读量（GA4），需准备一个 Google 账号，详见[第八节](#八添加阅读量统计ga4)。

---

## 二、GitHub 网页操作

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

### 步骤 4：获取 GitHub Token（后续 Giscus 评论需要）

1. 登录 GitHub → 右上角头像 → **Settings** → 左侧最下方 **Developer settings**
2. 选择 **Personal access tokens** → **Tokens (classic)** → **Generate new token**
3. 填写 Note（如 `hexohub`），勾选权限：**`repo`** 与 **`discussion`**（Giscus 评论统计需要）
4. 点击 **Generate token**，复制生成的 `ghp_xxx...` 并妥善保存（只显示一次）

### 步骤 5：启用 Discussions（Giscus 评论需要）

1. 进入您的仓库页面（如 `kivvs/kivvs.github.io`），点击 **「Settings」**
2. 左侧找到 **「General」→「Features」**，勾选 **「Discussions」** 启用 Discussions 功能（Giscus 的底层是 GitHub Discussions）
3. 返回仓库主页，确认出现 **「Discussions」** 标签页；若无分类，可在该页手动创建分类（如 `Announcements`）

> ⚠️ 您的仓库必须是 **Public（公开）**，Giscus 才能正常工作。

### 步骤 6：在 giscus.app 生成评论配置

1. 打开 [giscus.app](https://giscus.app)，在「仓库」输入您的仓库名（如 `kivvs/kivvs.github.io`），点击「连接」
2. 按提示完成 **GitHub App（giscus）授权**
3. 选择 **Discussion 分类**（如 `Announcements`）
4. 页面会生成一段嵌入脚本，其中包含 `data-repo`、`data-repo-id`、`data-category`、`data-category-id`，请记录下来（第九节配置时会用到）

---

## 三、下载并安装 HexoHub

1. 前往 [Releases](https://github.com/kivvs/HexoHub-private/releases/) 下载最新版本安装包
2. 推荐选择 **Tauri** 发行版（`HexoHub-Tauri-Windows-x.x.x.exe`，安装包仅约 5.8MB）
3. 运行安装包，按提示完成安装
4. 安装完成后，从桌面快捷方式或开始菜单启动 HexoHub

---

## 四、创建博客项目

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

---

## 五、更换主题

### 方式 A：使用软件内置的在线主题库（推荐）

1. 在主界面切换到 **「博客主题」** 标签页
2. 点击 **「在线主题库」** 子标签
3. 内置 hexo.io 官方目录（440+ 主题），可**搜索主题名**（如 `fluid`、`next`）
4. 找到目标主题后，点击 **「下载安装」**（通过 SSH 一键下载到 `themes/` 目录），并自动处理依赖

### 方式 B：使用本地已安装的主题

1. 在 **「博客主题」→「已安装主题」** 标签页，HexoHub 自动扫描 `themes/` 目录与 `node_modules/hexo-theme-*`
2. 卡片式展示主题的**名称 / 版本 / 来源**，并标识是否为有效的 Hexo 主题
3. 点击目标主题卡片上的 **「切换」** 按钮

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

## 六、创建文章

### 步骤 1：新建文章

1. 点击 **「新建文章」** 按钮
2. 填写：
   - **文章标题**（如「测试文章」）
   - **标签**（可输入新标签，或从下拉列表选择已有标签）
   - **分类**
   - **摘要**（可选）
   - **模板**：默认 `post`；如需关于页可选 `page`
3. 点击 **「创建」**，文章即出现在文章列表中

### 步骤 2：编辑文章

1. 在文章列表点击文章，右侧进入 **Markdown 编辑器**
2. 内置工具栏支持：标题、加粗、斜体、引用、列表、链接、图片、表格、代码、**字体颜色**等
3. **实时预览**：左侧编辑、右侧渲染，支持 GFM 表格、HTML 标签（`<font style>`、`<span>`、`<br>`）等
4. **自动保存**：默认每 3 分钟自动保存（可在面板设置中调整间隔）

### 步骤 3：插入图片（直接 URL 路径方式）

本教程采用**直接路径引用图片**的方式（形如 `https://你的博客地址/images/xxx.png`），不使用 `{% asset_img %}` 标签。

**方式一：图片库管理（推荐）**

1. 打开 **「图片」** 标签页，可统一管理 `source/images` 图片库
2. 支持**网格/列表**视图、按文章标签筛选、重命名、删除
3. 点击 **「插入引用」**，自动在编辑器中填入直接 URL 格式：

```
![](https://kivvs.github.io/images/test.png)
```

> 💡 **关于图片引用基础地址**：在 **「面板设置」→「博客设置」** 中可配置 **「图片引用基础地址」**（默认 `https://kivvs.github.io/images/`，请改为您自己的博客域名），图片库插入引用时自动拼接为 `基础地址 + 图片名`，即 `![](https://你的域名/images/图片名.png)`。

**方式二：手动填写 URL**

在 Markdown 编辑器中直接输入：

```
![示例图片](https://kivvs.github.io/images/test.png)
```

**图片提取（特色功能）**：一键提取文章中引用的外部网络图片，自动下载到 `source/images`、按 `文章名-序号.扩展名` 重命名，并将正文引用替换为 `images/xxx.png` 直接路径。

### 步骤 4：预览与验证

- **静态预览**：编辑器右侧实时渲染
- **本地服务器预览**：点击 **「启动服务器」**，浏览器访问 `http://localhost:4000`

---

## 七、个性化页面展示

### 1. 浏览器 Tab 页名称

主界面切换到 **「配置」** 标签页（站点配置），修改 **「网站标题」** 字段（对应根目录 `_config.yml` 的 `title`）。

### 2. 博客标题

在主题的配置文件管理中，编辑 `themes/fluid/_config.yml` 中的 `blog_title` 字段。

> 💡 HexoHub 支持 **「主题配置文件」** 管理：对 fluid 等主题的 `_config.<主题名>.yml` 独立配置进行表单化编辑。

### 3. 主页正中间的文字

同样在 `themes/fluid/_config.yml` 中修改 `text` 字段。

修改后点击 **「保存」**，刷新本地预览即可看到效果。

| 配置项 | HexoHub 操作位置 |
|-------|-----------------|
| 网站标题（Tab 页名称） | 配置面板 → 站点设置 → 网站标题 |
| 博客标题 | 配置面板 → 主题配置文件 → fluid → blog_title |
| 主页正中间文字 | 配置面板 → 主题配置文件 → fluid → text |
| URL / 根路径 / 永久链接 | 配置面板 → 高级设置 |
| 任意原始 YAML | 配置面板 → **YAML 编辑器**（直接编辑原始文件） |
| 配置文件备份/迁移 | 配置面板 → **导入 / 导出** `_config.yml` |

---

## 八、添加阅读量统计（GA4）

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

## 九、添加评论功能（Giscus）

[第二节](#二github-网页操作)中已完成 GitHub 侧的准备工作（启用 Discussions、giscus.app 生成配置、获取 Token），本节只需在 HexoHub 中完成配置。

### 步骤 1：在 HexoHub 中配置

1. 打开 **「面板设置」→「外部统计」**
2. 填写 **Giscus** 配置：
   - `Giscus GitHub 仓库`：如 `kivvs/kivvs.github.io`
   - `Giscus Discussion 分类`：如 `Announcements`
   - `GitHub Token`：第二节步骤 4 获取的 `ghp_xxx`
3. 在 **「统计」→「外部统计」→「Giscus 评论」** 页面查看：
   - 评论总数 / 讨论数 / 反应数
   - 互动趋势图表
   - 高互动讨论排行

### 步骤 2：让读者在页面底部发表评论

若您使用支持 Giscus 的主题，可将第二节步骤 6 中 giscus.app 生成的嵌入脚本配置填入主题配置文件中对应的 `giscus` 配置段（`repo`、`repo_id`、`category`、`category_id`），这样**读者也能在页面底部发表评论**。

### 阅读量 + 评论配置速查表

| 能力 | 数据源 | 需要账号 | HexoHub 配置位置 |
|-----|-------|---------|-----------------|
| 阅读量统计（统计页） | GA4 | **Google** | 面板设置 → 外部统计 |
| 评论数统计（统计页） | Giscus | GitHub | 面板设置 → 外部统计 |
| 评论功能（页面内） | Giscus | GitHub | 主题配置文件 `giscus` 配置段 |

---

## 十、发布到 GitHub Pages

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
> **HTTPS 仓库地址的鉴权说明**：若使用 HTTPS 地址且仓库为私有，GitHub 已不再支持密码推送，需使用 **Personal Access Token（PAT）** 作为密码。获取方式见[第二节步骤 4](#步骤-4获取-github-token后续-giscus-评论需要)。首次推送被要求输入账号密码时，用户名填 GitHub 用户名，密码填 Token。**推荐直接使用第二节的 SSH 方式，免去该麻烦。**

### 步骤 2：一键发布

在 HexoHub 主界面点击 **「一键发布」** 按钮，软件自动顺序执行：

1. **清理**（`hexo clean`）
2. **生成**（`hexo generate`）
3. **部署**（`hexo deploy`，通过 hexo-deployer-git 推送到 GitHub Pages）
4. **推送源码**（如启用推送，把项目源码推送到仓库）

每个步骤都有**实时输出与成功/失败状态**；若推送因远程有新提交被拒绝，HexoHub 会自动 `git pull --rebase` 后重试一次。

### 常用命令按钮（单步执行）

主界面提供四个独立按钮，可单步执行：

| 按钮 | 对应命令 | 用途 |
|-----|---------|------|
| 清理 | `hexo clean` | 清理缓存文件 |
| 生成 | `hexo generate` | 生成静态文件到 `public/` |
| 部署 | `hexo deploy` | 部署到远程服务器 |
| 启动服务器 | `hexo server` | 本地预览（`http://localhost:4000`） |

> 💡 **自定义指令**：在「面板设置 → 自定义指令」中可自定义 clean/generate/server/deploy 的完整命令，适配特殊环境。

发布完成后，浏览器访问 `https://kivvs.github.io/`，部署成功！🎉

---

## 十一、发布到自己服务器，Nginx 代理

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

## 十二、最终效果展示

按照本教程操作后，您的博客将具备：

- ✅ 个性化主题（Fluid / NexT 等 440+ 官方主题可选）
- ✅ 文章管理（创建、编辑、标签、分类、实时预览）
- ✅ 图片资源管理（图片库、外部图片提取，直接 URL 引用）
- ✅ 阅读量统计（GA4，含每日趋势与热门文章排行）
- ✅ 评论功能（Giscus，基于 GitHub Discussions）
- ✅ GitHub Pages 一键发布

---

## 相关链接

- [Hexo 官网](https://hexo.io/) / [Hexo 官方主题列表](https://hexo.io/themes/)
- [Node.js 下载](https://nodejs.org/zh-cn/) / [GitHub](https://github.com)
- [Google 账号](https://accounts.google.com) / [Google Analytics](https://analytics.google.com) / [Google Cloud Console](https://console.cloud.google.com)
- [giscus.app](https://giscus.app)
- 配套文档：[📖 HexoHub 使用指南](./HEXOHUB_GUIDE.md)
