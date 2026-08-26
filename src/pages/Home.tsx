import About from '../components/About';
import AllProjects from '../components/AllProjects';
import Featured from '../components/Featured';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Hero from '../components/Hero';

export default function Home() {
  return (
    <div className="page">
      <Header />
      <main>
        <Hero />
        <Featured />
        <AllProjects />
        <About />
      </main>
      <Footer />
    </div>
  );
}
