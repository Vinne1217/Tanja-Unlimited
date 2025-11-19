from cryptography.fernet import Fernet
import base64
import hashlib
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

def encrypt_message(message: str, password: str) -> str:
    """Encrypt a message using a password"""
    # Generate key from password
    password_bytes = password.encode()
    salt = b'fixed_salt_for_tanja'  # In production, use random salt
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(password_bytes))
    
    # Encrypt
    f = Fernet(key)
    encrypted = f.encrypt(message.encode())
    return encrypted.decode()

def decrypt_message(encrypted_message: str, password: str) -> str:
    """Decrypt a message using a password"""
    # Generate key from password (same as encryption)
    password_bytes = password.encode()
    salt = b'fixed_salt_for_tanja'
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(password_bytes))
    
    # Decrypt
    f = Fernet(key)
    decrypted = f.decrypt(encrypted_message.encode())
    return decrypted.decode()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("Usage:")
        print("  Encrypt: python encrypt_message.py encrypt 'your message' 'password'")
        print("  Decrypt: python encrypt_message.py decrypt 'encrypted_text' 'password'")
        sys.exit(1)
    
    mode = sys.argv[1]
    
    if mode == "encrypt":
        message = sys.argv[2]
        password = sys.argv[3] if len(sys.argv) > 3 else input("Enter password: ")
        encrypted = encrypt_message(message, password)
        print("\nEncrypted message:")
        print(encrypted)
        print("\nSend this to your coworker along with the password (via different channel)")
    
    elif mode == "decrypt":
        encrypted = sys.argv[2]
        password = sys.argv[3] if len(sys.argv) > 3 else input("Enter password: ")
        try:
            decrypted = decrypt_message(encrypted, password)
            print("\nDecrypted message:")
            print(decrypted)
        except Exception as e:
            print(f"Error: Failed to decrypt. Wrong password? {e}")
    else:
        print(f"Unknown mode: {mode}. Use 'encrypt' or 'decrypt'")

