import { cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const source = resolve("src/index.d.ts");
const destination = resolve("dist/index.d.ts");

await mkdir(dirname(destination), { recursive: true });
await cp(source, destination);
