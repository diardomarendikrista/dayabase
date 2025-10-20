// Pastikan Anda mengimpor Link jika menggunakan React Router
// import { Link } from 'react-router-dom';

export default function Error404Page() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Angka 404 yang besar */}
        <h1 className="text-9xl font-extrabold text-indigo-600 ">404</h1>

        {/* Judul Halaman */}
        <h2 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Not Found
        </h2>

        {/* Deskripsi */}
        <p className="mt-6 text-lg leading-7 text-gray-600 ">
          Sorry, we couldn’t find the page (or data) you were looking for. The
          URL might be incorrect, or the data may have been moved.
        </p>

        {/* Tombol Aksi (Call to Action) */}
        <div className="mt-10">
          <a // Ganti dengan <Link to="/"> jika menggunakan React Router
            href="/"
            className="rounded-md bg-indigo-600 px-5 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors duration-200"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
