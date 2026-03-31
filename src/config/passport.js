const passport = require('passport')
const {Strategy:JwtStrategy,ExtractJwt} = require('passport-jwt')
const User = require('../models/user.model')

const options = {
    jwtFromRequest:ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey:process.env.JWT_SECRET
}

passport.use(
    new JwtStrategy(options,async(payload,done)=>{
        try {
            const user=await User.findById(payload.id).select('-password')

            if(!user){
                return done(null,false)
            }
            return done(null,user)
        } catch (error) {
            return done(error,false)
        }
    })
)

module.exports=passport;