import jwt from 'jsonwebtoken'

// user authentication middleware

const authUser = async (req, res, next) => {
    try {
        console.log('🔐 authUser middleware called')
        const {token} = req.headers
        
        if (!token) {
            console.log('❌ No token provided in headers')
            return res.status(401).json({success: false, message: "Not Authorized Login again"})
        }

        console.log('🔍 Verifying token...')
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        console.log('✅ Token verified, user ID:', token_decode.id)

        req.user = { id: token_decode.id }
        next()

    } catch (error) {
        console.log('❌ Token verification failed:', error.message)
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: "Token expired, please login again" })
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: "Invalid token, please login again" })
        }
        res.status(500).json({ success: false, message: error.message })
    }
}

export default authUser