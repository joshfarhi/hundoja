import Navigation from '@/components/Navigation';
import CartSidebar from '@/components/CartSidebar';
import Hero from '@/components/Hero';
import FeaturedProducts from '@/components/FeaturedProducts';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <CartSidebar />
      <Hero />
      <FeaturedProducts />
      <Footer />
    </div>
  );
}
