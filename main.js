var mysql = require("mysql");
var http = require('http');
var querystring = require('querystring');
var fs = require('fs');
const {
    URL
} = require('url');
const {
    URLSearchParams
} = require('url');
var sys = require('util');
var Memcached = require('memcached');
var memcached = new Memcached('127.0.0.1:11211');
var result = "";
var search = "";
//Database connection
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: 'digsen01',
    database: 'apitest'
});
connection.connect();
http.createServer(function (req, res) {
        var baseURL = 'http://' + req.headers.host + '/';
        var myURL = new URL(req.url, baseURL);
        var reqs = myURL.pathname.match(/[^/?]*[^/?]/g);
        var re = new RegExp(/^(\/api\/v1\/)/);
        if (!myURL.pathname.match(re)) {
            display_404(myURL.pathname, req, res);
            return;
        }
        switch ("/" + reqs[0] + "/" + reqs[1] + "/" + reqs[2]) {
        case '/api/v1/get':
            return_get(myURL, req, res);
            break;
        case '/api/v1/create':
            if (req.method == 'POST') {
                processPost(req, res, function () {
                    console.log(req.post);
                    var fieldPost = [];
                    var sanitizePost = [];
                    for (let [key, value] of Object.entries(req.post)) {
                        fieldPost.push(key);
                        sanitizePost.push("'" + value.replace(new RegExp(/[^\w.-_@]/g), '') + "'");
                        console.log(key, value, fieldPost, sanitizePost);
                    }
                    // Use request.post here
                    var sanitize_value = sanitizePost.join();
                    var join_fields = fieldPost.join();
                    connection.query('INSERT INTO users (' + join_fields + ') VALUES (' + sanitize_value + ')', function (error, results, fields) {
                        if (error) throw error;

                        res.write(JSON.stringify({
                            "status": 200,
                            "error": null,
                            "response": req.post
                        }));
                        res.end();
                    });
                });
            } else {
                display_create(myURL.pathname, req, res);
            }
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
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            var mysql_query = "1";
            var match = url.pathname.match(/[^/?]*[^/?]/g);
            if (match[3]) {
                search = match[3].replace(new RegExp(/[^\w.-_@]/g), '');
            }
            /*memcached.get(match[2] + search, function (err, data) {
                if (data) {
                    result = data;
                    console.log(data);
                    res.write(JSON.stringify({
                        "status": 200,
                        "error": null,
                        "response": result
                    }));
                    res.end();
                } else {*/
                    mysql_query = 'name = "' + search + '" OR id = "' + search + '"';
                    connection.query('SELECT * from users WHERE ' + mysql_query, function (error, results, fields) {
                        if (error) throw error;
                        console.log(results);
                        res.write(JSON.stringify({
                            "status": 200,
                            "error": null,
                            "response": results
                        }));
                        memcached.set(match[2] + search, results, 1000, function (err) {});
                        res.end();
                    });
                //}
            //});
        }

        /**
         * Display the list creat page
         **/
        function display_create(url, req, res) {
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            res.write("<form action='' method='post'><input type='text' name='name' placeholder='name' /><input type='submit' value='Submit' /></form>");
            res.end();
        }

        /**
         * Display the 404 page for content that can't be found
         **/
        function display_404(url, req, res) {
            res.writeHead(404, {
                'Content-Type': 'text/html'
            });
            res.write("<h1>404 Not Found</h1>");
            res.end("The page you were looking for: " + url + " can not be found");
        }

        function processPost(request, response, callback) {
            var queryData = "";
            if (typeof callback !== 'function') return null;

            if (request.method == 'POST') {
                request.on('data', function (data) {
                    queryData += data;
                    if (queryData.length > 1e6) {
                        queryData = "";
                        response.writeHead(413, {
                            'Content-Type': 'text/plain'
                        }).end();
                        request.connection.destroy();
                    }
                });

                request.on('end', function () {
                    request.post = querystring.parse(queryData);
                    callback();
                });

            } else {
                response.writeHead(405, {
                    'Content-Type': 'text/plain'
                });
                response.end();
            }
        }
    })
    .listen(8000);
console.log('Server running at http://127.0.0.1:8000/');