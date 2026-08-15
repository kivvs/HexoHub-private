#!/usr/bin/env node
/**
 * 生成 Hexo 官方主题静态目录（hexo.io/themes）
 *
 * 直接方式：Node fetch 拉取 GitHub API 目录列表 + 逐文件下载 raw YAML，
 * 解析后生成 public/hexo-themes-catalog.json。
 * 应用运行时直接读取该静态文件（离线可用），不再依赖在线 API（避免限流）。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'public', 'hexo-themes-catalog.json');
const THEMES_API_URL = 'https://api.github.com/repos/hexojs/site/contents/source/_data/themes';
const THEMES_RAW_BASE = 'https://raw.githubusercontent.com/hexojs/site/master/source/_data/themes';

function parseSimpleYaml(content) {
  const result = {};
  const lines = content.split('\n');
  let inTags = false;
  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (inTags) {
      const m = line.match(/^\s*-\s*(.+)$/);
      if (m) {
        if (!result.tags) result.tags = [];
        result.tags.push(m[1].trim().replace(/^["']|["']$/g, ''));
        continue;
      }
      inTags = false;
    }
    const keyMatch = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!keyMatch) continue;
    const key = keyMatch[1];
    const value = keyMatch[2].trim().replace(/^["']|["']$/g, '');
    switch (key) {
      case 'description':
        result.description = value;
        break;
      case 'link':
        result.link = value;
        break;
      case 'preview':
        result.preview = value;
        break;
      case 'tags':
        if (value) result.tags = [value];
        else inTags = true;
        break;
    }
  }
  return result;
}

function isGithubLink(link) {
  return /github\.com[/:][^/]+\/[^/]+/.test(link || '');
}

async function main() {
  console.log('>>> 1. 获取主题文件列表...');
  const listRes = await fetch(THEMES_API_URL, { headers: { 'User-Agent': 'HexoHub-Gen' } });
  if (!listRes.ok) throw new Error('目录 API HTTP ' + listRes.status);
  const entries = await listRes.json();
  const files = entries
    .filter((e) => e.type === 'file' && e.name.endsWith('.yml'))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  console.log('    共', files.length, '个主题文件');

  console.log('>>> 2. 下载并解析各主题 YAML（串行，避免触发限流）...');
  const items = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const res = await fetch(`${THEMES_RAW_BASE}/${encodeURIComponent(file.name)}`, {
        headers: { 'User-Agent': 'HexoHub-Gen' },
      });
      if (!res.ok) {
        console.log('    跳过（HTTP ' + res.status + '）: ' + file.name);
        continue;
      }
      const content = await res.text();
      const parsed = parseSimpleYaml(content);
      const name = file.name.replace(/\.yml$/i, '');
      if (parsed.link && isGithubLink(parsed.link)) {
        items.push({
          name,
          description: parsed.description || '',
          link: parsed.link,
          preview: parsed.preview || '',
          tags: parsed.tags || [],
        });
      }
    } catch (e) {
      console.log('    跳过（' + e.message + '）: ' + file.name);
    }
    if (i % 50 === 0) console.log('    进度 ' + (i + 1) + '/' + files.length);
  }

  console.log('>>> 3. 写入静态文件...');
  const output = { generatedAt: new Date().toISOString(), count: items.length, items };
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log('    完成: public/hexo-themes-catalog.json (' + items.length + ' 个主题)');
}

main().catch((e) => {
  console.error('失败:', e.message);
  process.exit(1);
});
