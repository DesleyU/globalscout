#!/usr/bin/env node

/**
 * SSL Certificate Verification Script
 * Checks SSL certificate status and security
 */

const https = require('https');
const tls = require('tls');

function checkSSL(domain) {
    return new Promise((resolve, reject) => {
        console.log(`🔍 Checking SSL for: ${domain}`);
        
        const options = {
            host: domain,
            port: 443,
            method: 'GET',
            path: '/health',
            timeout: 10000
        };
        
        const req = https.request(options, (res) => {
            const cert = res.socket.getPeerCertificate();
            
            if (cert) {
                const now = new Date();
                const expiry = new Date(cert.valid_to);
                const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
                
                console.log(`✅ SSL Certificate Information:`);
                console.log(`   Subject: ${cert.subject.CN}`);
                console.log(`   Issuer: ${cert.issuer.O}`);
                console.log(`   Valid from: ${cert.valid_from}`);
                console.log(`   Valid to: ${cert.valid_to}`);
                console.log(`   Days until expiry: ${daysUntilExpiry}`);
                
                if (daysUntilExpiry < 30) {
                    console.log(`⚠️  Certificate expires in ${daysUntilExpiry} days - consider renewal`);
                }
                
                resolve({
                    domain,
                    cert,
                    daysUntilExpiry,
                    status: 'valid'
                });
            } else {
                reject(new Error('No certificate found'));
            }
        });
        
        req.on('error', (error) => {
            console.error(`❌ SSL check failed for ${domain}: ${error.message}`);
            reject(error);
        });
        
        req.on('timeout', () => {
            console.error(`❌ SSL check timeout for ${domain}`);
            req.destroy();
            reject(new Error('Timeout'));
        });
        
        req.end();
    });
}

async function verifySSL() {
    const domains = process.argv.slice(2);
    
    if (domains.length === 0) {
        console.log('Usage: node verify-ssl.js domain1.com domain2.com ...');
        console.log('Example: node verify-ssl.js your-domain.com api.your-domain.com');
        process.exit(1);
    }
    
    console.log('🔒 SSL Certificate Verification');
    console.log('==============================');
    
    for (const domain of domains) {
        try {
            await checkSSL(domain);
            console.log('');
        } catch (error) {
            console.error(`❌ Failed to verify ${domain}: ${error.message}`);
            console.log('');
        }
    }
}

verifySSL();