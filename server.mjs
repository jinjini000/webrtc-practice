import express from "express";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

const app = express();
const server = createServer(app);
const io = new Server(server);

let pendingCandidates = [];

let offer = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// public 폴더 정적 제공
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("WebSocket 연결됨:", socket.id);

  // Caller → Server → Remote 로 Offer 전달
  socket.on("offer", (sentoffer) => {
    console.log("Offer 수신, 브로드캐스트");
    offer = sentoffer;
  });

  socket.on("getOffer", () => {
    if (!offer) {
      console.log("오퍼없음");
    } else {
      socket.emit("sendOffer", offer);
    }
  });

  // Remote → Server → Caller 로 Answer 전달
  socket.on("answer", (answer) => {
    console.log("Answer 수신, 브로드캐스트");
    socket.broadcast.emit("sendAnswer", answer);
  });

  // 양쪽 ICE 후보 교환 (그냥 상대에게 브로드캐스트)
  socket.on("ice-candidate", (candidate, isCaller) => {
    console.log("ICE Candidate 수신, 브로드캐스트");
    if (isCaller) {
      pendingCandidates.push(candidate);
    }
    socket.broadcast.emit("send-ice-candidate", candidate);
  });

  socket.on("getIceOfCaller", () => {
    while (pendingCandidates.length > 0) {
      const c = pendingCandidates.shift();
      try {
        socket.emit("sendIceOfCaller", c);
        console.log("대기중인 ICE 후보 추가 처리");
      } catch (e) {
        console.error("대기중인 ICE 후보 추가 중 에러:", e);
      }
    }
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("서버 실행중: http://localhost:3000");
});
