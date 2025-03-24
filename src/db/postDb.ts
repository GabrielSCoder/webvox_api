import { Sequelize, where } from "sequelize"
import { feedFilterDTO, getPostForm, postCreateDTO, postDTO, postFilterDTO, postForm, postListDTO, reactPostForm, replyFilterDtO, responsePostFilterDTO } from "../types/postT"
import { error } from "console"
import { createNotification } from "./notification"

const { Post, Usuario, PostReaction } = require("../models")


const validate = async (data: postCreateDTO) => {

    var erros: string[] = []

    if (data.tipo == "") {
        erros.push("Tipo obrigatório")
    }

    if (!data.conteudo || data.conteudo == "") {
        erros.push("Conteudo obrigatório")

    } else {
        const exists = await Usuario.findOne({ where: { id: data.usuario_id } })

        if (!exists) {
            erros.push("Usuario não existe")
        }
    }

    if (data.parent_id) {
        const exists = await Post.findOne({ where: { id: data.parent_id } })

        if (!exists) {
            erros.push("Post não existe")
        }
    }

    if (erros.length > 0) throw new Error(erros.toString())
}

const convertToDTO = async (data: postForm) => {

    const item: postDTO = {
        id: data.id,
        conteudo: data.conteudo,
        tipo: data.tipo,
        usuario_id: data.usuario_id,
        data_criacao: data.data_criacao,
        data_modificacao: data.data_modificacao,
        total_reactions: data.total_reactions,
        parent_id: data.parent_id
    }

    return item
}

export const getById = async (data: getPostForm) => {

    const likedLiteral = data.profile_id
        ? [
            [
                Sequelize.literal(`(
                SELECT EXISTS (
                    SELECT 1 FROM post_reaction 
                    WHERE post_reaction.post_id = "Post".id 
                    AND post_reaction.usuario_id = ${data.profile_id}
                )
            )`),
                "liked"
            ]
        ]
        : [];

    const resp = await Post.findOne({
        where: { id: data.id },
        include: [{ model: PostReaction, as: "reactions", attributes: [] }],
        attributes: {
            include: [
                [
                    Sequelize.cast(
                        Sequelize.literal(`(
                            SELECT COUNT(*) 
                            FROM post 
                            WHERE post.parent_id = "Post".id
                        )`),
                        "INTEGER"
                    ),
                    "total_replies"
                ],
                [
                    Sequelize.cast(
                        Sequelize.literal(`(
                            SELECT COUNT(*) 
                            FROM post_reaction 
                            WHERE post_reaction.post_id = "Post".id
                        )`),
                        "INTEGER"
                    ),
                    "total_reactions"
                ],
                ...likedLiteral
            ]
        },
        raw: true
    });

    if (!resp) {
        throw new Error("Post não existe");
    }

    return await resp;
};

export const create = async (data: postCreateDTO) => {

    await validate(data)

    const post = await Post.create({ ...data, data_criacao: Date.now() });

    return post
}

export const deletePost = async (id: number) => {
    const resp = await Post.findOne({ where: { id: id } })

    if (resp) {
        const r = await Post.destroy({ where: { id: id } })
        return r
    }
}

export const editPost = async (data: postCreateDTO) => {
    await validate(data)
    const check = await Post.findByPk(data.id)

    const r = await Post.update(
        { ...data, data_modificacao: Date.now() }, { where: { id: data.id } }
    )

    return r
}

export const getAllPostByIdUser = async (id: number) => {

    const resp = await Post.findAll({ where: { usuario_id: id, parent_id: null } })

    if (resp.length > 0) {
        const pageItem: postListDTO = {
            quantidade_postagens: resp.length,
            listaPostagens: resp
        }

        return pageItem
    }

    throw new Error("Error interno")
}

export const getAllPostByUsername = async (id: number) => {

    const resp = await Post.findAll({ where: { usuario_id: id } })

    if (resp.length > 0) {
        const pageItem: postListDTO = {
            quantidade_postagens: resp.length,
            listaPostagens: resp
        }
        return pageItem
    }

    throw new Error("Error interno")
}

