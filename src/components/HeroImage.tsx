import { cn } from "@/lib/utils";

interface HeroImageProps {
  className?: string;
}

const HeroImage = ({ className }: HeroImageProps) => {
  return (
    <section className={cn("relative overflow-hidden", className)}>
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 bg-cream-300/50 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#8BAA8B_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>
      
      {/* Hero Image with Parallax Effect */}
      <div className="relative h-80 md:h-96 overflow-hidden animate-fade-in [animation-delay:600ms]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background z-10"></div>
        <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1556911220-e15b29be8c8f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center transform scale-[1.15] bg-no-repeat"></div>
      </div>
    </section>
  );
};

export default HeroImage;
