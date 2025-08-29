import jwt from 'jsonwebtoken'

// doctor authentication middleware

const authDoctor = async (req, res, next) => {
    try {

        // Accept token from multiple header styles for robustness
        const headerToken = req.headers['dtoken'] || req.headers['dToken'] || req.headers['authorization']
        const token = typeof headerToken === 'string' && headerToken.startsWith('Bearer ')
            ? headerToken.split(' ')[1]
            : headerToken
        if (!token) {
            return res.status(401).json({success:false,message:"Not authorized. Please log in again."})
        }

        const token_decode = jwt.verify(token, process.env.JWT_SECRET)

        req.doc = { id: token_decode.id }

        next()


    } catch (error) {
        console.log(error)
        // Common cause is stale token after JWT_SECRET change; make the hint explicit
        res.status(401).json({ success: false, message: 'Invalid or expired session. Please log out and log in again.' })
    }
}

export default authDoctor