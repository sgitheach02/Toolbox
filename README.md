# PACHA Security Toolbox

A comprehensive penetration testing platform with a modern web interface.

[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://www.docker.com/)
[![License](https://img.shields.io/badge/license-educational-orange)](LICENSE)
[![Status](https://img.shields.io/badge/status-stable-green)](https://github.com)

## Overview

PACHA Security Toolbox integrates popular penetration testing tools into a unified web platform. It provides a React.js frontend with a Flask API backend, offering asynchronous scan execution, persistent data storage, and comprehensive reporting capabilities.

## Quick Start

```bash
git clone <repository-url>
cd pacha-toolbox
docker-compose up -d
```

Access the application at `http://localhost:3000`

**Default credentials:**
- Username: `admin` / Password: `admin123`
- Username: `user` / Password: `user123`

## Architecture

```
Frontend (React)     Backend (Flask)      Security Tools
     :3000       ←→       :5000        ←→    nmap, nikto,
                                            hydra, metasploit,
                                            tcpdump
```

## Features

### Integrated Tools

| Tool | Purpose | Scan Types |
|------|---------|------------|
| **Nmap** | Network discovery | Quick, Basic, Intense, Comprehensive |
| **Nikto** | Web vulnerability scanning | Quick, Basic, Comprehensive |
| **Hydra** | Password brute force | Patterns, Wordlist, Auto-guess, Combo |
| **Metasploit** | Exploitation framework | Web, Windows, Linux exploits |
| **tcpdump** | Network packet capture | Time-based, Count-based, Continuous |

### Key Capabilities

- **Asynchronous Execution**: All scans run in background threads
- **Persistent Storage**: Automatic save of all scan results and configurations
- **Multiple Export Formats**: Text reports, HTML reports, PCAP files
- **Real-time Updates**: Live status polling and progress tracking
- **Interactive Sessions**: Simulated Metasploit shell interactions
- **JWT Authentication**: Secure user management and session handling

## Installation

### Prerequisites

- Docker and Docker Compose
- 8GB RAM minimum
- 10GB disk space
- Ports 3000 and 5000 available

### Deployment

1. **Clone and start:**
   ```bash
   git clone <repository-url>
   cd pacha-toolbox
   docker-compose up -d
   ```

2. **Verify deployment:**
   ```bash
   docker-compose ps
   curl http://localhost:5000/api/health
   ```

3. **Access application:**
   - Web UI: http://localhost:3000
   - API: http://localhost:5000

### Configuration

Create `.env` file:

```env
# Backend
FLASK_DEBUG=0
JWT_SECRET_KEY=your-secret-key
HOST=0.0.0.0
PORT=5000

# Frontend
REACT_APP_API_URL=http://localhost:5000
CORS_ORIGINS=http://localhost:3000
```

## API Reference

### Authentication

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Scan Operations

```http
# Start Nmap scan
POST /api/scan/nmap
{
  "target": "scanme.nmap.org",
  "scanType": "basic"
}

# Start Hydra attack
POST /api/scan/hydra
{
  "target": "192.168.1.100",
  "service": "ssh",
  "username": "admin",
  "attack_mode": "patterns"
}

# Start tcpdump capture
POST /api/scan/tcpdump
{
  "interface": "eth0",
  "capture_mode": "time",
  "duration": 300
}
```

### Result Management

```http
# Get scan status
GET /api/scan/status/{task_id}

# Download results
GET /api/scan/download/{task_id}
GET /api/scan/download/{task_id}/pcap

# Generate HTML report
POST /api/scan/report/{task_id}

# Get scan history
GET /api/scan/history
```

## Data Persistence

### File Structure

```
./data/
├── downloads/          # Generated reports
│   └── {task_id}/
│       ├── report.txt
│       └── report.html
├── pcap/              # Network captures
├── logs/              # Application logs
└── task_status.json  # Persistent task state
```

### Storage Features

- **Automatic backup** of scan configurations
- **Result persistence** across container restarts
- **File download management** with multiple formats
- **Task history** with full traceability

## Security Tools Configuration

### Nmap Scans

| Type | Command Options | Duration |
|------|----------------|----------|
| Quick | `-T4 -F --top-ports 100` | ~2 min |
| Basic | `-sV -sC -T4` | ~5 min |
| Intense | `-sV -sC -A -T4` | ~10 min |
| Comprehensive | `-sS -sV -sC -A -T4 -p-` | ~30 min |

### Hydra Attack Modes

- **Patterns**: Username variations (user:user, user:user123, etc.)
- **Wordlist**: Dictionary-based attacks with common passwords
- **Auto-guess**: Hydra's intelligent guessing
- **Combo**: Combined patterns and wordlist approach

### Metasploit Categories

- **Web Exploits**: Struts, Apache, PHP vulnerabilities
- **Windows Exploits**: EternalBlue, NetAPI, DCOM
- **Linux Exploits**: VSFTPD, Samba, IRC backdoors

## Development

### Local Development

```bash
# Backend development
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

# Frontend development
cd frontend
npm install
npm start
```

### Building Images

```bash
# Build specific service
docker-compose build pacha-backend
docker-compose build pacha-frontend

# Build all services
docker-compose build
```

## Troubleshooting

### Common Issues

**Containers won't start:**
```bash
docker-compose logs -f
docker-compose down && docker-compose up -d
```

**Missing security tools:**
```bash
docker exec -it pacha-backend bash
which nmap nikto tcpdump
```

**Port conflicts:**
```bash
netstat -tlnp | grep -E '(3000|5000)'
```

**Permission errors:**
```bash
sudo chown -R $USER:$USER ./data
chmod -R 755 ./data
```

### Health Checks

```bash
# API health
curl http://localhost:5000/api/health

# Task statistics
curl http://localhost:5000/api/debug/tasks

# Container status
docker-compose ps
```

## Legal Notice

**⚠️ IMPORTANT: This tool is for authorized testing only.**

### Permitted Use
- Testing on systems you own
- Authorized penetration testing with written permission
- Educational and research purposes
- Security auditing with proper authorization

### Prohibited Use
- Testing systems without explicit permission
- Any malicious or illegal activities
- Violating privacy or terms of service
- Disrupting services or networks

**Users are solely responsible for compliance with applicable laws and regulations.**

## Project Structure

```
pacha-toolbox/
├── frontend/                # React.js application
│   ├── src/
│   │   ├── App.js
│   │   └── components/
│   ├── Dockerfile
│   └── package.json
├── backend/                 # Flask API server
│   ├── main.py
│   ├── data/               # Persistent storage
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml      # Container orchestration
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## Support

- **Issues**: GitHub Issues for bug reports
- **Documentation**: Check the `/docs` directory
- **Security**: Report vulnerabilities privately

## License

Educational use only. See LICENSE file for details.

---

**PACHA Security Toolbox** - Professional penetration testing made accessible.
