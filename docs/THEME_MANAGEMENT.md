# HexoHub 博客主题管理指南

本文介绍如何使用 HexoHub 的"博客主题管理"功能：浏览 hexo.io 官方主题库、一键下载安装、一键切换，以及主题切换的智能验证与自动回滚机制。

---

## 一、入口

- 左侧边栏 → **博客主题 → 主题管理**
- 面板包含两个标签页：**「已安装」** 和 **「在线主题库」**

---

## 二、已安装主题管理

「已安装」标签自动扫描您的 Hexo 项目中的主题来源：

| 来源 | 说明 |
|------|------|
| `themes/` 目录 | 手动放入（git clone / 复制）的主题 |
| `node_modules/hexo-theme-*` | 通过 npm 安装的主题（如 fluid） |

每个主题卡片展示：**主题名、版本号、来源徽标**（`themes/` 或 `npm`）。

### 一键切换

点击主题卡片即切换：
1. 自动修改 Hexo 项目根目录 `_config.yml` 的 `theme` 字段
2. 自动执行 `hexo clean` + `hexo generate` 验证
3. 验证通过 → 切换成功；验证失败 → **自动回滚原主题**并重新生成恢复站点

> **关键保障**：无论切换已用过的主题还是从未用过的全新主题，只要它无法正常生成（缺少 layout 模板、生成 0 个文件、命令报错），软件都会自动恢复原状，**不会再出现纯白界面**。

### 非 Hexo 主题识别

HexoHub 会自动检测主题目录是否包含 Hexo 必备的 `layout/` 模板目录，并识别出 **Gatsby / Hugo / VitePress** 等非 Hexo 框架主题。这类主题会被红色标记、禁止切换（点击会给出明确提示），从源头避免加载失败。

---

## 三、在线主题库

「在线主题库」标签内置 **hexo.io 官方目录**（440+ 个主题），每个条目包含：
- **主题名称**（即 `_config.yml` 的 theme 值）
- **GitHub 仓库链接**
- 简介描述
- 预览地址、标签

支持功能：
- **搜索**：按主题名称实时过滤
- **已安装标记**：已安装的主题显示绿色「✓ 已安装」，避免重复安装
- **一键安装**：未安装的主题点击「安装」→ 通过 **GitHub SSH**（`git@github.com:owner/repo.git`）自动 `git clone` 到 `themes/<主题名>/`，实时显示安装日志，并校验是否含 `layout/` 目录
- **快速访问**：点击 GitHub / 预览链接在新窗口打开

### 在线目录加载策略（拉取一次、长期记忆）

为规避 GitHub API 限流并提升体验，目录采用**三层加载**：

1. **30 天本地缓存**：在线拉取成功后会写入 localStorage，30 天内直接秒开，不再请求网络
2. **打包静态目录**：应用内置 `public/hexo-themes-catalog.json`（440+ 主题），离线可用、打开即显示
3. **在线刷新**：仅当缓存/静态目录都不可用，或您手动点击「拉取目录」时才会请求 GitHub API；成功后自动更新缓存

> 进入「在线主题库」标签时会自动加载（无需手动点击）。

### 安装前提（SSH）

在线安装使用 **SSH 协议**，需满足：
1. 本机已生成 SSH 密钥：`ssh-keygen -t rsa -b 4096`
2. 公钥已添加到 GitHub：Settings → SSH and GPG keys（复制 `~/.ssh/id_rsa.pub`）
3. 验证连接：`ssh -T git@github.com`（首次需确认 host key）

安装失败时会给出明确错误提示（如密钥未配置、网络不通等）。

---

## 四、主题配置文件说明

| 文件 | 作用 |
|------|------|
| `themes/<name>/_config.yml` | 主题自带的默认配置（git clone 后自动存在） |
| `<hexo根目录>/_config.<name>.yml` | 主题独立覆盖配置（如 `_config.fluid.yml`），优先于主题默认配置 |

- 绝大多数主题 clone 到 `themes/` 后即可直接使用默认配置
- 部分主题（如 fluid）支持在博客根目录创建 `_config.<name>.yml` 进行个性化定制，Hexo 会自动读取
- 切换主题后，建议执行「清理 + 生成」（HexoHub 顶栏按钮）查看效果，再「部署」发布

---

## 五、常见问题

**Q: 切换主题后页面变白？**
A: 新版 HexoHub 已内置自动验证与回滚，正常情况下不会出现。若您手动改过 `_config.yml`，请确认：
1. `theme:` 值必须是 `themes/` 下的**目录原名**（如 `hexo-theme-redefine`）或 npm 包的**短名**（如 `fluid`）
2. 主题目录必须包含 `layout/` 文件夹（Hexo 模板目录）
3. 若遇 `db.json` 缓存异常，先执行「清理」再「生成」

**Q: 在线安装按钮显示"已安装"但列表没有？**
A: 说明该主题已存在于 `themes/` 或 `node_modules`。若仍未显示，点击「刷新」重新扫描。

**Q: 安装失败提示 SSH 错误？**
A: 按上文"安装前提"配置 GitHub SSH 密钥；也可改用 npm 方式：`npm install hexo-theme-<名称>`。

---

## 六、相关链接

- [hexo.io 官方主题页](https://hexo.io/themes/)
- [Hexo 主题文档](https://hexo.io/docs/themes)
- [Hexo 主题目录数据源（hexojs/site）](https://github.com/hexojs/site/tree/master/source/_data/themes)
