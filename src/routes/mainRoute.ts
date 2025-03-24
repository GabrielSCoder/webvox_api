import { Router } from "express";
import authRouter from "./authRoute";
import feedRouter from "./feedRoute";
import postRouter from "./postRoute";
import userRouter from "./userRoute";
import followRouter from "./followRoute";
import sessionRouter from "./sessionRoute";
import notificationRouter from "./notificationRoute";
import reportRoute from "./reportRoute";

const mainRouter = Router()

mainRouter.use("/auth", authRouter);
mainRouter.use("/usuario", userRouter);
mainRouter.use("/post", postRouter);
mainRouter.use("/feed", feedRouter)
mainRouter.use("/follow", followRouter)
mainRouter.use("/session", sessionRouter)
mainRouter.use("/notificacao", notificationRouter)
mainRouter.use("/report", reportRoute)

export default mainRouter