/**
 * White Label System - Authentication Middleware
 */

const crypto = require('crypto');
const db = require('./database');

// Simple JWT-like token (in production, use jsonwebtoken library)
function generateToken(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
        .createHmac('sha256', process.env.JWT_SECRET || 'white-label-secret-key')
        .update(`${header}.${body}`)
        .digest('base64url');
    
    return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const [header, body, signature] = parts;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.JWT_SECRET || 'white-label-secret-key')
            .update(`${header}.${body}`)
            .digest('base64url');
        
        if (signature !== expectedSignature) return null;
        
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
        return payload;
    } catch (error) {
        return null;
    }
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password + (process.env.PASSWORD_SALT || 'salt')).digest('hex');
}

function comparePassword(password, hash) {
    return hashPassword(password) === hash;
}

// Authentication middleware
function authenticateClient(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Verify user exists
    const user = db.getClientUserById(payload.userId);
    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }
    
    // Verify client is active
    const client = db.getClientById(payload.clientId);
    if (!client || client.status !== 'active') {
        return res.status(403).json({ error: 'Client account is not active' });
    }
    
    req.user = user;
    req.client = client;
    req.clientId = payload.clientId;
    
    next();
}

// Optional authentication (for public endpoints that can work with or without auth)
function optionalAuthenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = verifyToken(token);
        
        if (payload) {
            const user = db.getClientUserById(payload.userId);
            const client = db.getClientById(payload.clientId);
            
            if (user && client && client.status === 'active') {
                req.user = user;
                req.client = client;
                req.clientId = payload.clientId;
            }
        }
    }
    
    next();
}

module.exports = {
    generateToken,
    verifyToken,
    hashPassword,
    comparePassword,
    authenticateClient,
    optionalAuthenticate
};
