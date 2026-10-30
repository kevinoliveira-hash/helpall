/** Compila dependências oficiais localmente. O navegador não executa código de CDN. */
import { build } from "esbuild";
import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
await mkdir("dist/vendor", { recursive: true });
await build({
  stdin: {
    contents: "export {createClient} from '@supabase/supabase-js';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2022"],
  minify: true,
  legalComments: "eof",
  outfile: "dist/vendor/supabase.js",
});
await build({
  stdin: {
    contents:
      "export {ShieldCheck, Fingerprint, HeartHandshake, ArrowUpRight, LockKeyhole, Mail, Eye, EyeOff, CircleCheck, Users, Coins} from 'lucide';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2022"],
  minify: true,
  legalComments: "eof",
  outfile: "dist/vendor/lucide.js",
});
await copyFile(
  "node_modules/@supabase/supabase-js/LICENSE",
  "dist/vendor/SUPABASE-LICENSE",
);
await copyFile("node_modules/lucide/LICENSE", "dist/vendor/LUCIDE-LICENSE");
console.log("SDK Supabase e ícones Lucide compilados em dist/vendor.");
