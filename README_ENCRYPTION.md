# Message Encryption Tool

A simple tool to encrypt and decrypt messages using password-based encryption.

## Installation

First, install the required library:

```bash
pip install cryptography
```

## Usage

### Encrypt a Message

```bash
python encrypt_message.py encrypt "Your secret message here" "your-password"
```

Or without providing password in command line (more secure):

```bash
python encrypt_message.py encrypt "Your secret message here"
# Then enter password when prompted
```

### Decrypt a Message

```bash
python encrypt_message.py decrypt "encrypted_text_here" "your-password"
```

Or without providing password in command line:

```bash
python encrypt_message.py decrypt "encrypted_text_here"
# Then enter password when prompted
```

## Example

**Encrypt:**
```bash
python encrypt_message.py encrypt "Hello, this is a secret message!" "mySecretPassword123"
```

Output:
```
Encrypted message:
gAAAAABl...encrypted_text_here...

Send this to your coworker along with the password (via different channel)
```

**Decrypt:**
```bash
python encrypt_message.py decrypt "gAAAAABl...encrypted_text_here..." "mySecretPassword123"
```

Output:
```
Decrypted message:
Hello, this is a secret message!
```

## Security Notes

- **Share the password separately** from the encrypted message (via phone, Signal, in person, etc.)
- The encryption uses AES-256 encryption with PBKDF2 key derivation
- Never share passwords in the same channel as the encrypted message
- For production use, consider using a random salt instead of a fixed one

