export default function Textarea({ className, ...props }) {
  return (
    <textarea
      {...props}
      className={`px-3 py-2 rounded-md border border-gray-700 bg-[#2a2a2a] text-white w-full h-32 ${className}`}
    />
  );
}
