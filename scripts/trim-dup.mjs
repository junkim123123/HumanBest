import fs from "fs"
import path from "path"

const ROOT = process.cwd()
const TARGET_DIRS = [
  path.join(ROOT, "src", "components"),
  path.join(ROOT, "src", "app"),
]

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

function trimFile(file) {
  if (!file.endsWith(".tsx") && !file.endsWith(".ts")) return { changed: false, reason: "not ts/tsx" }
  const raw = fs.readFileSync(file, "utf8")
  const lines = raw.split(/\r?\n/)

  const useClientIdxs = []
  for (let i = 0; i < lines.length; i++) {
    const s = lines[i].trim()
    if (s === '"use client";' || s === '"use client"') useClientIdxs.push(i)
  }

  let cutAt = null
  let reason = null

  if (useClientIdxs.length >= 2) {
    cutAt = useClientIdxs[1]
    reason = `second "use client" at line ${cutAt + 1}`
  } else {
    // Find first import block end (after imports, before exports/functions)
    let firstImportEnd = -1
    let foundExport = false
    for (let i = 0; i < lines.length; i++) {
      const s = lines[i].trim()
      if (/^\s*import\s/.test(s)) {
        firstImportEnd = i
      } else if (firstImportEnd >= 0 && !foundExport && s.length > 0 && !s.startsWith("//")) {
        if (/^\s*export\s/.test(s) || /^\s*(function|const|interface|type)\s/.test(s)) {
          foundExport = true
          firstImportEnd = i - 1
        }
      }
    }
    
    // Look for second import block after component code has started
    if (firstImportEnd >= 0 && foundExport) {
      for (let i = firstImportEnd + 20; i < lines.length; i++) {
        const s = lines[i].trim()
        if (/^\s*import\s/.test(s) && !s.includes("//")) {
          cutAt = i
          reason = `second import block at line ${cutAt + 1}`
          break
        }
      }
    }
  }

  if (cutAt === null) return { changed: false, reason: "no duplication found" }

  const next = lines.slice(0, cutAt).join("\n").trimEnd() + "\n"
  if (next === raw) return { changed: false, reason: "content unchanged after trim" }

  fs.writeFileSync(file, next, "utf8")
  return { changed: true, cutAt, reason }
}

const files = TARGET_DIRS.flatMap((d) => (fs.existsSync(d) ? walk(d) : []))
const changed = []

for (const f of files) {
  const res = trimFile(f)
  if (res.changed) changed.push({ file: f, cutAt: res.cutAt })
}

console.log("Trimmed files", changed.length)
for (const c of changed) {
  const relPath = path.relative(ROOT, c.file)
  console.log(`- ${relPath}: ${c.reason} (line ${c.cutAt + 1})`)
}

