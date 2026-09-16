import { GET } from '../app/api/galaxy/[username]/route';
import { NextRequest } from 'next/server';

async function main() {
  const req = new NextRequest('http://localhost:3000/api/galaxy/SAIVENKATESH108');
  try {
    const res = await GET(req, { params: { username: 'SAIVENKATESH108' } });
    console.log('Status:', res.status);
    const body = await res.json();
    console.log('Body:', body);
  } catch (err) {
    console.error('Direct route error:', err);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
