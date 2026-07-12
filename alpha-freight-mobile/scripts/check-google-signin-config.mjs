import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { X509Certificate } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const googleServicesPath = join(root, "google-services.json");
const googleServices = JSON.parse(readFileSync(googleServicesPath, "utf8"));

const androidClient = (googleServices.client ?? []).flatMap((client) =>
  (client.oauth_client ?? []).filter((oauth) => oauth.client_type === 1)
);

console.log("Google Sign-In config check");
console.log("----------------------------");

if (androidClient.length > 0) {
  console.log("Native Google Sign-In: ENABLED");
  androidClient.forEach((client) => {
    console.log(`  Android client: ${client.client_id}`);
    console.log(`  SHA-1 hash: ${client.android_info?.certificate_hash ?? "unknown"}`);
  });
} else {
  console.log("Native Google Sign-In: DISABLED (browser OAuth will be used)");
  console.log("");
  console.log("To enable native Google (no supabase URL in picker):");
  console.log("1. Firebase -> Project settings -> Android app com.alphafreight.uk");
  console.log("2. Add SHA-1 fingerprint from your EAS/preview APK");
  console.log("3. Download google-services.json and replace this file");
  console.log("4. Rebuild the app");
}

const apkPath = process.argv[2];
if (apkPath) {
  const buffer = readFileSync(apkPath);
  const magic = Buffer.from("APK Sig Block 42");
  const magicIndex = buffer.indexOf(magic);

  if (magicIndex >= 0) {
    const blockSize = buffer.readUInt32LE(magicIndex - 8);
    const blockStart = magicIndex - 8 - blockSize;
    let offset = blockStart + 8;
    const pairsEnd = magicIndex - 24;

    while (offset < pairsEnd) {
      const pairSize = Number(buffer.readBigUInt64LE(offset));
      offset += 8;
      const pairEnd = offset + pairSize;
      const id = buffer.readUInt32LE(offset);
      offset += 4;

      if (id === 0x7109871a) {
        const signerCount = buffer.readUInt32LE(offset);
        offset += 4;

        for (let s = 0; s < signerCount; s += 1) {
          const signerSize = Number(buffer.readBigUInt64LE(offset));
          offset += 8;
          const signerEnd = offset + signerSize;
          offset += 4;
          const digestsSize = Number(buffer.readBigUInt64LE(offset));
          offset += 8 + digestsSize;
          offset += 8;
          const certCount = buffer.readUInt32LE(offset);
          offset += 4;

          for (let c = 0; c < certCount; c += 1) {
            const certLen = Number(buffer.readBigUInt64LE(offset));
            offset += 8;
            const certDer = buffer.subarray(offset, offset + certLen);
            offset += certLen;
            const cert = new X509Certificate(certDer);
            console.log("");
            console.log(`APK SHA-1: ${cert.fingerprint}`);
            console.log(`APK SHA-256: ${cert.fingerprint256}`);
          }

          offset = signerEnd;
        }
        break;
      }

      offset = pairEnd;
    }
  }
}
