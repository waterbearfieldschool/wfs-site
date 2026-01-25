const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const PORT = 3001;
const SRC_DIR = path.join(__dirname, 'src');
const ROOT_DIR = __dirname;

// Get last git commit date for a file
function getGitModifiedDate(filePath) {
  try {
    const result = execSync(
      `git log -1 --format="%aI" -- "${filePath}"`,
      { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();
    if (result) {
      return result;
    }
  } catch (e) {
    // Fall back to filesystem mtime if git fails
  }
  return fs.statSync(filePath).mtime.toISOString();
}

// Parse YAML front matter from markdown content
function parseFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { title: null, body: content };

  const frontMatter = match[1];
  const body = content.slice(match[0].length).trim();

  // Simple YAML parsing for title
  const titleMatch = frontMatter.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  const title = titleMatch ? titleMatch[1] : null;

  return { title, body };
}

// Get excerpt from body (first ~100 chars of actual content)
function getExcerpt(body, maxLength = 100) {
  // Remove markdown and HTML elements
  let text = body
    .replace(/^#+\s+.*/gm, '') // markdown headers
    .replace(/!\[.*?\]\(.*?\)/g, '') // markdown images
    .replace(/\[(.+?)\]\(.*?\)/g, '$1') // markdown links (keep text)
    .replace(/\*\*(.+?)\*\*/g, '$1') // bold
    .replace(/\*(.+?)\*/g, '$1') // italic
    .replace(/`(.+?)`/g, '$1') // inline code
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/<img[^>]*>/gi, '') // HTML img tags
    .replace(/<[^>]+>/g, ' ') // all other HTML tags
    .replace(/\{%[\s\S]*?%\}/g, '') // Nunjucks tags
    .replace(/\{\{[\s\S]*?\}\}/g, '') // Nunjucks variables
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();

  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// Recursively find all markdown files
function findMarkdownFiles(dir, category = null) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(SRC_DIR, fullPath);

    if (entry.isDirectory()) {
      // Skip _includes, _data, assets directories
      if (entry.name.startsWith('_') || entry.name === 'assets') continue;

      // The first-level directory becomes the category
      const newCategory = category || entry.name;
      files.push(...findMarkdownFiles(fullPath, newCategory));
    } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.njk'))) {
      // Skip index.njk files in category folders (they're just list pages)
      if (entry.name === 'index.njk' && category) continue;

      const content = fs.readFileSync(fullPath, 'utf8');
      const { title, body } = parseFrontMatter(content);
      const parentDir = path.relative(SRC_DIR, dir);

      files.push({
        path: fullPath,
        relativePath,
        parentDir, // Directory containing this file (for grouping related files)
        category: category || 'root',
        title: title || entry.name.replace(/\.(md|njk)$/, ''),
        excerpt: getExcerpt(body),
        body: body, // Full content for search
        modified: getGitModifiedDate(fullPath)
      });
    }
  }

  return files;
}

// Group files by category
function getFilesGroupedByCategory() {
  const files = findMarkdownFiles(SRC_DIR);
  const grouped = {};

  for (const file of files) {
    if (!grouped[file.category]) {
      grouped[file.category] = [];
    }
    grouped[file.category].push(file);
  }

  // Sort each category's files by modified date (newest first)
  for (const category of Object.keys(grouped)) {
    grouped[category].sort((a, b) => new Date(b.modified) - new Date(a.modified));
  }

  return grouped;
}

// HTTP server
const server = http.createServer((req, res) => {
  // CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Serve dashboard
  if (url.pathname === '/' && req.method === 'GET') {
    const dashboardPath = path.join(__dirname, 'edit-dashboard.html');
    fs.readFile(dashboardPath, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading dashboard');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
    return;
  }

  // API: List files
  if (url.pathname === '/api/files' && req.method === 'GET') {
    try {
      const files = getFilesGroupedByCategory();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(files));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // API: Open file in gedit
  if (url.pathname === '/api/open' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { filePath } = JSON.parse(body);

        // Security: ensure path is within src directory
        const resolved = path.resolve(filePath);
        if (!resolved.startsWith(SRC_DIR) && !resolved.startsWith(__dirname)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Access denied' }));
          return;
        }

        // Open in gedit
        const child = spawn('gedit', [resolved], {
          detached: true,
          stdio: 'ignore'
        });
        child.unref();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, path: resolved }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`WFS Quick Edit Dashboard running at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop');
});
