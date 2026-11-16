/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const {
  existsSync
} = require("fs-extra"), {
  resolve,
  join
} = require("path"), http = require("http"), connect = require("connect"), morgan = require("morgan"), serveStatic = require("serve-static"), serveIndex = require("serve-index"), open = require("open"), chalk = require("chalk"), logger = require("./logger"), {
  D2_VERSION,
  HOST,
  PORT,
  SHUTDOWN_SECRET
} = require("./constants");

const DOC_ROOT = "docs/", DEFAULT_DOC_HOME = `d2sv-sdk/${D2_VERSION}/`, url = `http://${HOST}:${PORT}`, homeUrl = `http://${HOST}:${PORT}/${DEFAULT_DOC_HOME}`, staticHandler = serveStatic(DOC_ROOT, {
  etag: false
}), indexHandler = serveIndex(DOC_ROOT);

const server = connect().use(morgan("dev", {
  stream: {
    write: text => {
      logger.debug(text);
    }
  }
})).use((req, res, next) => {
  staticHandler(req, res, () => {
    if (req.url.startsWith(`/${DEFAULT_DOC_HOME}`) && !req.url.endsWith(`${DEFAULT_DOC_HOME}`)) {
      const possibleFileName = `${req.url}.html`;
      const posssibleFilePath = resolve(join(DOC_ROOT, possibleFileName));
      if (existsSync(posssibleFilePath)) {
        req.url = possibleFileName;
        return staticHandler(req, res, next);
      }
      req.url = `/${DEFAULT_DOC_HOME}`;
      return staticHandler(req, res, next);
    }
    indexHandler(req, res, next);
  });
  if (req.method === "GET" && req.url === "/shutdown") {
    const authHeader = req.headers["authorization"];
    if (authHeader !== SHUTDOWN_SECRET) {
      res.writeHead(403, {
        "Content-Type": "text/plain"
      });
      return res.end("Forbidden\n");
    }
    res.writeHead(200, {
      "Content-Type": "text/plain"
    });
    res.end("Documentation server is shutting down...\n", () => {
      console.log("Shutdown request received, closing server...");
      server.close(() => {
        console.log("Documentation server closed.");
        process.exit(0);
      });
    });
  }
});

(async () => {
  console.log(`Starting documentation server at ${chalk.green(url)}`);
  http.createServer(server).listen(PORT, HOST);
  await open(homeUrl);
})();