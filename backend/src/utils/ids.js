const mongoose = require("mongoose");

const isId = (id) => mongoose.Types.ObjectId.isValid(id);
const sameId = (a, b) => a != null && b != null && a.toString() === b.toString();

module.exports = { isId, sameId };
