# COBOL Guestbook Adapter

A small Express API that integrates with a legacy COBOL CGI application.

## What it demonstrates

- Express HTTP server
- Outbound HTTP requests with Axios
- application/x-www-form-urlencoded requests
- HTML parsing with Cheerio
- Translating legacy HTML responses into JSON
- Translating JSON requests into legacy form data
- Basic error handling

## Architecture

Postman
   ↓ JSON
Express
   ↓ Axios
COBOL CGI application
   ↓ HTML
Cheerio
   ↓
JSON

## Endpoints

GET /cgi
POST /cgi

## Example POST

...
