import server from '@adonisjs/core/services/server'
import router from '@adonisjs/core/services/router'
server.use([() => import('@adonisjs/cors/cors_middleware')])
router.use([() => import('#middleware/json_only_middleware'), () => import('@adonisjs/core/bodyparser_middleware')])
