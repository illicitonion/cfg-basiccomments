// sqlite3 documentation: https://github.com/mapbox/node-sqlite3/wiki/API
var sqlite3 = require('sqlite3');
var http = require('http');
var url = require('url');
var escape = require('escape-html');

// Error code from https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
var internalServerError = 500;

var db = new sqlite3.Database('posts.db');
db.run("CREATE TABLE IF NOT EXISTS posts (id INT PRIMARY KEY, name TEXT, body TEXT)");

// callback will be called with an error which may be null.
function insertPost(name, body, callback) {
  var statement = db.prepare("INSERT INTO posts (name, body) VALUES (?, ?)");
  statement.run(
    [escape(name), escape(body)],
    callback
  );
  statement.finalize();
}

// callback will be called with (error, result) where error may be null, and result will be a dictionary.
function listPosts(callback) {
  var result = [];
  db.each(
    "SELECT name, body FROM posts ORDER BY id DESC",
    (error, row) => { result.push({"name": row.name, "body": row.body}); },
    (error) => callback(error, result),
  );
}

function handle(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");

  var requestUrl = url.parse(request.url, true);
  if (requestUrl.pathname === "/add-new-post") {
    insertPost(
      requestUrl.query.name,
      requestUrl.query.body,
      (error) => {
        if (error) {
          console.log("Error inserting: " + error);
          response.statusCode = internalServerError;
        }
        response.end();
      }
    );
  } else {
    listPosts((error, result) => {
      if (error) {
        console.log("Error selecting: " + error);
        response.statusCode = internalServerError;
      }
      response.write(JSON.stringify(result));
      response.end();
    });
  }
}

http.createServer(handle).listen(8080);
