"""Local test page for the 3D card without Home Assistant: python3 tests/harness/serve.py [port], then open
http://localhost:8765/?fixture=x2d&state=printing (fixture = tests/golden/<name>.json; state = printing | idle |
offline | paused | finished; optional mesh=<key>, profile=<key>, volume=x,y,z to try a variant, fitted=laser,... for accessories, laser=1 for a laser job). Bundle first (python3 deploy.py --bundle). Serves this folder, the bundled card under
/fabricon_static/ and the golden files / registry fixtures under /golden/ and /fixtures/."""
import functools
import http.server
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
MAP = {"/fabricon_static/": os.path.join(ROOT, "custom_components", "fabricon", "frontend"),
       "/golden/": os.path.join(ROOT, "tests", "golden"), "/fixtures/": os.path.join(ROOT, "tests", "fixtures")}


class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        path = path.split("?", 1)[0]
        for pre, d in MAP.items():
            if path.startswith(pre):
                return os.path.join(d, path[len(pre):])
        return super().translate_path(path)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    http.server.ThreadingHTTPServer(("", port), functools.partial(Handler, directory=HERE)).serve_forever()
