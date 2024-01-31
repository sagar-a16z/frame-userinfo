import type { Metadata } from 'next';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: 'frame-userinfo',
  description: 'See your Farcaster usage',
  // openGraph: {
  //   title: 'frame-userinfo',
  //   description: 'See your Farcaster usage',
  //   images: ['https://zizzamia.xyz/park-1.png'],
  // },
  // other: {
  //   },
};

export default function Home() {
  const headersList = headers(); 
  const hosted_url = headersList.get('host');

  return (
    <>
      <h1>frame-userinfo</h1>
      <head>
          <meta property="og:title" content="User Info Frame" />
          <meta property="og:image" content={`${hosted_url}/landing.png`} />
          
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:button:1" content="Click to view usage" />
          
          <meta property="fc:frame:image" content={`${hosted_url}/landing.png`} />
          <meta property="fc:frame:post_url" content={`${hosted_url}/api/`} />

      </head>
    </>
  );
}
