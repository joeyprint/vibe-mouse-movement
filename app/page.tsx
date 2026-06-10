import { HeartGrid } from "@/src/containers/HeartGrid";

export default function Home() {
  return (
    <>
      <HeartGrid />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex flex-col gap-4 items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Mouse Event Animation
          </h1>
          <p className="text-navy text-center">
            Move your mouse over the heart grid to see the animation in action!
          </p>
        </div>
      </div>
    </>
  );
}
