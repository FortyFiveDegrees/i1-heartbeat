const fs = require("fs")
const path = require("path")
const configuration = require('./hb.json')
const package = require('./package.json')

const debug = log

const { Client } = require('ssh2');

const conn = new Client();
let shellStream = null;
let sshConnected = false;

function connectSSH() {
  conn.on('ready', () => {
    console.log('SSH connection established.');

    conn.shell((err, stream) => {
      if (err) throw err;

      shellStream = stream;
      sshConnected = true;

      stream.on('close', () => {
        console.log('SSH stream closed');
        sshConnected = false;
        conn.end();
      }).on('data', (data) => {

        if (data.toString().includes('Password:')) {
          stream.write('i1\n');
        }
      });

      stream.write('su -l dgadmin\n');
    });

  }).connect({
    host: '192.168.0.226',
    port: 22,
    username: 'root',
    password: 'i1',
    algorithms: {
      kex: [
        'diffie-hellman-group-exchange-sha1',
        'diffie-hellman-group1-sha1'
      ],
      serverHostKey: ['ssh-rsa', 'ssh-dss'],
      cipher: [
        'aes256-cbc',
        'aes192-cbc',
        'aes128-cbc',
        '3des-cbc'
      ]
    }
  });
}

function sendCommand(command) {
    if(!sshConnected) {
        connectSSH();
    }
  if (!shellStream) {
    console.log('SSH session not ready yet.');
    return;
  }
  debug(`Sending command: ${command}`)
  shellStream.write(command + '\n');
}

connectSSH();

function runLdl() {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, "hb.json")))
    //sendCommand(`load local ${config.heartbeat.ldlFlavor}`)
    setTimeout(() => {
        //sendCommand("run local")
    }, 5000);
}

function heartbeat(force) {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, "hb.json")))
    if((config.heartbeat.enabled == true) || (force == true)) {
        sendCommand(`load local ${config.heartbeat.lf}`)
        log("Playlist handled successfully.")
        setTimeout(() => {
            sendCommand("run local")
            return true;
        }, 5000);
        if(config.heartbeat.lfDuration) {
            setTimeout(() => {
                runLdl()
            }, ((config.heartbeat.lfDuration * 1000) - 5000));
        }
    } else {
        log("Didn't run playlist at heartbeat time due to heartbeat being disabled.")
        return false;
    }
}
let nextRunTime = null;
let heartbeatInterval;
function calculateNextRunTime(startOn, every) {
    const currentTime = new Date();
    const currentMinute = currentTime.getMinutes();
    let nextMinute;
  
    if (currentMinute < startOn) {
        nextMinute = startOn;
    } else {
        const minutesSinceStartOn = (currentMinute - startOn + 60) % every;
        nextMinute = currentMinute + every - minutesSinceStartOn;
  
        if (nextMinute >= 60) {
            nextMinute -= 60;
        }
    }
  
    const nextRunDate = new Date(currentTime);
    nextRunDate.setMinutes(nextMinute);
    nextRunDate.setSeconds(0);
  
    if (nextRunDate <= currentTime) {
        nextRunDate.setHours(nextRunDate.getHours() + 1);
    }
    console.log(nextRunDate)
    return nextRunDate;
}
  
function scheduleHeartbeat() {
    let heartbeatData = JSON.parse(fs.readFileSync(path.join(__dirname, "hb.json"))).heartbeat;
    const { enabled, runOn } = heartbeatData;
    
    if (!enabled) {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
        return;
    }
  
    const currentTime = new Date();
  
    if (nextRunTime === null) {
        nextRunTime = calculateNextRunTime(runOn.startOn, runOn.every);
    }
  
    if (currentTime >= nextRunTime) {
        heartbeatData = JSON.parse(fs.readFileSync(path.join(__dirname, "hb.json")));
        heartbeat(false);
        nextRunTime = new Date(nextRunTime.getTime() + (runOn.every * 60 * 1000));
    }
  
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
  
    const timeUntilNextCheck = nextRunTime - currentTime;
    heartbeatInterval = setTimeout(() => scheduleHeartbeat(), timeUntilNextCheck);
}

let forceDebug = false

function centerText(text, width = 50) {
    const spaces = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(spaces) + text + ' '.repeat(spaces);
}
const logs = []
function log(message, forceDebugEnable, onBoot) {
    const configuration = require("./hb.json")
    if(forceDebugEnable == true) { forceDebugMode() };
    if(onBoot == true) {
        const width = 50;
        console.clear()
        console.log(centerText('##########################################', width));
        console.log(centerText(`i1 Heartbeat v${package.version}`, width));
        console.log(centerText(`Today is ${new Date().toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}`, width));
        console.log(centerText(`The time is ${new Date().toLocaleString('en-US', {
            hour12: true,
            hour: 'numeric',
            minute: 'numeric'
        })}`, width));
        const port = configuration.port || 9092;
        console.log(centerText(`View at: http://localhost:${port}`, width));
        console.log(centerText(`##########################################`, width));
        console.log(centerText(`Made by Dalk`, width));
        console.log(centerText(`Built for IntelliStar 1`, width));
        console.log(centerText(`##########################################`, width));
        const debugtxt = path.join(__dirname, "debug.txt")
        if(!fs.existsSync(debugtxt)) {
            fs.writeFileSync(debugtxt, ("utf-8", "First write to Debug logs"))
        } else {
            const current = fs.readFileSync(debugtxt, "utf-8")
            const toWrite = `${current}\n-- STARTED DEBUGGING AT ${new Date().toLocaleString()} --`
            fs.writeFileSync(debugtxt, ("utf-8", toWrite))
        }
    }
    if(configuration.debugger || forceDebug) {
        console.log(`i1 Heartbeat (v${package.version}) Debugger | ${new Date().toLocaleString()} | ${message}`)

        const debugtxt = path.join(__dirname, "debug.txt")
        if(!fs.existsSync(debugtxt)) {
            fs.writeFileSync(debugtxt, ("utf-8", "First write to Debug logs"))
        } else {
            const current = fs.readFileSync(debugtxt, "utf-8")
            const toWrite = `${current}\ni1 Heartbeat (v${package.version}) Debugger | ${new Date().toLocaleString()} | ${message}`
            fs.writeFileSync(debugtxt, ("utf-8", toWrite))
        }
        return true
    } else {
        return false
    }
}

function forceDebugMode() {
    forceDebug = true
}

module.exports = {runLdl, scheduleHeartbeat, heartbeat, log, sendCommand, connectSSH}