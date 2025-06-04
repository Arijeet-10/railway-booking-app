tsx
import { TrainFront } from 'lucide-react';
import Link from 'next/link';

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
      <TrainFront size={32} strokeWidth={2.5} />
      <span className="text-2xl font-bold font-headline">Indian Rail Connect</span>
    </Link>
  );
};

export default Logo;
