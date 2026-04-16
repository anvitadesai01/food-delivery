
const express= require("express")
const router = express.Router()

const authRoutes= require('./auth.routes')
const restaurantRoutes=require('./restaurant.routes')
const menuRoutes=require('./menu.routes')
const cartRoutes=require('./cart.routes')
const orderRoutes=require('./order.routes')
const analyticsRouts=require('./analytics.routes')
const paymentRoutes=require('./payment.routes')

router.use('/auth',authRoutes)
router.use('/restaurants', restaurantRoutes);
router.use('/menu',menuRoutes)
router.use('/cart',cartRoutes)
router.use('/orders',orderRoutes)
router.use('/analytics',analyticsRouts)
router.use('/payments',paymentRoutes)

module.exports=router

