const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const Database = require("better-sqlite3")
const multer = require("multer")

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static("public"))
app.use(express.json())

const db = new Database("chat.db")
db.prepare("CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT, room TEXT, user TEXT, type TEXT, content TEXT, time TEXT)").run()

const upload = multer({ dest: "public/uploads" })
app.post("/upload", upload.single("image"), (req, res) => res.json({ path: "/uploads/" + req.file.filename }))

let rooms = {}
let votes = {}

io.on("connection", s => {
    s.on("join", d => {
        s.user = d.user
        s.room = d.room
        rooms[d.room] = rooms[d.room] || {}
        rooms[d.room][s.id] = d.user
        s.join(d.room)
        io.to(d.room).emit("users", Object.values(rooms[d.room]))
        const rows = db.prepare("SELECT * FROM messages WHERE room=?").all(d.room)
        s.emit("history", rows)
    })

    s.on("msg", m => {
        db.prepare("INSERT INTO messages(room,user,type,content,time) VALUES(?,?,?,?,?)")
          .run(m.room, m.user, m.type, m.content, new Date().toLocaleString())
        io.to(m.room).emit("msg", m)
    })

    s.on("votekick", target => {
        votes[s.room] = votes[s.room] || {}
        votes[s.room][target] = votes[s.room][target] || {}
        votes[s.room][target][s.id] = true
        const total = Object.keys(rooms[s.room]).length
        const yes = Object.keys(votes[s.room][target]).length
        if (yes / total >= 0.6) {
            for (const id in rooms[s.room]) {
                if (rooms[s.room][id] === target) io.sockets.sockets.get(id)?.disconnect()
            }
            io.to(s.room).emit("system", target + " è stato espulso")
            delete votes[s.room][target]
        }
    })

    s.on("disconnect", () => {
        if (s.room && rooms[s.room]) {
            delete rooms[s.room][s.id]
            io.to(s.room).emit("users", Object.values(rooms[s.room]))
        }
    })
})

const PORT = process.env.PORT || 3000
server.listen(PORT)
