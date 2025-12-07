import express from "express";
import path from "path";
import { createServer } from "http";
import fs from "fs";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

// 기본 묶음
const app = express();
const server = createServer(app);
const io = new Server(server);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

let offer = {};
let answer = {};
let callIceCandidate;
let remoteIceCandidate;

io.on("connection", (socket) => {
  console.log("웹소켓 연결완료");

  // 4. 오퍼를 받고 서버에 저장
  socket.on("sendOfferToServer", (sentOffer) => {
    console.log("오퍼받았음");
    offer = sentOffer;
    console.log(offer);
  });

  // 6. 사용자의 요청을 받고 저장된 오퍼를 반환
  socket.on("getOfferFromServer", () => {
    socket.emit("sendOfferFromServer", offer);
    console.log("사용자에게 오퍼 보냈음");
  });

  // 12. answer를 서버에 저장
  socket.on("sendAnswerToServer", (sentanswer) => {
    console.log(sentanswer);
    answer = sentanswer;
    // broadcast: Answer를 보낸 이용자를 제외한 모든 클라이언트에게 전송
    // 13. answer를 반환
    socket.broadcast.emit("sendAnswerFromServer", answer);
  });

  // 16. 받은 ice저장및 뿌려줌
  socket.on("callIceCandidate", (ice) => {
    if (ice) {
      callIceCandidate = ice;
      console.log("콜러 ice 저장함!");
    }
    console.log("콜러 ice 받음!");
    socket.emit("sendIceToRemoter", callIceCandidate);
    socket.broadcast.emit("sendIceToRemoter", callIceCandidate);
  });

  socket.on("remoteIceCandidate", (ice) => {
    if (ice) {
      remoteIceCandidate = ice;
      console.log("리모터 ice 저장함!");
    }
    console.log("리모터 ice 받음!");
    socket.emit("sendIceToCaller", remoteIceCandidate);
    socket.broadcast.emit("sendIceToCaller", remoteIceCandidate);
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("서버 실행중");
});
