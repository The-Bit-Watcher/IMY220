// Loads backend/.env once. Required first by server.js and the seed script.
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env"), quiet: true });
