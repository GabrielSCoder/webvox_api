import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser"
import { corsConfig, ServerPort } from "./utils/serverConfig";
import mainRouter from "./routes/mainRoute";
import { createServer } from "http";
import socketConfiguration from "./utils/socketConfig";
require('dotenv').config();

const app = express();
const server = createServer(app)

app.use(cors({...corsConfig}))
app.use(express.json());
app.use(cookieParser())

// socketConfiguration(server)

app.use(mainRouter)

server.listen(ServerPort, () => console.log("Servidor rodando"));

module.exports = app;