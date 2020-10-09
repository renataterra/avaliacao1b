const schedule = require('node-schedule')

module.exports = app => {
    schedule.scheduleJob('*/5 * * * *', async function(){
        const usersCount = await app.db('users').count('id').first()
        const categoriesCount = await app.db('categories').count('id').first()
        const articlesCount = await app.db('articles').count('id').first()
        const generosCount = await app.db('generos').count('id').first()
        const livrosCount = await app.db('livros').count('id').first()

        const { Stat } = app.api.stat
        
        const lastStat = await Stat.findOne({} , {} , { sort: { 'createdAt' : -1 } })

        const stat = new Stat({
            users: usersCount.count,
            categories: categoriesCount.count,
            articles: articlesCount.count,
            generos: generosCount.count,
            livros: livrosCount.count,
            createdAt: new Date()
        })

        const changeUsers = !lastStat || stat.users !== lastStat.users
        const changeCategories = !lastStat || stat.categories !== lastStat.categories
        const changeArticles = !lastStat || stat.articles !== lastStat.articles
        const changeGeneros = !lastStat || stat.generos !== lastStat.generos
        const changeLivros = !lastStat || stat.livros !== lastStat.livros

        if(changeUsers || changeCategories || changeArticles || changeGeneros || changeLivros) {
            stat.save().then(() => console.log('[Stats] Estatísticas atualizadas!'))
        }
    })
}