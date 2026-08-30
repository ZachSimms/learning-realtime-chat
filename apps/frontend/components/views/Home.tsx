import { Button } from '@/components/ui/button';
import Image from "next/image"
import Link from 'next/link';

import bgImg from '@/public/landing-bg.png';

const Home = () => {

  return (
    <div className="relative min-h-screen">
      <Image
        src={bgImg}
        alt="Background Image"
        // quality={100}
        fill
        sizes="100vw"
        className="absolute -z-10 opacity-90"
      />

      <div className="flex flex-col min-h-screen gap-24 justify-center place-items-center pb-30">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-5xl font-bold">ChatOps</h1>
          <Link href="/auth/login">
            <Button variant="default">Login</Button>
          </Link>
        </div>
        {/* <p className="text-5xl font-bold">...</p> */}
      </div>
    </div>
  );
}

export default Home