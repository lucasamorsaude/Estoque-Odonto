import http.server
import socketserver

PORT = 8000

handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(("", PORT), handler) as httpd:
    print(f"Servidor rodando em http://localhost:{PORT}")
    httpd.serve_forever()