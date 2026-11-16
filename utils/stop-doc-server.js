/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
const http = require("http"), {
  HOST,
  PORT,
  SHUTDOWN_SECRET
} = require("./constants");

const options = {
  hostname: HOST,
  port: PORT,
  path: "/shutdown",
  method: "GET",
  headers: {
    Authorization: SHUTDOWN_SECRET
  }
};

const req = http.request(options, res => {
  res.on("data", chunk => {
    console.log(`BODY: ${chunk}`);
  });
  res.on("end", () => {
    console.log("No more data in response. Shutting down the Documentation server");
  });
});

req.on("error", e => {
  console.error(`Problem with stop server request: ${e.message}`);
});

req.end();