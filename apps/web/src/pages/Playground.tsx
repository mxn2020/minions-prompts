import Navbar from '../components/landing/Navbar';
import { PlaygroundLayout } from '../components/playground/PlaygroundLayout';
import Footer from '../components/landing/Footer';

export default function Playground() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
                <PlaygroundLayout />
            </main>
            <Footer />
        </div>
    );
}
