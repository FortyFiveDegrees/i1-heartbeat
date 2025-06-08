const express = require("express")
const path = require("path")
const fs = require("fs")
const handlers = require("./handlers")
const configuration = require("./config.json")
const app = new express()

app.get("/playlist/run/:flavor", async (req, res) => {
    const {flavor} = req.params
    handlers.sendCommand(`load local ${flavor}`)
    setTimeout(async () => {
        handlers.sendCommand("run local")
        res.send("Ran playlist!")
    }, 5 * 1000);
})

app.get("/playlist/force", (req, res) => {
    handlers.heartbeat(true)
    res.send("Forcing a heartbeat!")
})

app.get("/playlist/config", (req, res) => {
    res.json(JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf-8")))
})

// im gonna be so fr i just stole this from the old heartbeat source
app.get('/heartbeat/post/:setting/:value', (req, res) => {
    const validSettings = ["flavor","duration","heartbeatEnabled","heartbeatOn","flavorLdl","background","flavorSidebar","sidebarEnabled","heartbeatEvery"]
    const numbers = ["0","1","2","3","4","5","6","7","8","9"]
    if(validSettings.includes(req.params.setting)) {
        let newValue = req.params.value
        if(newValue == "true") {
            newValue = Boolean(true)
        }
        if(newValue == "false") {
            newValue = Boolean(false)
        }
        if(numbers.includes(String(newValue).slice(0,1))) {
            newValue = Number(newValue)
        }
        const heartbeatInfo = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json")))
        if(req.params.setting == "flavor") {heartbeatInfo.heartbeat.lf = newValue}
        if(req.params.setting == "flavorLdl") {heartbeatInfo.heartbeat.ldlFlavor = newValue}
        if(req.params.setting == "heartbeatOn") {heartbeatInfo.heartbeat.runOn.startOn = newValue}
        if(req.params.setting == "heartbeatEvery") {heartbeatInfo.heartbeat.runOn.every = newValue}
        fs.writeFileSync(path.join(__dirname, "config.json"), JSON.stringify(heartbeatInfo, null, 2))
        res.send(`Successfully set ${req.params.setting} to ${newValue} in heartbeat settings. Please wait for the next cycle for the adjustment to take place.`)
    } else {
        res.status(404).send(`Invalid setting.`)
        functions.debug("User attempted to input incorrect heartbeat setting")
    }
})


handlers.log(`Heartbeat API running on http://127.0.0.1:${configuration.port}/api`)

module.exports = app