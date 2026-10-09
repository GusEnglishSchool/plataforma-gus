const { Client } = require('ssh2');

const conn = new Client();
const commands = `
cd /root/plataforma-gus
git reset --hard HEAD
git pull
npm install
npm run build

echo "FIREBASE_PROJECT_ID=\"gusenglishschool\"" >> .env.local
echo "FIREBASE_CLIENT_EMAIL=\"firebase-adminsdk-fbsvc@gusenglishschool.iam.gserviceaccount.com\"" >> .env.local
echo "FIREBASE_PRIVATE_KEY=\"-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC2vpYNKFpFqPrf\\nfS5j0200yVTshpnmjwyxnMYfbsNxkNUI3bAwI/7urhEdslQOFP4S0MzojFk+vcSF\\n+QOkTnNfiFp2Xx7iZDdOPBIRzI5BKAS4ZM/xBQICZeH5aSCAx/jdM4+ZDDoXEDLc\\nlrpTz/+NVbKPY/IDNQpvFui25H35mXV6QbK6aDGHtIUx+o9nl1Zl/wtl6jKemtA9\\n/ZMoukuqL83J0fq0sRLc1nw/b4oNTdgZp8uAWGn/i61TkziSHCchvkyCGh3KX5p3\\noaSSFNSAWPIQh8PH2QkiSlZ5b3BBedbN4cbvV1d+8IBcCQvO8GH69e/qSnLLCEX7\\nyQj+1rx9AgMBAAECggEARJ949WPr0jDMVFRLsUzZu3LHIzLAZCXfnGrEs1UCq4i5\\nluS4nrtFphdTchVfHxKe/i3OZJ0ffkIApFaIGZEkHgG0BrNdg6IiaoyANJLd8HW4\\noA2rUFSTFpdvrhreC74MI/SSveQrhDGfB9rKCWMYEdjWfqYHYVDvpBu0M8nFzI5D\\nWd+hiIWL4j9roRq3A2ARqtV2PtDJJ1qKSli4u76dxr2qaMgKSTTp49/MCahjKYHT\\nADiQjLCI1bQPDgxSZeuM8m58HKisKqPezgucSi2S06fpdQDf1wGQ7lx0IObhiR5t\\nAp2Up+F7edsCsQuY4HIjjstVTEAazBgaIEcn4lJkOQKBgQDfYiyvafduD/Hn82nE\\nvXPXH7DaBmcSTFHEkIDuSbbZGK6W5MNumF5FL10j4S8SVUyoWxu6l93bIXnOitrD\\nIIZyudJBWzjJNZ48uYygX8J24HM+7DMs5I3Dp5a1U9tD9HlbC+WvYY5vInN2kfnz\\njLrO1X7Xxxd0LdCEVpG7qyfRdwKBgQDRbV7avmbwiFlC4oB6y4TKCWtpeuatJV8a\\nJf9DutdTeOYVb7boTa4fvk7iTtofHQAexHB4oGaHOs6kkmKyoJqFuIEE8LJtqF+n\\nKaMmTCRAnDpc2x2ixL0CsowofLKgWTxA6WHlcPgUCXPQ7gw+zxuhqID5ub9Ezn6S\\npNlY1lU+qwKBgBqyCNUNvNwSW750gHdajLVwvBnSGg89v6fV/RJ9DLT1FihCPnjB\\nDMMH3gGjr5RpTTfxa2bpL0I4xe3A+lPHV0numwnkdOzW04o+QmgICZ1bRWqHn7YF\\nuktfg8s3skR0uuv+h/xllDgDzfiliVFpyAlfykDPMiZYM0sdbV0YHzIRAoGBALmC\\n/WQdB0iILzGNPCwJ/c2N/ITKJm43zX93KyAO8NBzJrTUaZxruxNJW80h9htbcBDR\\nB6QCye9+CzBCr4T1uQs8vaTnpdZ3MIv92RSCnBZTjWtVeXIGfjtWd8shcoWRpksF\\nsP8yS75MBTiMtXIpuZtAjUco36IOnJY/ynvkGEzTAoGARXOM0GyVk+/gx2ueIXu2\\nc00hXRJgpjGbLGu6aQY2prLNdF7lPEOG/QVlq4QauUkNC8jjKF4IyKK2aHoM0vuF\\nqEIACZRs595lup93q2yOJBceoq2TnNYlFEA6jKqWyTyyyG4NTI7zXM5NxQPsR/1F\\nHQdGI3r4Pu8a3ccBbQUHoBA=\\n-----END PRIVATE KEY-----\\n\"" >> .env.local

pm2 delete all
pm2 start npm --name "plataforma" -- start
pm2 save
`;

console.log('Iniciando deploy automático no VPS...');

conn.on('ready', () => {
  console.log('Conectado ao VPS. Executando comandos...');
  conn.exec(commands, (err, stream) => {
    if (err) {
      console.error('Erro ao executar comandos:', err);
      conn.end();
      return;
    }
    
    stream.on('close', (code, signal) => {
      console.log(`\nDeploy finalizado com código ${code}.`);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error('Erro na conexão SSH:', err);
}).connect({
  host: '179.198.102.60',
  port: 22,
  username: 'root',
  password: 'GustavoM123@'
});
