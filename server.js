/* 	LaunchLab 0.1 
	
	Developed by Rouan van der Ende (rouan@8bo.org)

	OpenSource under MIT licence
	- - - - - - - - - - - - -

	To run in production mode with emails and cacheing enabled:

	# sudo NODE_ENV=production nodemon server	

	

	- - - - - - - - - - - - - -

	Cool ASCII Titles from (use banner3 font):
	http://www.network-science.de/ascii/
*/

/* BITCOIN MASTER ACCOUNT */

var bitcoinMasterWallet = "1EZ6S8YqfxzfMKCCtpzKeEJW1qMthQnCuD";
var domain = "launchlab.me";

var production = false;	
if (process.env.NODE_ENV == "production") {
	production = true;
	console.log("\nSTARTING LAUNCHLAB in PRODUCTION mode. Enabled caching and emails.\n\n")
} else {
	console.log("\nSTARTING LAUNCHLAB in DEVELOPMENT mode. Use for production:\n\tsudo NODE_ENV=production nodemon server\n\n")
}

var enableEmail = production;		
var enableArduino = false;		//set this to true if you want arduino sensor access on server side

//var socketconnect = 'http://fluentart.com/';
var socketconnect = '/';

var express = require('express');

var multiparty = require('multiparty')
  , http = require('http')
  , util = require('util')
var fs = require('fs');
var app = express();
var swig = require('swig');
var marked = require('marked'); // https://github.com/chjj/marked

var https = require('https');

var serveStatic = require('serve-static')
var favicon = require('serve-favicon');
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var session = require('cookie-session')
var compress = require('compression');

var databaseUrl = "mydb"; // "username:password@example.com/mydb"
var collections = ["users", "projects", "messages","external", "talk", "reports", "creativeapplications", "offerings", "orders", "invoices", "payments"]
var mongojs = require("mongojs");
var db = mongojs.connect(databaseUrl, collections);



app.use(compress());

app.use(favicon(__dirname + '/public/favicon.ico'));

/* BITCOIN PAYMENT INCOMING */


app.get('/paymentcallback/:id', function (req, res) {
	var invoiceid = req.params.id
	//to seperate phplike url parameters
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log(query);
	db.payments.save(query);

	var ObjectId = mongojs.ObjectId;
	console.log(" ** PAYMENT RECIEVED! **");

	db.invoices.findOne({"_id": ObjectId(invoiceid)}, function (err, invoice) {
		
		if (invoice.paymentsrecords == undefined) {
			invoice.paymentsrecords = [];
		}
		
		io.to(invoice.blockchainapi.input_address).emit('payment', "completed");

		invoice.paymentsrecords.push(query);
		db.invoices.update({"_id": ObjectId(invoiceid)}, invoice); //UPDATES INVOICE IN DATABASE
		res.send("*ok*");	
	})
});

app.get('/payments', function (req, res) {
	io.sockets.in("test").emit('payment', "completed");
	db.payments.find({}, function (err, results) {
		res.json(results);
	});
})

/* END BITCOIN PAYMENT INCOMING */




app.use(function(req, res, next) {

	if (req.url == "/") {
		io.sockets.emit("activity", {led: "1.0"})	
	}

	//HANDLE FILE UPLOADS
	var expectmulti = false;

	if (req.method === 'POST') {
		
		if (req.url.slice(0,'/upload'.length) === '/upload') {
			
			expectmulti = true;
		}

		if (req.url.slice(0,'/offerings/imageupload/'.length) === '/offerings/imageupload/') {
			
			expectmulti = true;
		}		

		if (req.url.slice(0,'/offerings/edit/'.length) === '/offerings/edit/') {
			
			expectmulti = true;
		}

		if (req.url.slice(0,'/project/upload/'.length) === '/project/upload/') { expectmulti = true; }		
		if (req.url == "/profile/uploadavatar") { expectmulti = true; }		
		
	}

	
	if (expectmulti) {
	    var form = new multiparty.Form();

	    form.parse(req, function(err, fields, files) {
	      //res.end(util.inspect({fields: fields, files: files}));
	      req.multipartparse = {fields: fields, files: files}
	      req.files = files;
	      next();
	    });

	} else {
		console.log('%s %s', req.method, req.url);
		next();
	}
});


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }))

app.use(session({
  keys: ['key1', 'key2'],
  secureProxy: false // if you do SSL outside of node
}))

app.use(serveStatic(__dirname + '/public', {'index': ['default.html', 'default.htm']}))


app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.set('view cache', production);

if (production == true) {
	swig.setDefaults({ cache: 'memory' });
} else {
	swig.setDefaults({ cache: false });
}


var server = app.listen(80, function() {
	console.log(server.address())
    console.log('Listening on port %d', server.address().port);
});