export const getPostsByFilter = async (filter: postFilterDTO) => {

    var resp
    var list

    if (filter.usuario && typeof (filter.usuario) == "string") {
        const user = await Usuario.findOne({ where: { username: filter.usuario } })
        console.log(filter.usuario)
        if (user) {
            resp = await Post.findAll({
                where: { usuario_id: user.id },
                include: [{
                    model: Usuario,
                    as: "usuario",
                    attributes: ["nome", "username", "img_url", "data_criacao"]
                }]
            })
        } else {
            throw new Error("Usuario não encontrado")
        }
    } else if (filter.usuario && typeof (filter.usuario) == "number") {
        resp = await Post.findAll({ where: { usuario_id: filter.usuario } })
    } else {
        throw new Error("informação de usuario obrigatória")
    }

    const nSegments = Math.ceil(resp.length / filter.tamanhoPagina)

    if (nSegments != filter.numeroPagina) {
        const primeiraPos = (filter.numeroPagina - 1) * filter.tamanhoPagina
        const ultimaPos = primeiraPos + filter.tamanhoPagina
        list = resp.slice(primeiraPos, ultimaPos)
    } else if (nSegments == filter.numeroPagina) {
        const primeiraPos = (filter.numeroPagina - 1) * filter.tamanhoPagina
        list = resp.slice(primeiraPos)
    }

    const item: responsePostFilterDTO = {
        quantidade_postagens: resp.length,
        pagina: filter.numeroPagina,
        numeroPaginas: nSegments,
        listaPostagens: list
    }

    return item
}

export const getRepliesByPostId = async (data: replyFilterDtO) => {
    if (!data.id) {
        throw new Error("Id obrigatório");
    }

    // Verifica se profile_id foi passado
    const likedLiteral = data.profile_id
        ? [
            [
                Sequelize.literal(`(
                    SELECT EXISTS (
                        SELECT 1 FROM post_reaction 
                        WHERE post_reaction.post_id = "Post".id 
                        AND post_reaction.usuario_id = ${data.profile_id}
                    )
                )`),
                "liked"
            ]
        ]
        : []; // Se não, deixa vazio

    const resp = await Post.findAll({
        where: { parent_id: data.id },
        attributes: {
            include: [
                [
                    Sequelize.cast(
                        Sequelize.literal(
                            `(SELECT COUNT(*) FROM post_reaction WHERE post_reaction.post_id = "Post".id)`
                        ),
                        "INTEGER"
                    ), "total_reactions"

                ],
                ...likedLiteral // Inclui apenas se profile_id existir
            ]
        },
        include: [
            {
                model: Usuario,
                as: "usuario",
                attributes: ["nome", "username", "img_url", "data_criacao"]
            },
            {
                model: Post,
                as: "replies",
                attributes: {
                    include: [
                        [
                            Sequelize.cast(
                                Sequelize.literal(
                                    `(SELECT COUNT(*) FROM post_reaction WHERE post_reaction.post_id = replies.id)`
                                ),
                                "INTEGER"
                            ), "total_reactions"

                        ],
                        ...likedLiteral // Inclui apenas se profile_id existir
                    ]
                },
                required: false,
                include: [
                    {
                        model: Usuario,
                        as: "usuario",
                        attributes: ["nome", "username", "img_url", "data_criacao"]
                    },
                    {
                        model: Post,
                        as: "replies",
                        attributes: {
                            include: [
                                [
                                    Sequelize.cast(
                                        Sequelize.literal(
                                            `(SELECT COUNT(*) FROM post_reaction WHERE post_reaction.post_id = replies.id)`
                                        ),
                                        "INTEGER"
                                    ), "total_reactions"

                                ],
                                ...likedLiteral // Inclui apenas se profile_id existir
                            ]
                        }
                    }
                ]
            }
        ],
        order: [["data_criacao", "DESC"]]
    });

    if (!resp) {
        throw new Error("Post não encontrado");
    }

    return resp;
};




export const ReactToPost = async (data: reactPostForm) => {


    if (data && data.post_id && data.usuario_id) {

        console.log("aqui")

        const checkPost = await Post.findByPk(data.post_id)
        const checkUser = await Usuario.findByPk(data.usuario_id)

        if (checkPost && checkUser) {
            const checkReact = await PostReaction.findOne({ where: { post_id: data.post_id, usuario_id: data.usuario_id } })

            if (!checkReact) {
                const create = await PostReaction.create({ ...data, data_criacao: Date.now() })

                if (create) {
                    
                    await createNotification({
                        tipo: "like",
                        usuario_destino: data.profile_id,
                        post_id: data.post_id,
                        usuario_id: data.usuario_id
                    });

                    return { liked: true }
                }

                throw new Error("erro interno")

            } else {

                const destroy = await PostReaction.destroy({ where: { id: checkReact.id } })

                if (destroy) return { liked: false }

                throw new Error("erro interno")
            }

        } else {
            throw new Error("Erro na busca do usuário ou da postagem")
        }
    } else {
        throw new Error("Dados obrigatórios")
    }
}

