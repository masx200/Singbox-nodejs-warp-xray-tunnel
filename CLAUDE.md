# CLAUDE.md

This file contains additional context for the Claude Code agent to help it be
more productive when working in this codebase.

## Overview

This is a Node.js project that implements a network proxy service using sing-box
with support for multiple proxy protocols (TUIC, Hysteria2, and Reality). The
project is designed for low-memory environments (128MB+ RAM) and includes
automatic daily restart functionality for cache clearing.

## Architecture and Structure

### Core Components

1. **index.js** - Main Node.js entry point that orchestrates the execution of
   bash scripts
   - Executes `warp.sh` to download and run masque-plus proxy tools
   - Executes `start.sh` to configure and run sing-box with multiple protocols

2. **warp.sh** - Downloads and runs proxy tools
   - Downloads `masque-plus` and `usque` binaries from CDN
   - Runs masque-plus in an infinite loop with specific configuration
   - Connects to Cloudflare WARP endpoints (162.159.198.2:443)

3. **start.sh** - Main configuration and service script
   - Downloads sing-box binary based on system architecture
   - Generates and persists UUID and Reality keypair
   - Creates SSL certificates (self-signed or OpenSSL-generated)
   - Configures and starts sing-box with multiple protocols
   - Implements daily restart at 00:03 Beijing time
   - Generates subscription URLs for clients

4. **h3_fingerprint.go** - Go utility for HTTP/3 certificate fingerprint
   extraction
   - Connects to HTTP/3 endpoints and extracts TLS certificate SHA256
     fingerprint
   - Used for certificate validation in Hysteria2 protocol configuration

5. **generateVlessKeys.js** - VLESS encryption key generation module
   - Uses xray-core to generate ML-KEM-768 Post-Quantum encryption keys
   - Generates random UUID for VLESS authentication
   - Generates random 50-character xhttp_path (numbers and lowercase letters)
   - Implements caching mechanism to persist keys in cache.json
   - Returns cached values if available, generates new ones if not

6. **generateRandomPath.js** - Random path generation utility
   - Generates 50-character random strings for xhttp_path
   - Uses numbers (0-9) and lowercase letters (a-z)
   - Returns path starting with "/" for use in HTTP obfuscation

7. **updateXrayconfig.js** - Xray configuration updater
   - Updates xray-config.json with generated VLESS credentials
   - Integrates vless_uuid, encryption keys, and xhttp_path
   - Supports ML-KEM-768 Post-Quantum authentication

8. **downloadXray.js** - Xray-core binary downloader
   - Downloads platform-specific xray-core binary
   - Ensures xray is available before key generation

9. **generateVlessSubscription.js** - VLESS subscription URL generator
   - Generates subscription URLs from VLESS configuration
   - Outputs to vless.txt for client import
   - Supports standard VLESS protocol format

### Protocol Configuration

The service supports three proxy protocols:

- **TUIC** - QUIC-based proxy protocol with congestion control (BBR)
- **Hysteria2** - High-speed UDP-based proxy with masquerading
- **Reality** - VLESS protocol with TLS obfuscation

All protocols share the same UUID for authentication and use custom TLS
certificates.

## Development Environment

### Prerequisites

- Node.js 18+ (required)
- Bash/shell environment (Linux/Unix)
- wget or curl for downloads
- OpenSSL (optional, for better certificate generation)

### Project Structure

```
/
├── index.js                     # Main Node.js entry point
├── package.json                 # Node.js project configuration
├── config.js                    # Configuration constants
├── generateVlessKeys.js         # VLESS key generation module
├── generateRandomPath.js        # Random path generation utility
├── updateXrayconfig.js          # Xray configuration updater
├── downloadXray.js              # Xray binary downloader
├── generateVlessSubscription.js # Subscription URL generator
├── warp.sh                      # Proxy tool download and execution
├── start.sh                     # Main service configuration script
├── h3_fingerprint.go            # Certificate fingerprint utility
├── go.mod                       # Go module dependencies
├── .gitignore                   # Git ignore rules
├── README.md                    # User documentation
├── CLAUDE.md                    # AI assistant context
├── cache.json                   # VLESS keys cache (generated)
├── xray-config.json             # Xray configuration (generated)
├── vless.txt                    # VLESS subscription URL (generated)
└── .npm/                        # Runtime directory (created at runtime)
    ├── uuid.txt                 # Persistent UUID storage
    ├── key.txt                  # Reality keypair storage
    ├── config.json              # sing-box configuration
    ├── list.txt                 # Subscription URLs
    └── sub.txt                  # Base64-encoded subscription
```

