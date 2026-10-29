const fs = require('fs');
const path = require('path');

const root = process.env.CIRCUX_DATA_DIR || path.join(process.cwd(), '.circux-data');
const file = path.join(root, 'store.json');
const uploadsRoot = path.join(root, 'uploads');
fs.mkdirSync(uploadsRoot, { recursive: true });

let data = { projects: {}, config: {}, judging: [], uploads: [] };
try { data = { ...data, ...JSON.parse(fs.readFileSync(file, 'utf8')) }; } catch { }

function save(next = data) {
  data = next;
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2));
  fs.renameSync(temp, file);
}

function uploadPath(id, projectId) {
  const safeId = String(id).replace(/[^A-Za-z0-9_-]/g, '');
  const folder = String(projectId || '_unassigned').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80) || '_unassigned';
  return path.join(uploadsRoot, folder, safeId);
}
function writeUpload(id, buffer, projectId) { const file = uploadPath(id, projectId); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, buffer); }
function moveUpload(id, fromProjectId, toProjectId) { const source = uploadPath(id, fromProjectId); const legacy = path.join(uploadsRoot, String(id).replace(/[^A-Za-z0-9_-]/g, '')); const target = uploadPath(id, toProjectId); fs.mkdirSync(path.dirname(target), { recursive: true }); if (fs.existsSync(source)) fs.renameSync(source, target); else if (fs.existsSync(legacy)) fs.renameSync(legacy, target); }
function removeUpload(id, projectId) { try { fs.unlinkSync(uploadPath(id, projectId)); } catch { try { fs.unlinkSync(path.join(uploadsRoot, String(id).replace(/[^A-Za-z0-9_-]/g, ''))); } catch { } } }
function readUpload(id, projectId) { try { return fs.readFileSync(uploadPath(id, projectId)); } catch { return fs.readFileSync(path.join(uploadsRoot, String(id).replace(/[^A-Za-z0-9_-]/g, ''))); } }

module.exports = { data, save, writeUpload, moveUpload, removeUpload, readUpload };
