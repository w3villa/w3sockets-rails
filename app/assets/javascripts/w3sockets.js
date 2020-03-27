var channel = function(name) {
	var self = this;
	this.bindEvent = function(eventName) {
		// this.log('I am inside channel: ', eventName);
	}
	return this;
}

// SOCKET EVENTS AND PROTOTYPES //
function Socket (url, options, w3socket) {
	// w3socket.log(url, options, w3socket);
	this.socketObj = io(url, options);
	this.w3socket = w3socket;
}

Socket.prototype.emit = function(eventName, data) {
	// this.w3socket.log('Socket.prototype.emit: Emitting socket event: ', eventName, ' data: ', data);
	if(!eventName) {
		return false;
	}
	// this.w3socket.log("Emitting socket event from front end!");
	this.socketObj.emit(eventName, data);
}

Socket.prototype.on = function(eventName, cb) {
	var self = this;
	// this.w3socket.log('Socket.prototype.on: Listening socket on for event: ', eventName);
	this.socketObj.on(eventName, function(data) {
		// self.w3socket.log('Socket.prototype.on: Data received from server for : ' + eventName, data);
		cb(data);
	});
}

// CHANNEL EVENTS AND PROTOTYPES //
function Channel (name, w3socket) {
	this.name = name;
	this.w3socket = w3socket;
}

Channel.prototype.join = function(channelName) {
	// this.w3socket.log('Channel.prototype.join: Join channel request for: ', channelName);
}

Channel.prototype.bindEvent = function(eventName, callback) {
	var self = this;
	// this.w3socket.log('Channel.prototype.bindEvent: bind event request for: ', eventName);
	this.w3socket.socket.on(eventName, function(data) {
    // self.w3socket.log('Channel.prototype.bindEvent: Data transfered for channel ', this.name,' : ', data);
    callback(data)
  });
}


function W3sockets (APPKEY) {
	var self           			 = this;
			this.socket          = null // Socket object
			// this.host         = "http://localhost"; 
			this.host            = "https://w3sockets.com";
			this.port            = "8000";
			this.initiated       = false;
			this.appLoaded       = false;
			this.appName         = "W3sockets";
			this.APPKEY          = null // Store APPKEY for current client
			this.socketConnected = false;
			this.channels        = [];
			this.debugMode       = false;

	// Process after connection
	this.processConnection = function() {
		self.socket.on("connected", function(data) { 						// Listen connected event from server
			self.socket.emit("appDetails", {appId: self.APPKEY}); // Send app details to server
		})
	},

	this.connectSocket = function() { // Create socket connection if all fine
		if(!self.socketConnected) {
			// this.log('Connecting socket to: ' + self.host, {secure: true, reconnect: true});
			self.socket = new Socket(self.host, {secure: true, reconnect: true});
			// self.socket = new Socket(self.host + ":" + self.port, {secure: true, reconnect: true}, self);
			self.socketConnected = true;
			self.processConnection();
		}
	}

	this.validateAppKey = function(APPKEY) { // Validate if APPKEY is available
		self.APPKEY = APPKEY;
		return !!APPKEY;
	}

	this.validateSocketIo = function() { // Validate if Socket IO is available (included previous to this library)
		return (typeof(io) != 'undefined');
	}

	// Register this user on running socket
	this.registerSocket = function() {
		self.socket.emit("add-user", {uniqueId: self.APPKEY});
	}

	// Handle join channel event from client app
	this.joinChannel = function(channelData) {
		if(!self.validateAppLoad(self.APPKEY)) {
			return false;
		}

		// this.log('Channel join: ', channelData);
		if(!channelData.channelName || !channelData.uniqueId) {
			return false;
		}

		// this.log('joinChannel: ', channelData);
		self.socket.emit("joinChannel", {name: channelData.channelName, uniqueId: channelData.uniqueId});
	}

	this.emitSocketEvent = function(eventName, data) { // Emit socket event to server socket
		if(!eventName) {
			return false;
		}

		self.socket.emit(eventName, data);
	}

	this.validateAppLoad = function(APPKEY) { // Validate all the requirements on app initialize

		if(!self.validateAppKey(APPKEY)) {
			// this.log('Please pass APPKEY, provided by ' + self.appName + '!', 'error');
			return self.appLoaded;
		}

		if(!self.validateSocketIo()) {
			// this.log('Please include socket library (https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.4/socket.io.js)!', 'error');
			return self.appLoaded;
		}

		self.appLoaded = true;

		if(self.appLoaded) {
			// this.log('App loaded, connecting socket!');
			self.connectSocket();
			self.registerSocket()
		}

		return self.appLoaded;
	}

	this.log = function(logData, type) {
		if(!this.debugMode) return true;

		if(type == 'error') {
			console.error(logData)
		} else {
			// console.log(logData);
		}
	},

	this.init = function(APPKEY) { // Initialize APP
		if(this.initiated) {
			// self.log('Loading ' + this.appName + ' multiple times!', 'error');
		}
		this.initiated = true;
		// self.log('Initializing ' + this.appName + ' for APPKEY: ', APPKEY);
		self.validateAppLoad(APPKEY);
	}
	if(!!APPKEY) {
		this.init(APPKEY);
	}

}

// Channel subscribe event
W3sockets.prototype.subscribe = function(channelName) {
	// this.log('Subscribing channel from ' + this.appName + ': ', channelName)
	if(!channelName) {
		// this.log('Unable to subscribe, missing channel name!', 'error');
		return false
	}
	channelName = this.APPKEY + "-" + channelName;
	this.emitSocketEvent("joinChannel", {name: channelName});
	this.channels[channelName] = new Channel(channelName, this);
	return this.channels[channelName];
}

// Socket disconnect event
W3sockets.prototype.disconnect = function(callback) {
	// this.log('Subscribing disconnect event for ' + this.appName + ': ')
	this.socket.on("disconnect", function(data) {
		this.socketConnected = false;
		callback();
	})
}

// Socket connect event
W3sockets.prototype.connect = function(callback) {
	var self = this;
	// this.log('Subscribing connect event for ' + this.appName + ': ')
	this.socket.on("connected", function(data) {
		// self.log('Firing connect callback.');
		callback();
	});
}