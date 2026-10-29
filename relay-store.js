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

function writeUpload(id, buffer) { fs.writeFileSync(path.join(uploadsRoot, id), buffer); }
function removeUpload(id) { try { fs.unlinkSync(path.join(uploadsRoot, id)); } catch { } }
function readUpload(id) { return fs.readFileSync(path.join(uploadsRoot, id)); }

module.exports = { data, save, writeUpload, removeUpload, readUpload };
