import { execFileSync } from "node:child_process";

const history = process.argv.includes("--history");
const entries = history
  ? execFileSync("git", ["rev-list", "--objects", "--all"], { encoding: "utf8" }).trim().split("\n").map((line) => {
    const space = line.indexOf(" "); return { id: line.slice(0, space), path: line.slice(space + 1) };
  }).filter((entry) => entry.id && entry.path)
  : execFileSync("git", ["ls-files", "--cached", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean).map((path) => ({ id: `:${path}`, path }));

const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:sk_(?:live|test)_[A-Za-z0-9]{16,}|whsec_[A-Za-z0-9]{16,}|gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{25,}|sb_secret_[A-Za-z0-9_-]{20,}|xkeysib-[A-Za-z0-9-]{30,})/,
  /bcrypt\.hash\(\s*['"][^'"]+['"]\s*,/,
  /"(?:password|twoFactorHash)"\s*:\s*"\$2[aby]\$/,
];
const findings = [];
for (const entry of entries) {
  if (/(?:^|\/)(?:\.env(?:\..*)?|data_dump\.json|dev\.db|[^/]+\.(?:pem|key|p12|pfx|sqlite|sqlite3))$/.test(entry.path)) {
    findings.push(`${entry.path}: fichier sensible suivi`);
  }
  let data;
  try { data = execFileSync("git", ["cat-file", "blob", entry.id], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 30 * 1024 * 1024 }); } catch { continue; }
  if (data.includes(0)) continue;
  // Documentation templates contain example hashes and credentials; real
  // provider keys and private keys are still checked in all text files.
  const patterns = /^\.(?:agents|claude|windsurf)\//.test(entry.path) ? secretPatterns.slice(0, 2) : secretPatterns;
  if (patterns.some((pattern) => pattern.test(data.toString("utf8")))) findings.push(`${entry.path}: secret potentiel (${entry.id.slice(0, 12)})`);
}
if (findings.length) { console.error([...new Set(findings)].join("\n")); process.exitCode = 1; }
else console.log(`Aucun secret détecté dans ${entries.length} entrées ${history ? "de l'historique" : "de l'index Git"}.`);
