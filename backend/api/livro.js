const queries = app => require('./queries')
module.exports = app => {
    const {existsOrError } = app.api.validation

    const save = (req, res) => {
        const livro = { ...req.body }
        if(req.params.id) livro.id = req.params.id
        try {
            existsOrError(livro.name, 'Nome não informado')
            existsOrError(livro.description, 'Descrição não informada')
            existsOrError(livro.categoryId, 'Categoria não informada')
            existsOrError(livro.userId, 'Autor não informado')
            existsOrError(livro.content, 'Conteúdo não informado')
        } catch(msg) {
            res.status(400).send(msg)
        }
        if(livro.id) {
            app.db('livros')
            .update(livro)
            .where({ id: livro.id})
            .then(_ => res.status(204).send())
            .catch(err => res.status(500).send(err))
        } else {
            app.db('livros')
                .insert(livro)
                .then(_ => res.status(204).send())
                .catch(err => res.status(500).send(err))
        }
    }

    const remove = async (req, res) => {
        try {
            const rowsDeleted = await app.db('livros')
                .where({ id: req.params.id }).del()
            try {
                existsOrError(rowsDeleted, 'Livro não foi encontrado')
            } catch(msg) {
                return res.status(400).send(msg)
            }
            res.status(204).send()

        } catch (msg) {
            res.status(500).send(msg)
        }
    }

    const limit = 10

    const get = async (req, res) => {
        const page = req.query.page || 1
        const result = await app.db('livros').count('id').first()
        const count = parseInt(result.count)

        app.db('livros')
            .select('id', 'name', 'description')
            .limit(limit).offset(page * limit - limit)
            .then(livros => res.json({ data:livros, count, limit }))
            .catch(err => res.status(500).send(err))
    }

    const getById = (req, res) => {

        app.db('livros')
            .where({ id: req.params.id })
            .first()
            .then(livro => {
                livro.content = livro.content.toString()
                return res.json(livro)
            })
            .catch(err => res.status(500).send(err))
    }

    const getByGenero = async (req, res) => {
        const generoId = req.params.id
        const page = req.query.page  || 5
        const categories = await app.db.raw(queries.generoWithChildren, generoId)
        const ids = categories.rows.map(c => c.id)

        app.db({ a: 'livros', u: 'users' })
            .select('a.id', 'a.name', 'a.description', 'a.imageUrl', {author: 'u.name'})
            .limit(limit).offset(page * limit - limite)
            .whereRaw('?? = ??', ['u.id', 'a.userId'])
            .whereIn('generoId', ids)
            .orderBy('a.id', 'desc')
            .then(livros => res.json(livros))
            .catch(err => res.status(500).send(err))
    }

    return { save, remove, get, getById, getByGenero }
}