export const getPostReactions = async (id: number) => {
    const reactions = await PostReaction.findOne({
        where: { post_id: id },
        attributes: [
            [Sequelize.fn('COUNT', Sequelize.col('post_id')), 'total_reactions']
        ]
    })
    return reactions
}

export const getUserPostsWithReactions = async (data: { authorId: number, userId: number }) => {


    if (data.authorId && data.userId) {
        const posts = await Post.findAll({
            where: { usuario_id: data.authorId, parent_id: null },
            attributes: [
                'id',
                'conteudo',
                'data_criacao',
                'data_modificao',
                [
                    Sequelize.cast(
                        Sequelize.literal(`
                            (SELECT COUNT(*) FROM post_reaction WHERE post_reaction.post_id = "Post".id)
                        `),
                        "INTEGER"
                    ), 'total_reactions'

                ],
                [
                    Sequelize.cast(
                        Sequelize.literal(`
                            (SELECT COUNT(*) FROM post WHERE post.parent_id = "Post".id)
                        `),
                        "INTEGER"
                    ), 'total_replies'
                ],
                [
                    Sequelize.literal(`
                        EXISTS (
                            SELECT 1 FROM post_reaction 
                            WHERE post_reaction.post_id = "Post".id 
                            AND post_reaction.usuario_id = ${data.userId}
                        )
                    `),
                    'liked'
                ]
            ],
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'username', 'img_url']
                }
            ],
            order: [['data_criacao', 'DESC']]
        });

        return {
            quantidade_postagens: posts.length,
            listaPostagens: posts
        };
    } else {
        throw new Error("Dados obrigatórios")
    }

};


export const feedMk1 = async (filter: feedFilterDTO) => {
    var resp
    var list = []



    if (filter.tamanhoPagina) {
        // const user = await Usuario.findByPk(filter.id)
        // if (!user) {
        //     throw new Error("Usuario não encontrado")
        // }

        const posts = await Post.findAll({
            include: [
                {
                    model: Usuario,
                    as: "usuario",
                    attributes: ["nome", "username", "img_url", "data_criacao"]
                }
            ]
        })

        const newRandN = () => Math.floor(Math.random() * posts.length)

        var previosRand: number[] = []

        for (let i = 0; i < filter.tamanhoPagina; i++) {

            var n = newRandN()

            while (previosRand.includes(n)) {
                n = newRandN()
            }

            list.push(posts[n])
            previosRand.push(n)
        }

        return list

    }

    throw new Error("informação de usuario obrigatória")
}

export const feedMk2 = async (filter: feedFilterDTO) => {
    if (!filter.tamanhoPagina) {
        throw new Error("Tamanho da página obrigatório");
    }


    const posts = await Post.findAll({
        where: { parent_id: null },
        attributes: [
            "id",
            "conteudo",
            "usuario_id",
            "data_criacao",
            [
                Sequelize.cast(
                    Sequelize.literal(`(
                        SELECT COUNT(*) FROM post_reaction 
                        WHERE post_reaction.post_id = "Post".id
                    )`),
                    "INTEGER"
                ), "total_reactions"
            ],
            [
                Sequelize.cast(
                    Sequelize.literal(`(
                        SELECT COUNT(*) FROM post 
                        WHERE post.parent_id = "Post".id
                    )`),
                    "INTEGER"
                ), "total_replies"
            ],
            filter.id
                ? [
                    Sequelize.literal(`(
                          SELECT EXISTS (
                              SELECT 1 FROM post_reaction 
                              WHERE post_reaction.post_id = "Post".id 
                              AND post_reaction.usuario_id = ${filter.id}
                          )
                      )`),
                    "liked"
                ]
                : []
        ].filter(Boolean),
        include: [
            {
                model: Usuario,
                as: "usuario",
                attributes: ["id", "nome", "username", "img_url", "data_criacao"]
            }
        ],
        order: Sequelize.literal("random()"),
        limit: filter.tamanhoPagina
    });

    return posts;
};
