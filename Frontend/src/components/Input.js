export default function Input({ className, ...props }) {
  return (
    <input
      {...props}
      className={`px-3 py-2 rounded-md border border-gray-700 bg-[#2a2a2a] text-white ${className}`}
    />
  );
}
