import { X509Certificate } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const apkPath = join(tmpdir(), "alpha-freight-preview.apk");
const buffer = readFileSync(apkPath);
const magic = Buffer.from("APK Sig Block 42");
const magicIndex = buffer.indexOf(magic);

if (magicIndex < 0) {
  console.error("APK signing block not found");
  process.exit(1);
}

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
        console.log("SHA-1:", cert.fingerprint);
        console.log("SHA-256:", cert.fingerprint256);
      }

      offset = signerEnd;
    }
    break;
  }

  offset = pairEnd;
}
