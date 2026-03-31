// utils/crypto.js
// For encrypting and decrypting database connection passwords. (auth/login uses bcrypt)

const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";
// Secret encryption key. MUST be 32 characters. Store in .env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
// Initialization Vector. MUST be 16 characters. Store in .env
const IV = process.env.IV;

if (
  !ENCRYPTION_KEY ||
  !IV ||
  ENCRYPTION_KEY.length !== 32 ||
  IV.length !== 16
) {
  throw new Error(
    "ENCRYPTION_KEY (32 chars) and IV (16 chars) must be set in .env file."
  );
}

// Function to encrypt text
function encrypt(text) {
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(IV)
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString("hex");
}

// Function to decrypt text
function decrypt(text) {
  const encryptedText = Buffer.from(text, "hex");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(IV)
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

module.exports = { encrypt, decrypt };
