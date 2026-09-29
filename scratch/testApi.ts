

async function testDemoFlow() {
  console.log('--- Testing Deal Intelligence API Flow ---');

  // 1. Post new interaction
  const postRes = await fetch('http://localhost:5000/api/deals/deal-acme-101/interactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'Call',
      title: 'Implementation Timeline Call',
      content: 'Sarah said they are interested in moving forward, but implementation time is still the biggest concern. She wants a detailed 30-day implementation plan.',
      participants: ['Alex Morgan', 'Sarah Johnson'],
    }),
  });

  const extraction = await postRes.json();
  console.log('AI Extraction Response:', JSON.stringify(extraction, null, 2));

  // 2. Chat Query
  const chatRes = await fetch('http://localhost:5000/api/deals/deal-acme-101/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'What should I discuss in my next meeting?',
    }),
  });

  const chatAnswer = await chatRes.json();
  console.log('\nAI Chat Answer:', JSON.stringify(chatAnswer, null, 2));
}

testDemoFlow().catch(console.error);
