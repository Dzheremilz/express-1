const express = require("express");
const app = express();
const fsPromises = require("fs/promises");
const { exec } = require("child_process");
const { ethers } = require("ethers");

const IP_LOOPBACK = "localhost";
const IP_LOCAL = "172.31.103.30"; // my local ip on my network
const PORT = 3333;

const LOG_FILE = "access-log.txt";

const PROVIDER = new ethers.providers.InfuraProvider(4); // 4 = network rinkeby

// async file logger
const logger = async (req) => {
  try {
    const date = new Date();
    const log = `${date.toUTCString()} ${req.method} "${
      req.originalUrl
    }" from ${req.ip} ${req.headers["user-agent"]}\n`;
    await fsPromises.appendFile(LOG_FILE, log, "utf-8");
  } catch (e) {
    console.error(`Error: can't write in ${LOG_FILE}`);
  }
};

// show on console
const shower = async (req) => {
  const date = new Date();
  const log = `${date.toUTCString()} ${req.method} "${req.originalUrl}" from ${
    req.ip
  } ${req.headers["user-agent"]}`;
  console.log(log);
};

// balance function
const getBalance = async (address) => {
  const balance = await PROVIDER.getBalance(address);
  return ethers.utils.formatEther(balance);
};

// GET sur la racine
app.get(
  "/",
  (req, res, next) => {
    console.log(`from ${req.ip} access ${req.originalUrl}`);
    next();
  },
  (req, res) => {
    //nous recupérons l'ip source de la requête
    res.send(`Welcome ${req.ip} to my first express app.`);
  }
);

// POST sur la racine
app.post("/", (req, res) => {
  res.send("Sorry we don't post requests yet.");
});

// GET sur '/hello'
app.get("/hello", (req, res) => {
  res.send("Hello World!");
});

// GET sur '/hello/:name'
// log at access-log.txt
app.get(
  "/hello/:name",
  async (req, res, next) => {
    await logger(req);
    next();
  },
  (req, res, next) => {
    shower(req);
    next();
  },
  (req, res) => {
    const name = req.params.name;
    res.send(`Hello ${name[0].toUpperCase() + name.substring(1)}!`);
  }
);

// route path match acd and abcd
app.get("/ab?cd", (req, res) => {
  res.send("ab?cd");
});

// API planet
app.get(
  "/planet/:planetId",
  (req, res, next) => {
    console.log(`from ${req.ip} access ${req.originalUrl}`);
    next();
  },
  (req, res) => {
    const planet = req.params.planetId;
    res.send(`Planet id: ${planet}, ip: ${req.ip}`);
  }
);

// Route commande exemple : '/cmd/ls', '/cmd/ls -la ..', '/cmd/pwd'
app.get(
  "/cmd/:cmd",
  async (req, res, next) => {
    await logger(req);
    next();
  },
  (req, res, next) => {
    shower(req);
    next();
  },
  (req, res) => {
    exec(`${req.params.cmd}`, (error, stdout, stderr) => {
      if (error) {
        res.send(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        res.send(`stderr: ${stderr}`);
        return;
      }
      res.send(`stdout: ${stdout}`);
    });
  }
);

// ETH Balance
app.get("/balance/:address", async (req, res) => {
  if (ethers.utils.isAddress(req.params.address)) {
    const balance = await getBalance(`${req.params.address}`);
    res.send(`${balance} ETH`);
  } else {
    res.send(`${req.params.address} is not an ethereum address`);
  }
});

// start the server
app.listen(PORT, IP_LOCAL, () => {
  console.log(`Example app listening at http://${IP_LOCAL}:${PORT}`);
});
