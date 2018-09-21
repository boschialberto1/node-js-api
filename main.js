var mysql = require("mysql");
var http = require('http');
var fs = require('fs');
const { URL } = require('url');
const { URLSearchParams } = require('url');
var sys = require('util');
var Memcached  = require('memcached');
var memcached = new Memcached('127.0.0.1:11211');
var result="";
var search="";
//Database connection
var connection = mysql.createConnection({
	  	host     : 'localhost',
	  	user     : 'root',
                password : '',
  		database : 'apitest'
	});
	connection.connect();
http.createServer(function (req, res) {
    var baseURL = 'http://' + req.headers.host + '/';
    var myURL = new URL(req.url, baseURL);
    var reqs = myURL.pathname.match(/[^/?]*[^/?]/g);
    switch("/"+reqs[0]+"/"+reqs[1]+"/"+reqs[2]) {
    case '/api/v1/get':
	return_get(myURL, req, res);
	break;
    case '/api/v1/create':
	display_create(myURL.pathname, req, res);
	break;
    case '/api/v1/edit':
	console.log("display edit");
	break;
    default:
	display_404(myURL.pathname, req, res);
    }
    return;
 /**
     * Display the document root
     **/
    function return_get(url, req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
        var mysql_query = 1;
        var match = url.pathname.match(/[^/?]*[^/?]/g);
        console.log(match);
        if (match[3])
        {
            search = match[3].replace(new RegExp(/[^\w.-_@]/g), '');
        }
            memcached.get(match[2]+search, function (err, data) {
            if(data)
            {
                result = data;
                res.write(JSON.stringify({"status": 200, "error": null, "response": result}));
                res.end();
            }
            else
            {
                mysql_query = 'name = "'+search+'" OR id = "'+search+'"';
                connection.query('SELECT * from users WHERE '+mysql_query, function (error, results, fields) {
                    if (error) throw error;

                    res.write(JSON.stringify({"status": 200, "error": null, "response": results}));
                    memcached.set(match[2]+search, results, 1000, function (err) {  });
                    res.end();
                });
            }
          });
    }
 
    /**
     * Display the list creat page
     **/
    function display_create(url, req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	fs.readFile('./templates/create.haml', function(e, c) {
	    var data = {
		title: "Create New List",
		message: "Please enter up to 5 things to remember",
		url: url
	    };
	    var html = haml.render(c.toString(), {locals: data});
	    res.end(html);
	});
    }
 
    /**
     * Display the 404 page for content that can't be found
     **/
    function display_404(url, req, res) {
	res.writeHead(404, {'Content-Type': 'text/html'});
	res.write("<h1>404 Not Found</h1>");
	res.end("The page you were looking for: "+url+" can not be found");
    }
}).listen(8000);
console.log('Server running at http://127.0.0.1:8000/');