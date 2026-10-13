const { published } = require('../website-lib/interior-backend');
module.exports = async function(req,res) {
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 try{return res.status(200).json(await published());}catch(_){return res.status(503).json({error:'Interior collection is temporarily unavailable'});}
};
