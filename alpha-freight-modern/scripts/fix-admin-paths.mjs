import fs from "fs";
import path from "path";

const roots = [
  "src/app/ops-af-7x9k2",
  "src/components/admin",
];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      let content = fs.readFileSync(full, "utf8");
      const original = content;
      content = content
        .replace(/"\/admin\//g, '"/ops-af-7x9k2/')
        .replace(/'\/admin\//g, "'/ops-af-7x9k2/")
        .replace(/`\/admin\//g, "`/ops-af-7x9k2/")
        .replace(/path: "\/admin"/g, 'path: "/ops-af-7x9k2"')
        .replace(/href: "\/admin"/g, 'href: "/ops-af-7x9k2"')
        .replace(/=== "\/admin"/g, '=== "/ops-af-7x9k2"')
        .replace(/== "\/admin"/g, '== "/ops-af-7x9k2"')
        .replace(/startsWith\("\/admin"\)/g, 'startsWith("/ops-af-7x9k2")');
      if (content !== original) {
        fs.writeFileSync(full, content);
        console.log("updated", full);
      }
    }
  }
}

for (const root of roots) walk(root);
