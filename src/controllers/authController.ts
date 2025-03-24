import { login2 } from "../db/authDb"
import jwt from "jsonwebtoken";
import { CreateSession } from "../db/sessionDb";
import { getById } from "../db/userDb";
import dotenv from "dotenv"


const db = require("../models");
const Sessao = db.Sessao

const TIME_LIMIT = 5 * 60 * 60 * 1000

dotenv.config();


type resType = {
    status: (code: number) => any;
    json: (data: any) => void
    cookie: any
}

export const generateTokens = (user: { id: any; }) => {
    console.log("--------------------------",process.env.ACCESS_SECRET as string, process.env.REFRESH_SECRET as string)
    const accessToken = jwt.sign({ id: user.id }, process.env.ACCESS_SECRET as string, { expiresIn: "10s" });
    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_SECRET as string, { expiresIn: "5d" });

    return { accessToken, refreshToken };
};

export const login = async (req: { body: any, headers: any, cookies: any }, res: resType) => {

    try {
        console.log("----------------------", req.body)
        const { email, senha, os, finger } = req.body


        if (!email || !senha || !os || !finger) {
            return res.status(401).json({ success: false, error: "Dados obrigatórios" })
        }


        const resp = await login2({ email, senha })

        const hmac = req.headers["hmac"];


        const { accessToken, refreshToken } = generateTokens(resp);

        res.cookie("rfssid", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            // domain: "localhost",
            path: "/",
            maxAge : 2 * 24 * 60 * 60 * 1000 
        });

        await CreateSession({ fingerPrint: finger, ip: hmac, os: os, usuario_id: resp.id }, res)

        return res.status(200).json({ success: true, usuario_id: resp.id, dados: { message: "Login realizado!", token: accessToken } })

    } catch (error: any) {
        return res.status(401).json({ success: false, error: error.message })
    }
}


//checa o token de acesso e retorna o Id do usuario
export const checkLogin = async (req: any, res: any) => {
    const accessToken = req.headers["authorization"];
    const hmac = req.headers["hmac"];
    const refreshToken = req.cookies.rfssid;
    const fingerPrint = req.cookies.riptn;
    const seddra = req.cookies.seddra

    if (!accessToken || !refreshToken || !fingerPrint || !hmac) {
        return res.status(401).json({ success: false, error: "Não autorizado" });
    }

    const token = accessToken.split(" ")[1];


    try {
        const decoded = jwt.verify(token, process.env.ACCESS_SECRET as string);

        if (typeof decoded !== "object" || !decoded.id) {
            return res.status(401).json({ error: "Erro de comparação" });
        }

        const checkPrint = await Sessao.findOne({ where: { fingerprint_id: fingerPrint, usuario_id: decoded.id, ip_address: seddra } })

        if (!checkPrint) {
            return res.status(401).json({ error: "Dados da sessão não conferem." });
        }

        if (hmac != checkPrint.ip_address) {
            return res.status(401).json({ error: "Dados de hmac não conferem." });
        }

        const user = await getById(decoded.id);

        return res.status(200).json({ success: true, user });

    } catch (err: any) {
        if (err.name === "TokenExpiredError") {
            if (!refreshToken) {
                return res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
            }

            try {
                const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_SECRET as string);

                if (typeof decodedRefresh !== "object" || !decodedRefresh.id) {
                    return res.status(401).json({ error: "Refresh token inválido." });
                }

                const { accessToken } = generateTokens({ id: decodedRefresh.id });


                const user = await getById(decodedRefresh.id);
                return res.json({ success: true, user, newToken: accessToken });

            } catch (refreshErr) {
                return res.status(401).json({ error: "Refresh token expirado. Faça login novamente." });
            }
        }

        return res.status(401).json({ error: "Token inválido." });
    }
};


//limpa o token refresh
export const logout = async (req: any, res: any) => {
    const authHeader = req.headers['authorization'];
    const hmac = req.headers["hmac"];
    const fingerPrint = req.cookies.riptn;
    const ssid = req.cookies.rfssid
    const token = authHeader.split(' ')[1];

    try {

        const decodedRefresh = jwt.verify(ssid, process.env.REFRESH_SECRET as string);
        const decodedAccess = jwt.verify(token, process.env.ACCESS_SECRET as string);

        if (typeof decodedRefresh !== "object" || !decodedRefresh.id || typeof decodedAccess !== "object" || !decodedAccess.id) {
            return res.status(403).json({ error: "token inválido." });
        }

        await Sessao.destroy({ where: { usuario_id: decodedRefresh.id, ip_address: hmac, fingerprint_id: fingerPrint } })

        res.cookie("rfssid", "", {
            httpOnly: true,
            secure: false,
            sameSite: "Strict",
            // domain: "localhost",
            path: "/",
            maxAge: -1,
            expires : -1
        })

        res.cookie("seddra", "", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            // domain: "localhost",
            path: "/",
            maxAge: -1
        })

        res.cookie("riptn", "", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            // domain: "localhost",
            path: "/",
            maxAge: -1
        })

        return res.status(200).json({ success: true, message: "Logout realizado!" });

    } catch (error) {
        return res.status(500).json({ success: false, message: error })
    }
}


