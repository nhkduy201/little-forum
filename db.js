var low = require("lowdb");
var FileSync = require("lowdb/adapters/FileSync");

var adapter = new FileSync("db.json");
var db = low(adapter);

// Set some defaults (required if your JSON file is empty)
db.defaults({ users: [], products: [] }).write();
module.exports = db;

// "name": "Duy",
// "phone": "0111222333",
// "age": "18",
// "email": "****@gmail.com",
// "password": "$2b$10$gg89tP11kjSkoMxLmvBTv.L.lYZy30f8O1Q1NrZMSTufVrgojM3HW",
// "id": "n7GoWV8Ea",
// "avatar": "uploads/avatar-1592711165869.jpeg"

// "id": "e0111037-3835-4480-ab03-da20660752b3",
// "name": "Lemur, ring-tailed",
// "image": "https://picsum.photos/seed/picsum/300/200",
// "description": "consequat dui nec nisi volutpat eleifend donec ut dolor",
// "price": 159
