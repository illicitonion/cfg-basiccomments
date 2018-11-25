var sqlite3 = require('sqlite3').verbose();
var http = require('http');
var url = require('url');
var escape = require('escape-html');

var db = new sqlite3.Database('posts.db');
db.run("CREATE TABLE IF NOT EXISTS posts (id INT PRIMARY KEY, name TEXT, body TEXT)");

http.createServer((req, res) => {
  var u = url.parse(req.url, true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (u.pathname === "/post") {
      var stmt = db.prepare("INSERT INTO posts (name, body) VALUES (?, ?)");
      stmt.run([escape(u.query.name), escape(u.query.body)], () => { res.end(); });
      stmt.finalize();
  } else {
    var result = [];
    db.each("SELECT name, body FROM posts ORDER BY id DESC", function(err, row) {
      result.push({"name": row.name, "body": row.body});
    }, () => { res.write(JSON.stringify(result)); res.end() });
  }
}).listen(8080);
