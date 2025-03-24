import { Op, Sequelize } from "sequelize";
import { reporte } from "../types/reporte";
import { usuarioFilterDTO } from "../types/usuarioT";

const { Relatorio } = require("../models");

const validate = async (data: reporte) => {
    if (!data.titulo || !data.conteudo) {
        throw new Error("dados obrigatórios")
    }
}

export async function create(data: reporte) {
    await validate(data)

    const persist = await Relatorio.create({ ...data, data_criacao: Date.now() })

    if (!persist) throw new Error("Erro na persistência")

    return persist.id
}

export async function destroy(id: number) {
    const check = await Relatorio.findByPk(id)

    if (!check) throw new Error("Não encontrado")

    const del = await Relatorio.destroy({ where: { id } })
}

export async function getReportsWithPagination(data: usuarioFilterDTO) {

    console.log(data)

    // if (!data.pagina || !data.tamanhoPagina) {
    //     throw new Error("Dados de paginação obrigatórios")
    // }

    const relatorios = await Relatorio.findAll(
        {
            where: {
                [Op.or]: [
                    { nome: { [Op.iLike]: `%${data.search}%` } },
                    { titulo: { [Op.iLike]: `%${data.search}%` } }
                ]
            },
            limit: data.tamanhoPagina,
            offset: (data.pagina) * data.tamanhoPagina,
            order: [["data_criacao", "DESC"]]
        },

    )

    return relatorios
}

export async function getAllReports () {
    const list = await Relatorio.findAll()

    return list
}