# Dentis - Technical Architecture Blueprint (Mirror)

This document mirrors the exact technical configuration, database schemas, and API endpoints of the Dentis SaaS ecosystem.

## 1. Directory Structure (Hetzner Host `/root/dentis`)
```text
dentis/
├── .env               # Database & OpenRouter API Keys
├── package.json       # Dependencies (Express, Supabase, ws, Cors)
├── server.js          # Core Node.js Web Server (Port 4000)
└── public/
    └── config.html    # Client configuration dashboard
