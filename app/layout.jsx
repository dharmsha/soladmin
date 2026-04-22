import "./globals.css";

export const metadata = {
  title: "JobSolution - Job Portal",
  description: "Find your dream job or hire the best talent",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        {children}
      </body>
    </html>
  );
}