import type { Metadata } from 'next';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: 'frame-userinfo',
  description: 'See your Farcaster usage',
};

export default function Home() {
  const headersList = headers(); 
  const hosted_url = `https://${headersList.get('host')}`;

  return (
    <>
      <h1>frame-userinfo</h1>
      <head>
          <meta property="og:title" content="User Info Frame" />
          <meta property="og:image" content={`${hosted_url}/landing.png`} />
          
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:button:1" content="Press to view your stats" />
          
          <meta property="fc:frame:image" content={`${hosted_url}/landing.png`} />
          <meta property="fc:frame:post_url" content={`${hosted_url}/api/getinfo`} />

      </head>
    </>
  );
}
