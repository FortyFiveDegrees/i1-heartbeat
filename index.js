const express = require("express")
const handlers = require('./handlers')
const path = require("path")
const configuration = require("./config.json")
const app = new express()

// Start the loop- run the LDL for the first time and schedule heartbeat.
setTimeout(handlers.runLdl, 5000)
handlers.scheduleHeartbeat()

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "web", "index.html"))
})

app.get("/font.ttf", (req, res) => {
    res.sendFile(path.join(__dirname, "web", "font.ttf"))
})

app.get("/cues.json", (req, res) => {
    res.sendFile(path.join(__dirname, "cues.json"))
})
handlers.log("i1 Heartbeat started", false, true)
handlers.log(`Heartbeat web panel running on http://127.0.0.1:${configuration.port}`)
handlers.log("Thanks for using i1 Heartbeat!")
app.use("/api", require("./api.js"))

app.listen(configuration.port)