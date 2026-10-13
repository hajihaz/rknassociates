const { image } = require('../website-lib/interior-backend');
module.exports = async function(req,res) {
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 try{const bytes=await image(req.query.id,req.query.variant);if(!bytes)return res.status(404).json({error:'Image not found'});res.setHeader('Content-Type','image/webp');return res.status(200).send(bytes);}catch(_){return res.status(503).json({error:'Image temporarily unavailable'});}
};
