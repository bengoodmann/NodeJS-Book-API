const http = require("http");
const url = require("url");
const Book = require("./models/Books");
const sequelize = require("./db/db");

const port = 3000;

// Create a server
const server = http.createServer(async (req, res) => {
  // use the url package to parse the path name
  const parsedUrl = url.parse(req.url, true);
  const pathName = parsedUrl.pathname;

  const reqMethod = req.method.toLowerCase();

  // check if the endpoint points to /api/book
  if (pathName === "/api/book") {
    // if it does, check if request method is a get
    if (reqMethod === "get") {
      try {
        // get the whole book in the database
        const books = await Book.findAll();
        res.statusCode = 200;
        res.write(JSON.stringify({ books: books }));
        res.end();
      } catch (error) {
        console.log(error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Internal server error" }));
      }
      // when it's a post method
    } else if (reqMethod === "post") {
      let body = [];

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const { title, author, year } = JSON.parse(body);
          console.log(title, author, year);
          if (!title || !author || !year) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing required fields" }));
          } else {
            const newBook = await Book.create({
              title,
              author,
              year,
            });
            res.writeHead(201, {
              "Content-Type": "application/json",
            });
            res.end(JSON.stringify(newBook));
          }
        } catch (error) {
          console.error("Error creating book:", error);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      });
    }
  } else if (pathName.startsWith("/api/book/")) {
    try {
      const bookId = pathName.split("/")[3];
      const book = await Book.findByPk(bookId);
      if (!book) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.write(JSON.stringify({ error: "Book not found" }));
      }
      // get
      if (reqMethod === "get") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ book: book }));
      }
      // update
      else if (reqMethod === ("patch" || "put")) {
        let body = [];

        req.on("data", (chunk) => {
          body += chunk;
        });

        req.on("end", async () => {
          try {
            const { title, author, year } = JSON.parse(body);
            const updateBook = await book.update({
              title: title || book.title,
              author: author || book.author,
              year: year || book.year,
            });
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ updated: updateBook }));
          } catch (error) {
            console.error("Error updating book:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ error: "Error updating book. Try again" })
            );
          }
        });
        // delete
      } else if (reqMethod === "delete") {
        try {
          await book.destroy();
          res.writeHead(204, { "Content-Type": "application/json" });
          res.end();
        } catch (error) {
          console.error("Error deleting book:", error);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Error deleting book" }));
        }
      }
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }
});

sequelize.sync().then(() => {
  server.listen(port, () => {
    console.log(`Server started at port:${port}`);
  });
});
