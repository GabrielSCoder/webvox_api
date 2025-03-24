import { checkAllfollowing, follow, checkAllfollowers, checkXFollowY, getTotalizer, checkAllfollowingAndCompare, checkAllFollowersCompare, unfollow } from "../db/followDb"


type resType = {
    status: (code: number) => any;
    json: (data: any) => void
}

export const postAsync = async (req: { body: any }, res: resType) => {
    try {
        const resp = await follow(req.body)
        return res.status(200).json({success : true, dados : resp})
    } catch (error : any) {
        return res.status(500).json({success : false, error : error.message})
    } 
}

export const unfollowAsync = async (req: { body: any }, res: resType) => {
    try {
        const resp = await unfollow(req.body)
        return res.status(200).json({success : true, dados : resp})
    } catch (error : any) {
        return res.status(500).json({success : false, error : error.message})
    } 
}

export const verifyAsync = async (req: { body: any }, res: resType) => {
    try {
        const resp = await checkXFollowY(req.body)
        return res.status(200).json({success : true, dados : resp})
    } catch (error : any) {
        return res.status(500).json({success : false, error : error.message})
    } 
}

export const getFollowing = async (req: { params: {id : number} },  res: resType) => {
    try {
        const resp = await checkAllfollowing(req.params.id)
        return res.status(200).json({success : true, dados : resp})
    } catch (error : any) {
        return res.status(500).json({success : false, error : error.message})
    }
}

export const getFollowingCompare = async (req: { body : any },  res: resType) => {
    try {
        const resp = await checkAllfollowingAndCompare(req.body)
        return res.status(200).json({success : true, dados : resp})
    } catch (error : any) {
        return res.status(500).json({success : false, error : error.message})
    }
}


export const getFollowers = async (req: { params: {id : number} },  res: resType) => {
    try {
        const resp = await checkAllfollowers(req.params.id)
        return res.status(200).json({success : true, dados : resp})
    } catch (error : any) {
        return res.status(500).json({success : false, error : error.message})
    }
}

export const getFollowerCompare = async (req: { body : any },  res: resType) => {
    try {
        const resp = await checkAllFollowersCompare(req.body)
        return res.status(200).json({success : true, dados : resp})
    } catch (error : any) {
        return res.status(500).json({success : false, error : error.message})
    }
}



export const getTotalizers = async (req: { params: {id : number} },  res: resType) => {
    try {
        const resp = await getTotalizer(req.params.id)
        return res.status(200).json({success : true, dados : resp})
    } catch (error : any) {
        return res.status(500).json({success : false, error : error.message})
    }
}