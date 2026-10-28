// api/index.js — Health Check Endpoint
export default function handler(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    success: true,
    message: 'Quiz Platform API is running on Vercel Serverless',
    timestamp: new Date().toISOString(),
  }));
}
