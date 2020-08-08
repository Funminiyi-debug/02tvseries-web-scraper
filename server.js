const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
const mainjs = require("./main");

// const app = express();
// if (process.env.NODE_ENV === "production") {
//   app.use(express.static("client/build"));

//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
//   });
// }

const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, "Public")));

const botName = "ChatU Bot";
// on connection event

io.on("connection", socket => {
  console.log(`connected`);
  socket.on("getData", async request => {
    if (request.type === "getAllSeries") {
      const { allSeries } = await mainjs.listSeriesAndGenres();
      socket.emit("allSeries", allSeries);
    }

    if (request.type === "searchSeries") {
      if (request.payload.allSeries.length !== 0) {
        const { allSeasons } = await mainjs.search(
          `${request.payload.term}`,
          request.payload.allSeries
        );
        if (allSeasons === undefined) {
          socket.emit("error", `series not found`);
        }
        console.log(allSeasons);
        socket.emit("allSeasons", allSeasons);
      }
    } else {
      const allSeries1 = await mainjs.listSeriesAndGenres();
      const { allSeasons } = await mainjs.search(
        `${request.payload.term}`,
        allSeries1
      );
      socket.emit("allSeasons", allSeasons);
    }

    if (request.type === "downloadSeason") {
      const { episodes } = await mainjs.downloadSeason(request.payload);
      socket.emit("Episodes", episodes);
    }
  });

  socket.on("disconnect", () => console.log(`disconnected`));
});
const PORT = process.env.PORT || 1200;

server.listen(PORT, console.log("Server running on port %s", PORT));
