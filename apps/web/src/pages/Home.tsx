import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import QuickStart from '../components/landing/QuickStart';
import CTABanner from '../components/landing/CTABanner';
import Footer from '../components/landing/Footer';

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
                <Hero />
                <Features />
                <QuickStart />
                <CTABanner />
            </main>
            <Footer />
        </div>
    );
}
