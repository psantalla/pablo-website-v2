import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "content");

async function* walk(dir) {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const p = join(dir, entry.name);
		if (entry.isDirectory()) yield* walk(p);
		else if (entry.isFile() && p.endsWith(".mp4")) yield p;
	}
}

let made = 0;
for await (const mp4 of walk(root)) {
	const webp = mp4.replace(/\.mp4$/, ".webp");
	if (existsSync(webp)) continue;
	try {
		execFileSync("ffmpeg", ["-y", "-i", mp4, "-vframes", "1", "-c:v", "libwebp", "-quality", "80", webp], { stdio: "pipe" });
		console.log(`poster: ${webp.replace(root + "/", "")}`);
		made++;
	} catch (err) {
		console.error(`ffmpeg failed for ${mp4}. Is ffmpeg installed?`);
		process.exit(1);
	}
}
if (!made) console.log("posters: up to date");
