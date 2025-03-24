import express from "express"
import { getFollowers, getFollowing, postAsync, verifyAsync, getTotalizers, getFollowingCompare, getFollowerCompare, unfollowAsync } from "../controllers/followController";
import { authenticate } from "../controllers/authController";

const followRouter = express.Router()

followRouter.post("/", authenticate, postAsync);
followRouter.post("/unfollow", authenticate, unfollowAsync);
followRouter.post("/verifyUserX", authenticate, verifyAsync);
followRouter.get("/following/:id", getFollowing);
followRouter.post("/compare/following", authenticate, getFollowingCompare);
followRouter.post("/compare/followers", authenticate, getFollowerCompare);
followRouter.get("/total/:id", authenticate, getTotalizers );
followRouter.get("/followers/:id", authenticate, getFollowers);

export default followRouter