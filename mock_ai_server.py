#!/usr/bin/env python3
"""
Lightweight Mock AI Summary Server for Local Testing
Zero external dependencies required (uses standard library http.server).

Usage:
    python3 mock_ai_server.py
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import sys

HOST = "0.0.0.0"
PORT = 5000

class MockAiHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/api/summarize":
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length).decode("utf-8")
            
            print(f"\n[AI-Server] Received POST request on /api/summarize")
            try:
                data = json.loads(post_body)
                obj_id = data.get("objectId", "Unknown ID")
                obj_name = data.get("objectName", "Unknown Document")
                content = data.get("content", "")
                print(f"[AI-Server] Document Name : {obj_name}")
                print(f"[AI-Server] Document ID   : {obj_id}")
                print(f"[AI-Server] Content Size  : {len(content)} characters")
            except Exception as e:
                print(f"[AI-Server] Could not parse JSON body: {e}")
                obj_name = "Document"
                obj_id = "N/A"
                content = post_body

            # Realistic mock AI response
            summary_response = {
                "status": "success",
                "objectId": obj_id,
                "objectName": obj_name,
                "summary": (
                    f"### Executive Summary for {obj_name}\n\n"
                    f"1. **Core Purpose:** This document defines the primary requirements, standard operational protocols, "
                    f"and service delivery metrics for the organization.\n\n"
                    f"2. **Key Findings:**\n"
                    f"   • Document identifier validated: `{obj_id}`.\n"
                    f"   • Content payload processed: {len(content)} characters analyzed.\n"
                    f"   • Compliance and regulatory verification passed.\n\n"
                    f"3. **Conclusion & Recommendation:**\n"
                    f"   Proceed with standard operational workflows and archive under Documentum compliance repository."
                )
            }

            response_bytes = json.dumps(summary_response).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(response_bytes)))
            self.end_headers()
            self.wfile.write(response_bytes)
            print(f"[AI-Server] Dispatched 200 OK AI summary response.")
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"Mock AI Summary Server is running on port 5000.")

def main():
    server = HTTPServer((HOST, PORT), MockAiHandler)
    print(f"==================================================")
    print(f"  Mock AI Summary Server running on http://localhost:{PORT}")
    print(f"  POST endpoint: http://localhost:{PORT}/api/summarize")
    print(f"  Press Ctrl+C to stop.")
    print(f"==================================================")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Mock AI Server...")
        server.server_close()
        sys.exit(0)

if __name__ == "__main__":
    main()
