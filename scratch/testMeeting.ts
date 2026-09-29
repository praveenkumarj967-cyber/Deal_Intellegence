async function testMeetingFlow() {
  console.log('--- Testing Meeting Scheduling & New Conversation API Flow ---');

  // 1. Schedule a Meeting
  const mtgRes = await fetch('http://localhost:5000/api/deals/deal-acme-101/meetings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: '30-Day Implementation & Security Review',
      date: '2026-10-05',
      time: '15:00',
      duration: '45 min',
      participants: ['Alex Morgan', 'Sarah Johnson (VP Ops)', 'Mike Chen (Eng)'],
      agenda: 'Walk through 30-day onboarding milestones and sign off technical deployment schedule.',
    }),
  });

  const scheduled = await mtgRes.json();
  console.log('Scheduled Meeting Result:', JSON.stringify(scheduled, null, 2));

  // 2. Fetch all meetings for deal
  const meetingsRes = await fetch('http://localhost:5000/api/deals/deal-acme-101/meetings');
  const meetingsList = await meetingsRes.json();
  console.log('\nTotal Meetings for Acme Deal:', meetingsList.length);
}

testMeetingFlow().catch(console.error);