// //verifica o token de acesso e permite a requisição
// export const authenticate = (req: any, res: any, next: any) => {

//     const refreshToken = req.cookies.refreshToken;
//     const fingerPrint = req.cookies.riptn;
//     const seddra = req.cookies.seddra
//     const hmac = req.headers["hmac"];
//     const authHeader = req.headers['authorization'];
//     const Timestamp = req.headers['timestamp'];
//     const now = Date.now()

//     if (!Timestamp) {
//         return res.status(401).json({ error: "Requisição sem timestamp" });
//     }

//     if (now - Timestamp > TIME_LIMIT) {
//         return res.status(401).json({ error: "Requisição expirada" });
//     }

//     if (!authHeader) {
//         return res.status(401).json({ error: "Token ausente" });
//     }

//     const token = authHeader.split(' ')[1];

//     if (!token) {
//         return res.status(401).json({ error: "Token inválido" });
//     }


//     jwt.verify(token, process.env.ACCESS_SECRET as string, (err: any, user: any) => {
//         if (err) {
//             return res.status(401).json({ error: "Token inválido ou expirado" });
//         }

//         req.user = user;
//         next();
//     });
// };


export const authenticate = async (req: any, res: any, next: any) => {
    const refreshToken = req.cookies.rfssid;
    const fingerPrint = req.cookies.riptn;
    const seddra = req.cookies.seddra;
    const hmac = req.headers["hmac"];
    const authHeader = req.headers["authorization"];
    const timestamp = req.headers["timestamp"];
    const now = Date.now();

    if (!timestamp) {
        return res.status(401).json({ error: "Requisição sem timestamp" });
    }

    if (now - Number(timestamp) > TIME_LIMIT) {
        return res.status(401).json({ error: "Requisição expirada" });
    }

    if (!authHeader) {
        return res.status(401).json({ error: "Token ausente" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Token inválido" });
    }

    try {
        const decodedRefresh = jwt.verify(token, process.env.ACCESS_SECRET as string);

        if (decodedRefresh) {
            return next();
        }


    } catch (err: any) {
        if (err.name === "TokenExpiredError") {

            if (!refreshToken) {
                return res.status(401).json({ error: "Token expirado e nenhum refresh token foi fornecido" });
            }

            console.log("---------------------passou de refresh 1--------------")

            try {
                const session = await Sessao.findOne({
                    where: { fingerprint_id: fingerPrint, ip_address: seddra },
                });

                console.log("---------------------passou de sessão 1--------------")

                if (!session) {
                    return res.status(401).json({ error: "sessão expirada" });
                }

                console.log("---------------------passou de sessão 2--------------")

                if (session.ip_address !== hmac) {
                    return res.status(401).json({ error: "Dados diferentes" });
                }

                console.log("---------------------passou de sessão x hmac--------------")

                const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_SECRET as string);

                if (typeof decodedRefresh !== "object" || !decodedRefresh.id) {
                    return res.status(401).json({ error: "Refresh token inválido." });
                }

                console.log("---------------------passou de decoded --------------")

                const { accessToken } = generateTokens({ id: decodedRefresh.id });

                console.log("---------------------gerou outro token--------------")

                res.setHeader("Authorization", `Bearer ${accessToken}`);

                req.headers["authorization"] = `Bearer ${accessToken}`;

                return next();
            } catch (refreshErr) {
                return res.status(401).json({ error: "Refresh token expirado. Faça login novamente." });
            }
        }

        return res.status(401).json({ error: "Token inválido." });
    }
}

export const meetAsync = async (req: any, res: any, next: any) => { 
    return res.status(200).json({success : true, dados : {ad : process.env.ACCESS_SECRET as string, ed : process.env.REFRESH_SECRET as string, bd : process.env.FRONT_URL as string}})
}