async function testEmptyUser() {
  console.log('Testing Zero-Commit / Protostar user scenario...');
  const res = await fetch('http://127.0.0.1:3000/api/galaxy/brand-new-cosmonaut');
  console.log('GET /api/galaxy/brand-new-cosmonaut status:', res.status);
  const data = await res.json();
  console.log('Response for brand-new user:');
  console.log(' - User githubUsername:', data.user?.githubUsername);
  console.log(' - Total stars:', data.totalStars);
  console.log(' - Commits length:', data.commits?.length);
  console.log(' - Projects length:', data.projects?.length);

  // Test profile page render for brand-new user
  const pageRes = await fetch('http://127.0.0.1:3000/u/brand-new-cosmonaut');
  console.log('GET /u/brand-new-cosmonaut status:', pageRes.status);
  const html = await pageRes.text();
  console.log('Contains CommitCosmos brand:', html.includes('CommitCosmos'));
  console.log('Contains AppNavbar:', html.includes('role="banner"'));
}

testEmptyUser().catch(console.error);
