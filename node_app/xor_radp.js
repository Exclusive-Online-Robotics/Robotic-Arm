var radpSocket = require('socket.io').listen(8000);
var SerialPort = require('serialport').SerialPort;

/* Serial port connection to the SSC-32 */
var ssc = {
  port : new SerialPort('/dev/ttyUSB0', {
    baudrate : 115200
  }),
};

ssc.port.on('open', function() {
  console.log('Serial port opened');
});

radpSocket.sockets.on('connection', function (socket) {
  //console.log(radpSocket.sockets.clients().length);
  if (radpSocket.sockets.clients().length < 2) {
  	connectController(socket);
	
    var sessionTimeoutMillis = 5*60000; /* 5 minutes */
    
    socket.emit('status', 'You are now in control! You have '
      + (sessionTimeoutMillis / 60000)
      + ' minutes to operate the arm using the sliders below.');
      
    /* Disconnect the operator when the timeout fires */
    var sessionTimeoutID = setTimeout(function() {
      socket.emit('status', 'Your time has run out. Thanks for trying the XRA!');
      socket.disconnect();
    }, sessionTimeoutMillis);
    
    /* Disable the timeout when the operator disconnects manually */
    socket.on('disconnect', function() {
      clearTimeout(sessionTimeoutID);
      
      var defaultPositionCmd = "#0 P1475 #1 P1571 #2 P530 #3 P1350 #4 P1200 T2500\r";
      ssc.port.write(defaultPositionCmd);
    });
  } else {
    socket.emit('status', 'The arm in currently in use. Please try again later');
    socket.disconnect();
  }
});

function connectController(socket) {
	/* Set arm to default position */
	var defaultPositionCmd = "#0 P1475 #1 P1571 #2 P530 #3 P1350 #4 P1200 T2500\r";
	ssc.port.write(defaultPositionCmd);

  /* Send Feedback containing default angles */
  socket.emit('fdbk', {
    'servo0':90,
    'servo1':90,
    'servo2':180,
    'servo3':90,
    'servo4':0
  });

  socket.on('cmd', function (data) {
	//console.log(data);
	// "#"+data.servoNum + " P" + (leftMostExtremePulseWidth+data.angle*differenceInExtremePulseWidths/180) + "\r"
	switch(data.servoNum) {
	case 0:
		ssc.port.write("#"+data.servoNum + " P" + (550+data.angle*1850/180) + "\r");
		break;
	case 1:
		ssc.port.write("#"+data.servoNum + " P" + (2000-data.angle*1200/180) + "\r");
		break;
	case 2:
		ssc.port.write("#"+data.servoNum + " P" + (2100-data.angle*1570/180) + "\r");
		break;
	case 3:
		ssc.port.write("#"+data.servoNum + " P" + (2200-data.angle*1700/180) + "\r");
		break;
	case 4:
		ssc.port.write("#"+data.servoNum + " P" + (1200+data.angle*1100/180) + "\r");
		break;
	}
  });
}

// TODO
function addToQueue(socket) {
  
}