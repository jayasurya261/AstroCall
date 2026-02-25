import Navbar from "@/components/layout/Navbar";

function App() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Navbar />
      <main className="container flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary text-center">
          AstroCall: Video & Voice Calling
        </h1>
        <p className="mt-4 text-xl text-muted-foreground text-center">
          Connect with professional astrologers instantly.
        </p>
      </main>
    </div>
  );
}

export default App;
