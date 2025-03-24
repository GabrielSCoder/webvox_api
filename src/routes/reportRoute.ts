import express from "express";
import { deleteAsync, getPaginationAsync, getallAsync, postAsync} from "../controllers/reportController"

const reportRoute = express.Router();

reportRoute.get("/all", getallAsync)
reportRoute.get("/pagination", getPaginationAsync)
reportRoute.post("/", postAsync)
reportRoute.delete("/:id", deleteAsync)

export default reportRoute
