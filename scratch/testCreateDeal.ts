async function testCreate() {
  try {
    const res = await fetch('http://localhost:5000/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Enterprise Automation Project',
        company: 'Stark Industries',
        value: 180000,
        stage: 'Proposal',
        probability: 60,
      }),
    });

    const data = await res.json();
    console.log('API Response:', data);
  } catch (err) {
    console.error('Error:', err);
  }
}

testCreate();
