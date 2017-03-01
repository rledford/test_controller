const MAX_TIMEOUT = 5000;//5 seconds

var SerialPort = require('serialport'),
    ser = null,
    lastReceived = "No GPS data received",
    lastReceivedTime = Date.now(),
    configFilePath = process.cwd()+'/config/bb.config.json';
    config = {};

var fs = require('fs');

loadConfig = () => {
  try {
    config = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
  } catch (e) {
    console.log(e);
    config = {}
  }
};

saveConfig = () => {
  try {
    fs.writeFileSync(configFilePath, JSON.stringify(config), {encoding: 'utf-8'});
    console.log('Configuration saved.');
  } catch (e) {
    console.log(e);
  }
}

exports.init = () => {
  console.log('initializing port');
  loadConfig();
  ser = new SerialPort(config.serial.port,
  {
    baudRate: Number(config.serial.baudrate),
    parser: SerialPort.parsers.readline('\n')
  });

  ser.on('data', (data) => {
    lastReceived = data;
    lastReceivedTime = Date.now();
  });
};

exports.updateConfig = (req, res) => {
  console.log(req.body);
  const {baudrate,frequency,target,url,channel,apiKey,vin} = req.body;
  config.serial.baudrate = baudrate;
  config.api.frequency = frequency;
  config.api.target = target;
  config.api.url = url;
  config.api.vin = vin;
  if (target === 'thingspeak') {
    config.api.channel = channel;
    config.api.key = apiKey;
  }
  saveConfig();
  if (ser && ser.isOpen()) {
    ser.update({baudRate: Number(baudrate)},
    (err) => {
      res.redirect('/');
    });
  }
};

exports.getConfig = () => {
  return config;
};

exports.readConfig = (req, res) => {
  res.json(getConfig());
};

exports.lastReceived = (req, res) => {
  if (Date.now() - lastReceivedTime > MAX_TIMEOUT) {
    res.send("No GPS data received.")
  } else {
    res.send(lastReceived);
  }
};

exports.isOpen = (req, res) => {
  return ser && ser.isOpen();
};

