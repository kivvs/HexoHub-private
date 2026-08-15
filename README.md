# HexoHub

[中文文档](https://github.com/kivvs/HexoHub-private/blob/main/README.md)  |  [English](https://github.com/kivvs/HexoHub-private/blob/main/docs/README.en.md)  |  [发布指南](https://github.com/kivvs/HexoHub-private/blob/main/docs/RELEASE_GUIDE.md)  |  [Tauri 开发指南](https://github.com/kivvs/HexoHub-private/blob/main/docs/TAURI_DEVELOPMENT.md)  |  [主题管理指南](https://github.com/kivvs/HexoHub-private/blob/main/docs/THEME_MANAGEMENT.md)  |  [AI 功能指南](https://github.com/kivvs/HexoHub-private/blob/main/docs/AI_FEATURES.md)


[![GitHub Stars](https://img.shields.io/github/stars/kivvs/HexoHub-private)](https://github.com/kivvs/HexoHub-private/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/kivvs/HexoHub-private)](https://github.com/kivvs/HexoHub-private/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/kivvs/HexoHub-private)](https://github.com/kivvs/HexoHub-private/issues)
[![GitHub License](https://img.shields.io/github/license/kivvs/HexoHub-private)](https://github.com/kivvs/HexoHub-private)
[![GitHub all releases](https://img.shields.io/github/downloads/kivvs/HexoHub-private/total)](https://github.com/kivvs/HexoHub-private/releases)  


<a href="https://apps.microsoft.com/detail/9p88nbscpfm6?referrer=appbadge&mode=full" target="_blank"  rel="noopener noreferrer">
	<img src="https://get.microsoft.com/images/zh-cn%20dark.svg" width="200"/>
</a>

一个Hexo博客管理桌面应用程序，提供图形化界面来替代传统的命令行操作  
> 告别繁琐的传统命令行方式（我已经厌倦了hexo xxxx🫠），以更优雅的方式管理您的hexo博客。

<div align="center">
  <img 
    src="https://github.com/user-attachments/assets/185d93c6-836b-434a-a9b8-55400dc25f3e" 
    alt="image" 
    width="80%" 
  />
</div>

<div align="center">
  <img 
    src="https://github.com/user-attachments/assets/10fadb85-4fb7-438f-884d-b80e90886e5e" 
    alt="image" 
    width="80%" 
  />
</div>

# 特点
- **小巧**：选择tauri框架下的发行版（推荐），安装包仅为 5.8MB，安装后应用程序大小仅为 20MB 
- **轻量**：基于Next.js ，React ，TypeScript ，Tauri ，轻量且高效
- **快速**：快速启动，快速响应，无冗余设计
- **简洁**：简洁的UI设计，专注于博客
- **智能**：集成了AI功能，辅助您的创作与问题排查
- **主题化**：六套软件界面主题 + 博客主题在线管理与一键切换


# 功能

## 文章管理
在本应用程序中，您可以可视化的：**创建新文章**，**查看文章列表** ，**编辑文章**，**实时预览**，**启动本地预览**，**生成并推送静态文件**，**删除文章**

## Markdown 编辑器增强
- **字体颜色**：工具栏色板一键为选中文字添加 `<font color>` 颜色（16 种常用色 + 自定义取色 + 清除），Hexo 渲染与内置预览均支持
- **富文本清理**：一键清除粘贴自语雀/Word 等处的 `<font style="...">` 样式标签，仅保留文字内容
- **HTML 渲染**：预览支持 `<font style>`、`<span>`、`<br>` 等内联 HTML 标签，还原富文本排版
- **默认文字颜色修复**：编辑器文字始终跟随主题变量，不再出现"默认白色看不清"问题

## 图片拖入与提取
**拖入上传**：开启 Hexo 资源文件夹（[这是什么？](https://hexo.io/zh-cn/docs/asset-folders)）后，将本地图片拖入编辑器即可自动复制到资源文件夹并填入 `{% asset_img example.jpg %}` 标签。

<div align="center">
  <img 
    src="https://github.com/user-attachments/assets/2aced4e0-ef08-4daf-af8b-6a31f43a2d56" 
    alt="image" 
    width="80%" 
  />
</div>

<div align="center">
  <img 
    src="https://github.com/user-attachments/assets/be796a74-7990-4780-a93e-4c3c72d07335" 
    alt="image" 
    width="80%" 
  />
</div>

**图片提取**：一键提取文章中的外部网络图片（支持 `<img src="...">` 与 Markdown 语法），自动下载到 `source/images`、按 `文章名-序号.扩展名` 重命名、**自动关联当前文章**并替换正文引用。

**图片管理**：统一管理 `source/images` 图片库，支持网格/列表视图、按文章标签筛选、重命名、删除、插入引用。

## 博客主题管理
- **已安装主题**：自动扫描 `themes/` 目录与 `node_modules/hexo-theme-*`，卡片式展示主题名/版本/来源，点击**一键切换**（自动修改 `_config.yml`）
- **智能验证与回滚**：切换后自动执行 `hexo clean + generate` 验证；若生成失败（缺少 layout 模板、0 文件等）**自动回滚到原主题**并恢复站点，**任何主题都不会再白屏**
- **非 Hexo 主题识别**：自动检测 Gatsby/Hugo/VitePress 等非 Hexo 主题并禁用切换，从源头避免错误
- **在线主题库**：内置 hexo.io 官方目录（440+ 主题，含名称/GitHub 链接/简介/标签），支持搜索、已安装状态标记、**一键 SSH 下载安装**到 `themes/`
  - 三层加载加速：30 天长期缓存 → 打包静态目录（秒开、离线可用）→ 在线刷新

详细说明请参考 [📖 主题管理指南](./docs/THEME_MANAGEMENT.md)。

## Hexo 操作 
**命令执行**：图形化执行常用 Hexo 命令，包括：  
  - `hexo clean` - 清理缓存文件
  - `hexo generate` - 生成静态文件
  - `hexo deploy` - 部署到远程服务器
  - `hexo se` - 启动本地预览   
**实时反馈**：显示命令执行结果和错误信息  
**一键发布**：顺序执行 清理 → 生成 → 部署 → 推送，一步到位  
**自定义指令**：支持自定义 clean/generate/server/deploy 完整命令

## 配置管理
**基本设置**：网站标题、副标题、作者、语言、时区、主题  
**高级设置**：URL 配置、永久链接格式  
**YAML 编辑**：支持直接编辑原始配置文件  
**导入/导出**：配置文件的备份和恢复，更加方便您主题的迁移  
**主题配置文件**：支持 fluid 等主题的 `_config.<主题名>.yml` 独立配置管理

## AI 功能
- **AI 灵感**：基于您的博客主题与偏好，一键生成写作灵感
- **AI 分析**：分析文章标签与发布数据，给出鼓励性反馈与建议
- **AI 重写/改进/扩展/翻译**：编辑器右键菜单即可对选中文字进行 AI 润色
- **AI 深度模仿**：参考选定文章的风格进行模仿创作
- **AI 辅助诊断（新增）**：描述您遇到的软件/博客问题，AI 结合软件环境、系统信息、Hexo 项目路径与最近操作日志，自动分析原因并给出分步解决方案

## 软件界面主题
六套界面主题：**跟随系统 / 明亮 / 黑夜 / 深海 / 森林 / 日落**。顶部工具栏一键轮换，设置面板可视化预览与选择，配置自动保存、重启后恢复。

## 数据统计
- **标签云**：文章标签聚合展示，点击筛选
- **发布统计**：按月份的文章发布数量图表
- **外部统计**：集成 Giscus 评论数与 GA4 阅读量展示
- **图片文章关联**：图片自动关联文章标签，按文章筛选图片库

#  快速开始  
## 使用

如果您只需"使用"本应用程序：   
- **操作系统**: Windows 10 或更高版本    
- **存储**: 建议 200MB 可用空间  
- **Hexo**：https://hexo.io/
- **Npm**：`npm>10`    👉https://www.npmjs.com/
- **Node.js**：`nodejs>20`    👉https://nodejs.org/zh-cn/   

随后到[Releases](https://github.com/kivvs/HexoHub-private/releases/)下载最新版本。  
  
## 开发   

如果您需要"开发"本应用程序，以下是额外的需求：   
- **Git**：https://git-scm.com/   
- **nodejs**：`TypeScript>4.5`，`React>19`，`Next.js>15`   

> ⚠️ 出于速度考虑，我在开发过程中使用的是`cnpm`，并且修改了部分`package.json`内容，请您在使用时酌情考虑，如果要使用`cnpm`，请执行：  

```bash
npm install -g cnpm --registry=http://registry.npm.taobao.org
```

随后即可用`cnpm`代替`npm`

### 📦 自动化发布流程

项目已配置 GitHub Actions 自动化发布流程。维护者在准备发布新版本时，只需推送版本标签即可自动构建和发布 Windows、Linux 安装包。详细步骤请参考 [📦 发布指南](./docs/RELEASE_GUIDE.md)。

# 技术栈

- **Next.js 15** - React 全栈框架
- **React** - 用户界面库
- **TypeScript** - 类型安全的 JavaScript  
- **Tailwind CSS** - CSS 框架  
- **Electron** - 跨平台桌面应用框架 (主分支)
- **Tauri** - 轻量级桌面应用框架 (tauri 分支)
- **Rust** - 系统编程语言 (Tauri 后端)
- **electron-builder** - Electron 应用打包工具
- **NSIS** - Windows 安装程序制作工具
- **remark-gfm / rehype-raw** - Markdown 解析与 HTML 渲染
- [Hexo](https://hexo.io/) - 静态博客生成器


# 贡献指南

欢迎提交 Issue 和 Pull Request！  
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

---

我在开发过程中遇到了许多问题，如果您可以加入这个项目，成为志同道合的朋友，我会万分感激，给您点杯咖啡！☕
可以通过以下方式联系我：
- 邮箱3084631932@qq.com
- 我的博客https://kivvs.github.io
- github

## 国际化（i18n）
本项目使用`next-i18next`进行国际化处理，您可以在`i18n.js`中配置您的语言包，旨在帮助您的项目轻松支持多语言，让全世界的用户都能无障碍使用。   

-  多语言支持：轻松切换不同语言   
-  简单集成：快速上手，兼容主流框架   
-  可扩展：自定义翻译和语言包  

```bash
# 安装模块
npm install your-i18n-module
```

```typescript
// 初始化
import i18n from 'your-i18n-module';

i18n.init({
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'zh', 'es', 'fr']
});
```


## 代码规范
没有规范（实际上本人代码一团糟👻），只要您写的东西是人类语言即可
 
#  LICENSE

本项目采用 [MIT](https://choosealicense.com/licenses/mit/) 许可证，请您在使用本项目时遵守相关法律法规。



# 更改日志
更多日志请移步release查看
## v3.8.x（最新）
- 新增 **AI 辅助诊断**：描述问题即可获得结合软件/系统/项目日志的 AI 原因分析与解决步骤
- 新增 **博客主题在线管理**：内置 hexo.io 官方 440+ 主题目录，支持搜索、SSH 一键下载安装、一键切换
- 新增 **主题切换智能验证与自动回滚**：切换任意主题后自动验证生成，失败自动恢复，杜绝白屏
- 新增 **非 Hexo 主题识别**：自动检测并禁用 Gatsby/Hugo 等非 Hexo 主题
- 新增 **编辑器字体颜色**（16 色 + 自定义 + 清除）与 **富文本清理**（语雀 `<font style>` 标签）
- 新增 **图片提取**：外部图片自动下载到 source/images、重命名并关联文章
- 新增 **软件界面六套主题**（系统/明亮/黑夜/深海/森林/日落）与一键轮换
- 修复 Markdown 预览对 HTML 内联标签（`<font style>` 等）的渲染
- 修复 推送代码到 GitHub 时的错误
- 修复编辑器默认文字颜色问题

## v3 (2025-08-16)
新功能：  
- 在"文章列表"界面加入右键逻辑，实现快速操作  
- 左侧加入"标签云图"  
  
BUG 修复： 
- 修复了hexo配置下，"网站标题"设置失败的问题   
- 修复了"按文章名排序"时，偶发的排序混乱问题  
- 修复了当"作者"为空时，生成静态文件报错的问题  

## v2 (2025-08-13)
新功能：  
- 重构"文章列表"功能，将其放在右侧主窗口   
- 加入"按标签/分类显示文章"功能   
- 加入文章批量处理功能（批量删除/添加标签/添加分类） 
- 添加国际化支持   

BUG 修复：  
- 修复了部分明暗转换异常  

## v1 (2025-08-10)
- 首次构建  
- 基本命令，文章按日期/名称排序  
- 基本功能实现  
