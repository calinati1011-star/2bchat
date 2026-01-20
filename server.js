<<<<<<< HEAD
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
=======
const express=require("express")
const http=require("http")
const {Server}=require("socket.io")
const sqlite3=require("sqlite3").verbose()
const multer=require("multer")

const app=express()
const server=http.createServer(app)
const io=new Server(server)

app.use(express.static("public"))
app.use(express.json())

const db=new sqlite3.Database("chat.db")
db.run("CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY,room TEXT,user TEXT,type TEXT,content TEXT,time TEXT)")

const upload=multer({dest:"public/uploads"})
app.post("/upload",upload.single("image"),(req,res)=>res.json({path:"/uploads/"+req.file.filename}))

let rooms={}
let votes={}

io.on("connection",s=>{
s.on("join",d=>{
s.user=d.user
s.room=d.room
rooms[d.room]=rooms[d.room]||{}
rooms[d.room][s.id]=d.user
s.join(d.room)
io.to(d.room).emit("users",Object.values(rooms[d.room]))
db.all("SELECT * FROM messages WHERE room=?",[d.room],(e,r)=>s.emit("history",r))
})

s.on("msg",m=>{
db.run("INSERT INTO messages(room,user,type,content,time) VALUES(?,?,?,?,?)",[m.room,m.user,m.type,m.content,new Date().toLocaleString()])
io.to(m.room).emit("msg",m)
})

s.on("votekick",t=>{
votes[s.room]=votes[s.room]||{}
votes[s.room][t]=votes[s.room][t]||{}
votes[s.room][t][s.id]=true
const total=Object.keys(rooms[s.room]).length
const yes=Object.keys(votes[s.room][t]).length
if(yes/total>=0.6){
for(const id in rooms[s.room]){
if(rooms[s.room][id]==t)io.sockets.sockets.get(id)?.disconnect()
}
io.to(s.room).emit("system",t+" espulso")
delete votes[s.room][t]
}
})

s.on("disconnect",()=>{
if(s.room&&rooms[s.room]){
delete rooms[s.room][s.id]
io.to(s.room).emit("users",Object.values(rooms[s.room]))
}
})
})

server.listen(process.env.PORT||3000)
>>>>>>> e9de0cd (Initial commit - 2B Community Chat)
