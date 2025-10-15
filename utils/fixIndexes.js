const mongoose = require("mongoose");

async function dropRoutingNumberUniqueIndexIfExists() {
  try {
    const conn = mongoose.connection;
    const collections = await conn.db
      .listCollections({ name: "authusers" })
      .toArray();
    if (collections.length === 0) return; // collection not created yet

    const indexes = await conn.db.collection("authusers").indexes();
    const routingIdx = indexes.find((idx) => idx.name === "routingNumber_1");
    if (routingIdx) {
      await conn.db.collection("authusers").dropIndex("routingNumber_1");
      console.log("🧹 Dropped routingNumber_1 index (it must not be unique)");
    }
  } catch (error) {
    console.warn("⚠️ Could not drop routingNumber_1 index:", error.message);
  }
}

module.exports = { dropRoutingNumberUniqueIndexIfExists };
