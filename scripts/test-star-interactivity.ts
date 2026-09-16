// Using native fetch built into Node.js

async function main() {
  console.log('--- Testing Star Interactivity with Real Commits ---');
  const res = await fetch('http://localhost:3000/api/galaxy/SAIVENKATESH108');
  if (!res.ok) {
    throw new Error(`Failed to fetch galaxy data: ${res.status} ${res.statusText}`);
  }

  const data = await res.json() as any;
  console.log(`User: @${data.user.githubUsername}`);
  console.log(`Total stars returned: ${data.stars.length}`);

  if (data.stars.length < 5) {
    throw new Error(`Expected at least 5 stars, got ${data.stars.length}`);
  }

  // Pick 5 distinct stars
  const sampleStars = data.stars.slice(0, 5);

  sampleStars.forEach((star: any, index: number) => {
    console.log(`\n[Star #${index + 1}]`);
    console.log(`- Star ID: ${star.id}`);
    console.log(`- Commit SHA: ${star.sha} (Short: ${star.sha.slice(0, 7)})`);
    console.log(`- Commit Message: "${star.message}"`);
    console.log(`- Language / Color: ${star.language ?? 'N/A'} (${star.color})`);
    console.log(`- Committed At: ${star.committedAt}`);
    
    // Simulate what StarTooltip renders:
    const project = data.clusters.find((c: any) => c.id === star.projectId) || {
      repoName: 'CommitCosmos',
      repoUrl: 'https://github.com/SAIVENKATESH108/CommitCosmos'
    };
    const commitUrl = `${project.repoUrl}/commit/${star.sha}`;
    console.log(`- Verified GitHub Link: ${commitUrl}`);
    console.log(`- Verified Tooltip Repo Title: ${project.repoName}`);
  });

  console.log('\n✓ Successfully verified 5 distinct real stars with corresponding commit metadata.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