### Environment Variables

- `TUIC_PORT` - Port for TUIC protocol (optional, defaults to empty)
- `HY2_PORT` - Port for Hysteria2 protocol (optional, defaults to empty)
- `REALITY_PORT` - Port for Reality protocol (optional, defaults to empty)

### VLESS Configuration

The project now supports VLESS protocol with advanced security features:

- **Post-Quantum Encryption**: Uses ML-KEM-768 (Module-Lattice-Based Key Encapsulation Mechanism)
- **Dynamic Path Generation**: Random 50-character xhttp_path for each installation
- **Key Caching**: Encryption keys and paths cached in cache.json for persistence
- **Xray Integration**: Leverages xray-core's vlessenc for secure key generation

**Generated Credentials**:
- `vless_uuid`: Unique identifier for VLESS authentication
- `vless_encryption`: Public key for encryption
- `vless_decryption`: Private key for decryption
- `xhttp_path`: Random HTTP path for obfuscation (50 chars, a-z0-9)

**Configuration Files**:
- `xray-config.json`: Xray-core configuration with VLESS settings
- `cache.json`: Persistent storage for generated keys and paths
- `vless.txt`: Subscription URL for client import

## Common Development Commands

### Running the Application

```bash
# Install dependencies (minimal for this project)
npm install

# Start the service
npm start
# or
node index.js
```

### Development Tasks

```bash
# Build the Go fingerprint utility
go build -o h3_fingerprint.exe h3_fingerprint.go

# Run fingerprint utility to get certificate SHA256
./h3_fingerprint.exe
```

### Testing Protocol Connectivity

```bash
# Test HTTP/3 connectivity with custom fingerprint
go run h3_fingerprint.go

# Test sing-box configuration after generation
.npm/sing-box check -c .npm/config.json
```

## Key Technical Details

### Port Configuration

- Ports can be shared between protocols (TCP/UDP)
- Default environment variables in index.js: REALITY_PORT=20143, HY2_PORT=20143
- TUIC requires empty port to disable if not needed

### Certificate Management

- Self-signed certificates hardcoded for systems without OpenSSL
- OpenSSL-generated certificates use "www.bing.com" as CN
- Certificates stored with 600 permissions in .npm/ directory
- SHA256 fingerprint extraction for Hysteria2 pinning

### UUID and Key Persistence

- UUID generated once and persisted in .npm/uuid.txt
- Reality keypair generated once and persisted in .npm/key.txt
- Both files have 600 permissions for security

### VLESS Key Management

- VLESS keys generated using xray-core's vlessenc command
- ML-KEM-768 Post-Quantum encryption for forward secrecy
- Keys cached in cache.json for persistence across restarts
- xhttp_path randomly generated (50 chars, a-z0-9) for obfuscation
- If cache.json exists, keys are reused instead of regenerated
- Delete cache.json to force regeneration of all keys

### Architecture Detection and Downloads

- Automatic detection of ARM64, AMD64, and S390x architectures
- Downloads sing-box from architecture-specific URLs
- Files downloaded with random names for security

### Daily Restart Mechanism

- Automatic restart at 00:03 Beijing time (UTC+8)
- Kills and restarts sing-box process
- Designed to clear cache and maintain stability

### Subscription Generation

- Generates client configuration URLs for all enabled protocols
- Base64-encoded subscription saved to .npm/sub.txt
- Includes ISP information and protocol identifiers

## Security Considerations

1. **Hardcoded Credentials** - warp.sh contains hardcoded WARP credentials
2. **Permission Management** - Sensitive files use 600 permissions
3. **TLS Configuration** - Self-signed certificates with InsecureSkipVerify
4. **Process Management** - Proper PID tracking for graceful restarts

## Deployment Notes

- Designed for low-memory environments (128MB+ RAM)
- Not recommended for 64MB environments (like freecloudpanel)
- Requires outbound internet access for downloads
- Persistent storage required for .npm directory
- Bash environment required for script execution

## Troubleshooting

### Common Issues

1. **Download Failures** - Check internet connectivity and CDN availability
2. **Permission Errors** - Ensure script has execute permissions
3. **Port Conflicts** - Verify ports are not in use by other services
4. **Memory Issues** - Monitor RAM usage on low-memory systems

### Debug Commands

```bash
# Check sing-box process
ps aux | grep sing-box

# View generated configuration
cat .npm/config.json

# Check subscription URLs
cat .npm/list.txt

# Test individual protocols
curl -v --http3 https://[IP]:[PORT]
```
