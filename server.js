const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const db = new sqlite3.Database("chat.db");

app.use(express.json());
app.use(express.static("public"));

db.run(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room TEXT,
  username TEXT,
  text TEXT,
  timestamp TEXT
)`);

app.get("/api/messages/:room", (req,res)=>{
  db.all("SELECT * FROM messages WHERE room=? ORDER BY id ASC",[req.params.room],(e,r)=>res.json(r));
});

app.post("/api/messages",(req,res)=>{
  const {room,username,text,timestamp}=req.body;
  db.run("INSERT INTO messages(room,username,text,timestamp) VALUES(?,?,?,?)",[room,username,text,timestamp]);
  res.json({ok:true});
});

app.listen(process.env.PORT||3000);