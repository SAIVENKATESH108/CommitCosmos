async function testShell() {
  console.log('Testing App Shell endpoints on 127.0.0.1:3000...');
  const res = await fetch('http://127.0.0.1:3000/u/SAIVENKATESH108');
  console.log('GET /u/SAIVENKATESH108 status:', res.status);
  const text = await res.text();
  console.log('Contains CommitCosmos:', text.includes('CommitCosmos'));
  console.log('Contains AppNavbar elements:');
  console.log(' - Brand logo image:', text.includes('commitcosmos_logo.png'));
  console.log(' - User profile @SAIVENKATESH108:', text.includes('SAIVENKATESH108'));
  console.log(' - 3D Galaxy toggle:', text.includes('3D Galaxy'));
  console.log(' - Accessible List toggle:', text.includes('Accessible List'));

  // Test API galaxy data for populated states
  const apiRes = await fetch('http://127.0.0.1:3000/api/galaxy/SAIVENKATESH108');
  console.log('GET /api/galaxy/SAIVENKATESH108 status:', apiRes.status);
  const data = await apiRes.json();
  console.log('Total stars in API:', data.totalStars);
  console.log('Total projects in API:', data.projects?.length);
  console.log('Streak in API:', data.streak);

  // Test homepage endpoint
  const homeRes = await fetch('http://127.0.0.1:3000/');
  console.log('GET / status:', homeRes.status);
  const homeText = await homeRes.text();
  console.log('Homepage contains CommitCosmos:', homeText.includes('CommitCosmos'));
}

testShell().catch(console.error);
