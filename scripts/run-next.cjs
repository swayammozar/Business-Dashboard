require("./no-realpath.cjs");
const path = require("path");

const shim = path.join(__dirname, "no-realpath.cjs");
const existing = process.env.NODE_OPTIONS || "";
const requiredOptions = [`--preserve-symlinks`, `--preserve-symlinks-main`, `--require=${shim}`];

process.env.NODE_OPTIONS = [...requiredOptions, existing].filter(Boolean).join(" ");

require("../node_modules/next/dist/bin/next");
