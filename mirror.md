# Dentis - Technical Architecture Blueprint (Mirror)

This document mirrors the exact technical configuration, database schemas, and API endpoints of the Dentis SaaS ecosystem.

## 1. Directory Structure (Hetzner Host `/root/dentis`)

dentis/
├── .env               # Database & OpenRouter API Keys
├── package.json       # Dependencies (Express, Supabase, ws, Cors)
├── server.js          # Core Node.js Web Server (Port 4000)
└── public/
    └── config.html    # Client configuration dashboard

##2. API Endpoints (dentis-app.rmstudio.app)
POST /api/vapi-assistant-override: Dynamic webhook invoked by Vapi on inbound calls. Reads studio and config metadata from Supabase, checks subscription active status/trial expiry, checks out-of-hours constraints for Starter plans, and returns the customized assistant prompt and parameters.
POST /api/config-update: Updates the configuration of the dentist's assistant in Supabase.
GET /api/config-get: Retrieves the current configuration parameters for a specific studio.

##3. Database Relations (Supabase)
studi_dentistici: One-to-one relationship with dentista_agente_config and one-to-many relationship with dentista_conversazioni and dentista_servizi.

##4. Automation Hub (n8n Webhooks)
/webhook/vapi-post-call-dentist: Processes the end-of-call report from Vapi, parses the transcript via OpenAI, inserts booking records, and alerts the clinic.
/webhook/nuova-registrazione: Handles frictionless 7-day trial creations.
/webhook/dentis-scraper: Triggers an HTTP GET to scrape the clinic's website and appends the structured knowledge to Serena's prompt.
